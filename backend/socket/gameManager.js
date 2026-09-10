const jwt = require("jsonwebtoken");
const Room = require("../models/Room");
const RoomResult = require("../models/RoomResult");

// Live game state kept in memory for speed (roomCode -> gameState).
// Questions + correct answers live here too, so they are NEVER sent to participants
// until AFTER they submit an answer.
const games = {};

const MAX_PARTICIPANTS = 50;
const LEADERBOARD_DISPLAY_MS = 5000; // auto-advance to next question after 5 seconds

function buildLeaderboard(game) {
  return Object.values(game.participants)
    .map((p) => ({
      name: p.name,
      score: p.score,
      lastCorrect: p.lastCorrect,
      lastPoints: p.lastPoints,
    }))
    .sort((a, b) => b.score - a.score);
}

function clearGameTimer(game) {
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }
}

function sendQuestion(io, roomCode) {
  const game = games[roomCode];
  if (!game) return;

  const q = game.questions[game.currentIndex];
  game.questionStartTime = Date.now();
  game.status = "active";

  // reset per-round flags for every participant
  Object.values(game.participants).forEach((p) => {
    p.hasAnsweredThisRound = false;
    p.lastCorrect = null;
    p.lastPoints = 0;
  });

  io.to(roomCode).emit("quiz:question", {
    questionText: q.questionText,
    options: q.options, // correctAnswerIndex is intentionally NOT sent here
    timeLimit: q.timeLimit,
    questionNumber: game.currentIndex + 1,
    totalQuestions: game.questions.length,
  });

  clearGameTimer(game);
  game.timer = setTimeout(() => endQuestion(io, roomCode), q.timeLimit * 1000);
}

function endQuestion(io, roomCode) {
  const game = games[roomCode];
  if (!game || game.status !== "active") return;

  clearGameTimer(game);
  game.status = "leaderboard";

  const q = game.questions[game.currentIndex];
  const leaderboard = buildLeaderboard(game);

  io.to(roomCode).emit("quiz:leaderboard", {
    leaderboard,
    correctAnswerIndex: q.correctAnswerIndex,
    questionNumber: game.currentIndex + 1,
    totalQuestions: game.questions.length,
  });

  // Auto-advance to the next question after a short pause
  game.timer = setTimeout(() => advanceQuestion(io, roomCode), LEADERBOARD_DISPLAY_MS);
}

async function advanceQuestion(io, roomCode) {
  const game = games[roomCode];
  if (!game) return;

  game.currentIndex += 1;

  if (game.currentIndex >= game.questions.length) {
    await finishQuiz(io, roomCode);
  } else {
    sendQuestion(io, roomCode);
  }
}

