import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import socket from "../socket.js";

export default function LiveQuiz() {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isHost = location.state?.isHost || false;

  const [phase, setPhase] = useState("question");

  const [question, setQuestion] = useState(
    location.state?.initialQuestion || null
  );

  const [selected, setSelected] = useState(null);

  const [timeLeft, setTimeLeft] = useState(
    location.state?.initialQuestion?.timeLimit || 0
  );

  const [leaderboard, setLeaderboard] = useState([]);

  const [finalLeaderboard, setFinalLeaderboard] = useState([]);

  // =========================================================
  // PARTICIPANT ID + NAME
  // =========================================================

  const participantId = localStorage.getItem(
    `quizneon-participant-${roomCode}`
  );

  const participantName = localStorage.getItem(
    `quizneon-name-${roomCode}`
  );

  // =========================================================
  // SOCKET EVENTS
  // =========================================================

  useEffect(() => {
    function handleQuestion(data) {
      setQuestion(data);
      setSelected(null);
      setPhase("question");
      setTimeLeft(data.timeRemaining ?? data.timeLimit ?? 0);
    }

    function handleLeaderboard(data) {
      setLeaderboard(data.leaderboard || []);
      setPhase("leaderboard");
    }

    function handleFinished(data) {
      setFinalLeaderboard(data.leaderboard || []);
      setPhase("finished");
    }

    socket.on("quiz:question", handleQuestion);
    socket.on("quiz:leaderboard", handleLeaderboard);
    socket.on("quiz:finished", handleFinished);

    // =======================================================
    // RECONNECT PARTICIPANT AFTER REFRESH
    // =======================================================

    if (!isHost) {
      const savedParticipantId = localStorage.getItem(
        `quizneon-participant-${roomCode}`
      );

      const savedParticipantName = localStorage.getItem(
        `quizneon-name-${roomCode}`
      );

      const token = localStorage.getItem("token");

      if (savedParticipantId && savedParticipantName) {
        socket.emit("participant:joinRoom", {
          roomCode,
          participantName: savedParticipantName,
          participantId: savedParticipantId,
          token,
        });
      }
    }

    return () => {
      socket.off("quiz:question", handleQuestion);
      socket.off("quiz:leaderboard", handleLeaderboard);
      socket.off("quiz:finished", handleFinished);
    };
  }, [roomCode, isHost]);

  // =========================================================
  // COUNTDOWN TIMER
  // =========================================================

  useEffect(() => {
    if (phase !== "question" || timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  // =========================================================
  // SELECT ANSWER
  // =========================================================

  const selectAnswer = (idx) => {
    if (selected !== null || isHost) return;

    setSelected(idx);

    socket.emit("participant:submitAnswer", {
      roomCode,
      selectedIndex: idx,
    });
  };

  // =========================================================
  // FINAL RESULTS
  // =========================================================

  if (phase === "finished") {
    const sortedLeaderboard = [...finalLeaderboard].sort(
      (a, b) => b.score - a.score
    );

    // -------------------------------------------------------
    // TOP 3
    // -------------------------------------------------------

    const topThree = sortedLeaderboard.slice(0, 3);

    // -------------------------------------------------------
    // FIND CURRENT PARTICIPANT BY participantId
    // -------------------------------------------------------

    const myIndex =
      !isHost && participantId
        ? sortedLeaderboard.findIndex(
          (p) => p.participantId === participantId
        )
        : -1;

    const myResult =
      myIndex !== -1
        ? sortedLeaderboard[myIndex]
        : null;

    const myRank =
      myIndex !== -1
        ? myIndex + 1
        : null;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#080014] text-white">

        {/* Background Glow */}
        <div className="fixed top-10 left-10 w-72 h-72 bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="fixed bottom-10 right-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Main Card */}
        <div className="relative w-full max-w-xl p-8 rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl shadow-2xl">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="text-center mb-8">

            <div className="text-5xl mb-4">
              🏆
            </div>

            <h2 className="text-3xl font-extrabold">
              Final Leaderboard
            </h2>

            <p className="text-gray-400 text-sm mt-2">
              Quiz completed successfully!
            </p>

          </div>

          {/* =================================================
              TOP 3
          ================================================= */}

          <div className="space-y-3">

            {topThree.map((p, index) => {
              const rank = index + 1;

              const isMe =
                !isHost &&
                participantId &&
                p.participantId === participantId;

              return (
                <div
                  key={p.participantId || `${p.name}-${index}`}
                  className={`flex items-center justify-between gap-4 px-4 py-4 rounded-2xl border transition hover:scale-[1.01] ${rank === 1
                      ? "bg-yellow-500/10 border-yellow-400/40"
                      : rank === 2
                        ? "bg-gray-400/10 border-gray-400/30"
                        : "bg-orange-500/10 border-orange-400/30"
                    }`}
                >

                  {/* Player Information */}
                  <div className="flex items-center gap-3 min-w-0">

                    <div className="text-2xl w-9 text-center">
                      {rank === 1
                        ? "🥇"
                        : rank === 2
                          ? "🥈"
                          : "🥉"}
                    </div>

                    <div className="min-w-0">

                      <p className="font-bold truncate">
                        #{rank} {p.name}

                        {isMe && (
                          <span className="ml-2 text-xs text-pink-300">
                            YOU
                          </span>
                        )}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        {p.correctCount ?? 0}/
                        {p.totalQuestions ??
                          sortedLeaderboard[0]?.totalQuestions ??
                          "?"}{" "}
                        correct
                      </p>

                    </div>

                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">

                    <p className="font-extrabold text-pink-400">
                      {p.score ?? 0} pts
                    </p>

                  </div>

                </div>
              );
            })}

          </div>

          {/* =================================================
              MORE PLAYERS
          ================================================= */}

          {sortedLeaderboard.length > 3 && (
            <div className="my-6 text-center text-gray-500 text-xl tracking-[0.4em]">
              •••
            </div>
          )}

          {/* =================================================
              YOUR RESULT
              PARTICIPANT ONLY
              RANK > 3
          ================================================= */}

          {!isHost && myResult && myRank > 3 && (
            <div className="mt-4 p-6 rounded-2xl border border-pink-400/30 bg-gradient-to-r from-pink-500/10 to-purple-500/10">

              <p className="text-xs uppercase tracking-[0.2em] text-pink-300 font-bold text-center">
                Your Rank
              </p>

              <div className="mt-5 text-center">

                <p className="text-3xl font-extrabold">
                  #{myRank}
                </p>

                <p className="mt-3 text-2xl font-extrabold text-pink-400">
                  {myResult.score ?? 0} pts
                </p>

                <p className="mt-2 text-sm text-gray-400">
                  {myResult.correctCount ?? 0}/
                  {myResult.totalQuestions ??
                    sortedLeaderboard[0]?.totalQuestions ??
                    "?"}{" "}
                  correct
                </p>

              </div>

            </div>
          )}

          {/* =================================================
              TOP 3 CONGRATULATIONS
              PARTICIPANT ONLY
          ================================================= */}

          {!isHost && myResult && myRank <= 3 && (
            <div className="mt-5 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">

              <p className="text-green-300 font-semibold">
                🎉 Congratulations!
              </p>

              <p className="text-sm text-gray-400 mt-1">
                You finished in the Top 3.
              </p>

            </div>
          )}

          {/* =================================================
              PARTICIPANT RESULT NOT FOUND
          ================================================= */}

          {!isHost && !myResult && (
            <div className="mt-5 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">

              <p className="text-yellow-300 text-sm">
                Your personal result could not be found.
              </p>

            </div>
          )}

          {/* =================================================
              HOST MESSAGE
          ================================================= */}

          {isHost && (
            <div className="mt-5 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">

              <p className="text-purple-300 text-sm">
                👑 You are the host of this quiz.
              </p>

            </div>
          )}

          {/* =================================================
              BACK HOME
          ================================================= */}

          <button
            onClick={() => navigate("/")}
            className="w-full mt-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-lg transition hover:scale-[1.02]"
          >
            Back to Home →
          </button>

        </div>
      </div>
    );
  }

  // =========================================================
  // QUESTION-BY-QUESTION LEADERBOARD
  // =========================================================

  if (phase === "leaderboard") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#080014] text-white">

        <div className="relative w-full max-w-xl p-8 rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl shadow-2xl">

          <div className="text-center mb-8">

            <div className="text-4xl mb-3">
              📊
            </div>

            <h2 className="text-3xl font-extrabold">
              Leaderboard
            </h2>

            <p className="text-sm text-gray-400 mt-2">
              Next question will start automatically...
            </p>

          </div>

          <div className="space-y-3">

            {leaderboard.map((p, idx) => (
              <div
                key={p.participantId || idx}
                className="flex justify-between items-center px-4 py-4 rounded-xl bg-white/5 border border-white/10"
              >

                <div>

                  <p className="font-semibold">
                    {idx + 1}. {p.name}
                  </p>

                  {p.lastCorrect === true && (
                    <p className="text-sm text-green-400 mt-1">
                      ✅ +{p.lastPoints}
                    </p>
                  )}

                  {p.lastCorrect === false && (
                    <p className="text-sm text-red-400 mt-1">
                      ❌ Incorrect
                    </p>
                  )}

                </div>

                <span className="font-bold text-purple-400">
                  {p.score ?? 0} pts
                </span>

              </div>
            ))}

          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            Keep going! 🚀
          </div>

        </div>
      </div>
    );
  }

  // =========================================================
  // LOADING QUESTION
  // =========================================================

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080014] text-white">

        <div className="text-center">

          <div className="text-5xl mb-4 animate-bounce">
            🧠
          </div>

          <h2 className="text-2xl font-bold">
            Loading Question...
          </h2>

          <p className="text-gray-400 mt-2">
            Please wait
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // LIVE QUESTION SCREEN
  // =========================================================

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#080014] text-white">

      {/* Background Glow */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-pink-600/20 rounded-full blur-[120px]" />

      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-xl p-8 rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">

          <div>

            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Live Quiz
            </p>

            <p className="text-sm text-gray-300 mt-1">
              Question {question.questionNumber} of{" "}
              {question.totalQuestions}
            </p>

          </div>

          <div
            className={`px-4 py-2 rounded-xl border font-bold ${timeLeft <= 5
                ? "text-red-400 border-red-500/40 bg-red-500/10 animate-pulse"
                : "text-pink-400 border-pink-500/30 bg-pink-500/10"
              }`}
          >
            ⏱ {timeLeft}s
          </div>

        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-white/10 mb-8 overflow-hidden">

          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-1000"
            style={{
              width: `${Math.max(
                0,
                Math.min(
                  100,
                  (timeLeft / (question.timeLimit || 1)) * 100
                )
              )}%`,
            }}
          />

        </div>

        {/* Question */}
        <div className="p-5 rounded-2xl bg-black/20 border border-white/10 mb-6">

          <h2 className="text-xl md:text-2xl font-bold leading-relaxed">
            {question.questionText}
          </h2>

        </div>

        {/* Host View */}
        {isHost ? (
          <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">

            <div className="text-4xl mb-3">
              🎯
            </div>

            <p className="text-gray-300">
              Players are answering on their own screens...
            </p>

            <p className="text-sm text-gray-500 mt-2">
              Watch the leaderboard after the question ends.
            </p>

          </div>
        ) : (
          <div className="space-y-3">

            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => selectAnswer(idx)}
                disabled={selected !== null}
                className={`w-full flex items-center gap-3 text-left px-4 py-4 rounded-xl border transition duration-200 ${selected === idx
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 border-pink-400 text-white"
                    : "bg-white/5 border-white/10 text-gray-200 hover:bg-purple-500/20 hover:border-purple-400"
                  } disabled:cursor-not-allowed`}
              >

                <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/20 font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>

                <span className="font-medium">
                  {opt}
                </span>

              </button>
            ))}

            {selected !== null && (
              <div className="mt-5 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">

                <p className="text-sm text-green-300">
                  ✅ Answer submitted!
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Waiting for other players or timer...
                </p>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}