const jwt = require("jsonwebtoken");
const Room = require("../models/Room");
const RoomResult = require("../models/RoomResult");

const games = {};

const MAX_PARTICIPANTS = 150;
const LEADERBOARD_DISPLAY_MS = 6500;
const GAME_CLEANUP_MS = 10 * 60 * 1000;



// ================= LEADERBOARD =================

function buildLeaderboard(game) {
  return Object.values(game.participants)
    .map((p) => ({
      participantId: p.participantId,
      name: p.name,

      // Total points
      score: p.score,

      // Total correct answers
      correctCount: p.correctCount,

      // Current question information
      lastCorrect: p.lastCorrect,
      lastPoints: p.lastPoints,
    }))
    .sort((a, b) => b.score - a.score);
}


// ================= TIMER =================

function clearGameTimer(game) {
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }
}

// Keep every lobby screen (especially the host) in sync with the
// authoritative participant list stored in the in-memory game.
function emitParticipantsUpdate(io, roomCode, game) {
  if (!game) return;

  const participants = Object.values(game.participants).map((p) => ({
    participantId: p.participantId,
    name: p.name,
    connected: p.connected !== false,
  }));

  io.to(roomCode).emit("room:participantsUpdate", {
    participants,
    count: participants.length,
  });
}

function sendLobbyStateToSocket(targetSocket, game, roomCode) {
  if (!targetSocket || !game) return;

  const participants = Object.values(game.participants).map((p) => ({
    participantId: p.participantId,
    name: p.name,
    connected: p.connected !== false,
  }));

  targetSocket.emit("room:participantsUpdate", {
    participants,
    count: participants.length,
  });
}


// ================= SEND QUESTION =================

function sendQuestion(io, roomCode) {
  const game = games[roomCode];

  if (!game) return;

  const q = game.questions[game.currentIndex];

  game.questionStartTime = Date.now();
  game.status = "active";

  Object.values(game.participants).forEach((p) => {
    p.hasAnsweredThisRound = false;
    p.lastCorrect = null;
    p.lastPoints = 0;
  });

  io.to(roomCode).emit("quiz:question", {
    questionText: q.questionText,
    options: q.options,
    timeLimit: q.timeLimit,
    timeRemaining: q.timeLimit,
    questionNumber: game.currentIndex + 1,
    totalQuestions: game.questions.length,
  });

  clearGameTimer(game);

  game.timer = setTimeout(() => {
    endQuestion(io, roomCode);
  }, q.timeLimit * 1000);
}


// ================= END QUESTION =================

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
    displayDurationMs: LEADERBOARD_DISPLAY_MS,
  });

  game.timer = setTimeout(() => {
    advanceQuestion(io, roomCode);
  }, LEADERBOARD_DISPLAY_MS);
}


// ================= ADVANCE QUESTION =================

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


// ================= FINISH QUIZ =================

async function finishQuiz(io, roomCode) {
  const game = games[roomCode];

  if (!game || game.status === "finished") return;

  clearGameTimer(game);

  game.status = "finished";

  const leaderboard = buildLeaderboard(game);

  io.to(roomCode).emit("quiz:finished", {
    leaderboard,
  });

  try {
    await Room.findByIdAndUpdate(game.roomId, {
      status: "finished",
    });

    const resultDocs = leaderboard.map((p, idx) => {
      const participant = game.participants[p.participantId];
      const answers = participant?.answers || [];

      const breakdown = game.questions.map((q, questionIndex) => {
        const answer = answers[questionIndex];
        const selectedIndex = Number.isInteger(answer?.selectedIndex) ? answer.selectedIndex : -1;
        return {
          questionText: q.questionText,
          options: q.options,
          selectedIndex,
          correctAnswerIndex: q.correctAnswerIndex,
          imageUrl: q.imageUrl || "",
          explanation: q.explanation || "",
          isCorrect: selectedIndex === q.correctAnswerIndex,
        };
      });

      return {
        room: game.roomId,
        roomCode,
        user: participant?.userId || undefined,
        participantName: p.name,
        score: p.score,
        correctAnswers: participant ? participant.correctCount : 0,
        totalQuestions: game.questions.length,
        rank: idx + 1,
        detailsRetained: true,
        breakdown,
      };
    });

    if (resultDocs.length > 0) {
      await RoomResult.insertMany(resultDocs);

      const userIds = [...new Set(resultDocs.map((doc) => doc.user?.toString()).filter(Boolean))];
      for (const userId of userIds) {
        const history = await RoomResult.find({ user: userId })
          .sort({ createdAt: -1, _id: -1 })
          .select("_id")
          .lean();
        const olderIds = history.slice(7).map((item) => item._id);
        if (olderIds.length) {
          await RoomResult.updateMany(
            { _id: { $in: olderIds }, user: userId },
            { $set: { breakdown: [], detailsRetained: false } }
          );
        }
      }
    }

  } catch (err) {
    console.error(
      "Error saving room results:",
      err.message
    );
  }

  game.cleanupTimer = setTimeout(() => {
    delete games[roomCode];
  }, GAME_CLEANUP_MS);
}