async function finishQuiz(io, roomCode) {
  const game = games[roomCode];
  if (!game) return;

  clearGameTimer(game);
  game.status = "finished";

  const leaderboard = buildLeaderboard(game);
  io.to(roomCode).emit("quiz:finished", { leaderboard });

  try {
    await Room.findByIdAndUpdate(game.roomId, { status: "finished" });

    const resultDocs = leaderboard.map((p, idx) => {
      const participant = Object.values(game.participants).find((x) => x.name === p.name);
      return {
        room: game.roomId,
        roomCode,
        participantName: p.name,
        score: p.score,
        correctAnswers: participant ? participant.correctCount : 0,
        totalQuestions: game.questions.length,
        rank: idx + 1,
      };
    });
    await RoomResult.insertMany(resultDocs);
  } catch (err) {
    console.error("Error saving room results:", err.message);
  }

  // Free up memory a while after the quiz ends
  setTimeout(() => delete games[roomCode], 10 * 60 * 1000);
}

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    // ---------- HOST: attach to a room they already created via REST ----------
    socket.on("host:enterRoom", async ({ roomCode, token }) => {
      try {
        const code = (roomCode || "").toUpperCase().trim();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const room = await Room.findOne({ roomCode: code });

        if (!room) return socket.emit("error:message", "Room not found");
        if (room.host.toString() !== decoded.id) {
          return socket.emit("error:message", "You are not the host of this room");
        }

        if (!games[code]) {
          games[code] = {
            roomId: room._id,
            hostSocketId: socket.id,
            hostName: room.hostName,
            questions: room.questions,
            currentIndex: -1,
            status: "waiting",
            participants: {},
            timer: null,
            questionStartTime: null,
          };
        } else {
          games[code].hostSocketId = socket.id;
        }

        socket.join(code);
        socket.data.roomCode = code;
        socket.data.isHost = true;

        socket.emit("room:hostReady", {
          roomCode: code,
          participants: Object.values(games[code].participants).map((p) => p.name),
          totalQuestions: games[code].questions.length,
        });
      } catch (err) {
        socket.emit("error:message", "Invalid session, please login again");
      }
    });

    // ---------- PARTICIPANT: join a room with just a name (no login needed) ----------
    socket.on("participant:joinRoom", async ({ roomCode, participantName }) => {
      try {
        const code = (roomCode || "").toUpperCase().trim();
        const name = (participantName || "").trim();

        if (!code || !name) {
          return socket.emit("error:message", "Room code and name are required");
        }

        let game = games[code];

        if (!game) {
          const room = await Room.findOne({ roomCode: code });
          if (!room) return socket.emit("error:message", "Room not found. Check the code.");
          if (room.status === "finished") {
            return socket.emit("error:message", "This quiz has already finished");
          }

          game = {
            roomId: room._id,
            hostSocketId: null,
            hostName: room.hostName,
            questions: room.questions,
            currentIndex: -1,
            status: "waiting",
            participants: {},
            timer: null,
            questionStartTime: null,
          };
          games[code] = game;
        }

        if (game.status !== "waiting") {
          return socket.emit("error:message", "This quiz has already started");
        }

        if (Object.keys(game.participants).length >= MAX_PARTICIPANTS) {
          return socket.emit("error:message", "Room is full (50/50 players)");
        }

        const nameTaken = Object.values(game.participants).some(
          (p) => p.name.toLowerCase() === name.toLowerCase()
        );
        if (nameTaken) {
          return socket.emit("error:message", "This name is already taken in the room");
        }

        game.participants[socket.id] = {
          name,
          score: 0,
          correctCount: 0,
          hasAnsweredThisRound: false,
          lastCorrect: null,
          lastPoints: 0,
        };

        socket.join(code);
        socket.data.roomCode = code;
        socket.data.isHost = false;

        const participantNames = Object.values(game.participants).map((p) => p.name);

        socket.emit("room:joined", {
          roomCode: code,
          hostName: game.hostName,
          participants: participantNames,
          totalQuestions: game.questions.length,
        });

        io.to(code).emit("room:participantsUpdate", participantNames);
      } catch (err) {
        console.error(err);
        socket.emit("error:message", "Could not join room");
      }
    });

    // ---------- HOST: start the quiz ----------
    socket.on("host:startQuiz", ({ roomCode }) => {
      const code = (roomCode || "").toUpperCase().trim();
      const game = games[code];
      if (!game) return socket.emit("error:message", "Room not found");
      if (socket.id !== game.hostSocketId) {
        return socket.emit("error:message", "Only the host can start the quiz");
      }
      if (Object.keys(game.participants).length === 0) {
        return socket.emit("error:message", "Wait for at least 1 participant to join");
      }

      game.currentIndex = 0;
      sendQuestion(io, code);
    });

    // ---------- PARTICIPANT: submit an answer ----------
    socket.on("participant:submitAnswer", ({ roomCode, selectedIndex }) => {
      const code = (roomCode || "").toUpperCase().trim();
      const game = games[code];
      if (!game || game.status !== "active") return;

      const participant = game.participants[socket.id];
      if (!participant || participant.hasAnsweredThisRound) return;

      const q = game.questions[game.currentIndex];
      const timeLimitMs = q.timeLimit * 1000;
      const timeTakenMs = Math.min(Date.now() - game.questionStartTime, timeLimitMs);
      const correct = selectedIndex === q.correctAnswerIndex;

      // Kahoot-style scoring: faster correct answers earn more points (500-1000)
      let points = 0;
      if (correct) {
        points = Math.round(500 + 500 * (1 - timeTakenMs / timeLimitMs));
        participant.correctCount += 1;
      }

      participant.score += points;
      participant.hasAnsweredThisRound = true;
      participant.lastCorrect = correct;
      participant.lastPoints = points;

      socket.emit("answer:ack", { correct, points });

      // If everyone has answered, end the question early instead of waiting for the timer
      const allAnswered = Object.values(game.participants).every((p) => p.hasAnsweredThisRound);
      if (allAnswered) endQuestion(io, code);
    });

    // ---------- DISCONNECT ----------
    socket.on("disconnect", () => {
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;
      const game = games[roomCode];
      if (!game) return;

      if (socket.data.isHost) {
        io.to(roomCode).emit("room:hostLeft");
      } else if (game.participants[socket.id]) {
        delete game.participants[socket.id];
        const participantNames = Object.values(game.participants).map((p) => p.name);
        io.to(roomCode).emit("room:participantsUpdate", participantNames);
      }
    });
  });
}

module.exports = registerSocketHandlers;