// ================= SOCKET HANDLERS =================

function registerSocketHandlers(io) {

  io.on("connection", (socket) => {


    // ================= HOST ENTER ROOM =================

    socket.on("host:enterRoom", async ({ roomCode, token }) => {
      try {

        const code = (roomCode || "")
          .toUpperCase()
          .trim();

        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        );

        const room = await Room.findOne({
          roomCode: code,
        });

        if (!room) {
          return socket.emit(
            "error:message",
            "Room not found"
          );
        }

        if (room.host.toString() !== decoded.id) {
          return socket.emit(
            "error:message",
            "You are not the host of this room"
          );
        }

        if (!games[code]) {

          games[code] = {
            roomId: room._id,
            hostSocketId: socket.id,
            hostName: room.hostName,
            maxParticipants: room.maxParticipants || MAX_PARTICIPANTS,
            questions: room.questions,
            currentIndex: -1,
            status: "waiting",
            participants: {},
            timer: null,
            cleanupTimer: null,
            questionStartTime: null,
          };

        } else {

          games[code].hostSocketId = socket.id;

        }

        socket.join(code);

        socket.data.roomCode = code;
        socket.data.isHost = true;

        const currentParticipants = Object.values(
          games[code].participants
        ).map((p) => ({
          participantId: p.participantId,
          name: p.name,
          connected: p.connected !== false,
        }));

        socket.emit("room:hostReady", {
          roomCode: code,
          participants: currentParticipants,
          totalQuestions: games[code].questions.length,
        });

        // Send the authoritative lobby state directly to the host too.
        // This avoids relying only on a room broadcast when the host has just
        // joined/reconnected.
        sendLobbyStateToSocket(socket, games[code], code);
        emitParticipantsUpdate(io, code, games[code]);

      } catch (err) {

        console.error(err);

        socket.emit(
          "error:message",
          "Invalid session, please login again"
        );

      }
    });



    // ================= PARTICIPANT JOIN ROOM =================

    socket.on(
      "participant:joinRoom",
      async ({
        roomCode,
        participantName,
        participantId,
        token,
      }) => {
        try {
          // ================= GET LOGGED-IN USER ID =================

          let userId = null;

          if (token) {
            try {
              const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
              );

              userId = decoded.id;
            } catch (err) {
              console.log("Participant token invalid or expired");
              userId = null;
            }
          }

          const code = (roomCode || "")
            .toUpperCase()
            .trim();

          const name = (participantName || "").trim();

          if (!code || !name) {
            return socket.emit(
              "error:message",
              "Room code and name are required"
            );
          }

          let game = games[code];

          // ================= LOAD ROOM =================

          if (!game) {
            const room = await Room.findOne({
              roomCode: code,
            });

            if (!room) {
              return socket.emit(
                "error:message",
                "Room not found. Check the code."
              );
            }

            if (room.status === "finished") {
              return socket.emit(
                "error:message",
                "This quiz has already finished"
              );
            }

            game = {
              roomId: room._id,
              hostSocketId: null,
              hostName: room.hostName,
              maxParticipants: room.maxParticipants || MAX_PARTICIPANTS,
              questions: room.questions,
              currentIndex: -1,
              status: "waiting",
              participants: {},
              timer: null,
              cleanupTimer: null,
              questionStartTime: null,
            };

            games[code] = game;
          }

          // ================= STABLE PARTICIPANT ID =================

          const stableParticipantId =
            participantId || socket.id;

          const existingParticipant =
            game.participants[stableParticipantId];

          // ================= RECONNECT EXISTING PLAYER =================

          if (existingParticipant) {
            existingParticipant.socketId = socket.id;
            existingParticipant.connected = true;

            // Update user ID if logged-in user is available
            if (userId) {
              existingParticipant.userId = userId;
            }

            if (!Array.isArray(existingParticipant.answers)) existingParticipant.answers = [];

            socket.join(code);

            socket.data.roomCode = code;
            socket.data.isHost = false;
            socket.data.participantId =
              stableParticipantId;

            socket.emit("room:joined", {
              roomCode: code,
              hostName: game.hostName,

              participants: Object.values(
                game.participants
              ).map((p) => p.name),

              totalQuestions:
                game.questions.length,
            });

            sendCurrentGameState(
              socket,
              game,
              code
            );

            return;
          }

          // ================= NEW PLAYER JOIN =================

          if (game.status !== "waiting") {
            return socket.emit(
              "error:message",
              "This quiz has already started"
            );
          }

          if (
            Object.keys(game.participants).length >=
            (game.maxParticipants || MAX_PARTICIPANTS)
          ) {
            return socket.emit(
              "error:message",
              `Room is full (${game.maxParticipants || MAX_PARTICIPANTS}/${game.maxParticipants || MAX_PARTICIPANTS} players)`
            );
          }

          // ================= CREATE PARTICIPANT =================

          game.participants[stableParticipantId] = {
            participantId: stableParticipantId,

            socketId: socket.id,

            name,

            // Logged-in user's MongoDB ID
            userId: userId || undefined,

            score: 0,

            correctCount: 0,

            hasAnsweredThisRound: false,

            lastCorrect: null,

            lastPoints: 0,
            answers: [],
            connected: true,
          };

          socket.join(code);

          socket.data.roomCode = code;
          socket.data.isHost = false;
          socket.data.participantId =
            stableParticipantId;

          const participantNames = Object.values(
            game.participants
          ).map((p) => p.name);

          socket.emit("room:joined", {
            roomCode: code,
            hostName: game.hostName,
            participants: participantNames,
            totalQuestions:
              game.questions.length,
          });

          // Send the update directly to the host first, then broadcast to
          // everyone in the room. Direct delivery fixes the common case where
          // a host lobby was rendered before the participant joined.
          if (game.hostSocketId) {
            const hostSocket = io.sockets.sockets.get(game.hostSocketId);
            sendLobbyStateToSocket(hostSocket, game, code);
          }
          emitParticipantsUpdate(io, code, game);
        } catch (err) {
          console.error(err);

          socket.emit(
            "error:message",
            "Could not join room"
          );
        }
      }
    );



    // ================= LOBBY STATE SYNC =================

    socket.on("room:requestState", ({ roomCode }) => {
      const code = (roomCode || "").toUpperCase().trim();
      const game = games[code];

      if (!game) {
        return socket.emit("error:message", "Room not found");
      }

      sendLobbyStateToSocket(socket, game, code);

      socket.emit("room:state", {
        roomCode: code,
        status: game.status,
        totalQuestions: game.questions.length,
      });
    });


    // ================= HOST START QUIZ =================

    socket.on(
      "host:startQuiz",
      ({ roomCode }) => {

        const code = (roomCode || "")
          .toUpperCase()
          .trim();

        const game = games[code];

        if (!game) {
          return socket.emit(
            "error:message",
            "Room not found"
          );
        }

        const isCurrentHost =
          socket.id === game.hostSocketId &&
          socket.data.isHost === true &&
          socket.data.roomCode === code;

        if (!isCurrentHost) {
          return socket.emit(
            "error:message",
            "Only the host can start the quiz. Please reconnect to the room."
          );
        }

        if (
          Object.keys(game.participants).length === 0
        ) {
          return socket.emit(
            "error:message",
            "Wait for at least 1 participant to join"
          );
        }

        game.currentIndex = 0;

        sendQuestion(io, code);

      }
    );



    // ================= PARTICIPANT SUBMIT ANSWER =================

    socket.on(
      "participant:submitAnswer",
      ({ roomCode, selectedIndex }) => {

        const code = (roomCode || "")
          .toUpperCase()
          .trim();

        const game = games[code];

        if (!game || game.status !== "active") {
          return;
        }


        const participantId =
          socket.data.participantId;

        const participant =
          game.participants[participantId];


        if (
          !participant ||
          participant.hasAnsweredThisRound
        ) {
          return;
        }


        const q =
          game.questions[game.currentIndex];


        const timeLimitMs =
          q.timeLimit * 1000;


        const timeTakenMs = Math.min(
          Date.now() - game.questionStartTime,
          timeLimitMs
        );


        const correct =
          selectedIndex === q.correctAnswerIndex;


        let points = 0;


        if (correct) {

          points = Math.round(
            500 +
            500 *
            (1 - timeTakenMs / timeLimitMs)
          );

          participant.correctCount += 1;

        }


        participant.score += points;

        if (!Array.isArray(participant.answers)) participant.answers = [];
        participant.answers[game.currentIndex] = {
          selectedIndex: Number(selectedIndex),
          correctAnswerIndex: q.correctAnswerIndex,
          isCorrect: correct,
        };

        participant.hasAnsweredThisRound = true;

        participant.lastCorrect = correct;

        participant.lastPoints = points;


        socket.emit("answer:ack", {
          correct,
          points,
        });


        const allAnswered =
          Object.values(
            game.participants
          ).every(
            (p) => p.hasAnsweredThisRound
          );


        if (allAnswered) {
          endQuestion(io, code);
        }

      }
    );



    // ================= DISCONNECT =================

    socket.on("disconnect", () => {

      const roomCode =
        socket.data.roomCode;

      if (!roomCode) return;

      const game = games[roomCode];

      if (!game) return;


      if (socket.data.isHost) {

        if (
          game.hostSocketId === socket.id
        ) {

          io.to(roomCode).emit(
            "room:hostLeft"
          );

        }

      } else {

        const participantId =
          socket.data.participantId;

        const participant =
          game.participants[participantId];


        if (participant) {

          // Do NOT delete participant. Preserve score and identity after
          // refresh/reconnect, but immediately update the lobby UI.
          participant.connected = false;
          emitParticipantsUpdate(io, roomCode, game);

        }

      }

    });


  });

}



// ================= CURRENT GAME STATE =================

function sendCurrentGameState(
  socket,
  game,
  roomCode
) {

  if (game.status === "active") {

    const q =
      game.questions[game.currentIndex];


    const elapsed =
      Date.now() - game.questionStartTime;


    const remainingTime = Math.max(
      0,
      Math.ceil(
        (q.timeLimit * 1000 - elapsed) / 1000
      )
    );


    socket.emit("quiz:question", {

      questionText: q.questionText,

      options: q.options,

      timeLimit: q.timeLimit,

      timeRemaining: remainingTime,

      questionNumber:
        game.currentIndex + 1,

      totalQuestions:
        game.questions.length,

    });

  }


  if (game.status === "leaderboard") {

    const q =
      game.questions[game.currentIndex];


    socket.emit("quiz:leaderboard", {

      leaderboard:
        buildLeaderboard(game),

      correctAnswerIndex:
        q.correctAnswerIndex,

      questionNumber:
        game.currentIndex + 1,

      totalQuestions:
        game.questions.length,

    });

  }


  if (game.status === "finished") {

    socket.emit("quiz:finished", {

      leaderboard:
        buildLeaderboard(game),

    });

  }

}



module.exports = registerSocketHandlers;