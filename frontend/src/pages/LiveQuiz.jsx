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
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);

  useEffect(() => {
    function handleQuestion(data) {
      setQuestion(data);
      setSelected(null);
      setPhase("question");
    setTimeLeft(data.timeRemaining ?? data.timeLimit);  
    }

    function handleLeaderboard(data) {
      setLeaderboard(data.leaderboard);
      setCorrectAnswerIndex(data.correctAnswerIndex);
      setPhase("leaderboard");
    }

    function handleFinished(data) {
      setFinalLeaderboard(data.leaderboard);
      setPhase("finished");
    }
    // Reconnect participant after page refresh
if (!isHost) {
  const participantId = localStorage.getItem(
    `quizneon-participant-${roomCode}`
  );

  const participantName = localStorage.getItem(
    `quizneon-name-${roomCode}`
  );

  if (participantId && participantName) {
    socket.emit("participant:joinRoom", {
      roomCode,
      participantName,
      participantId,
    });
  }
}

    socket.on("quiz:question", handleQuestion);
    socket.on("quiz:leaderboard", handleLeaderboard);
    socket.on("quiz:finished", handleFinished);

    return () => {
      socket.off("quiz:question", handleQuestion);
      socket.off("quiz:leaderboard", handleLeaderboard);
      socket.off("quiz:finished", handleFinished);
    };
  }, []);

  // Countdown Timer
  useEffect(() => {
    if (phase !== "question" || timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  const selectAnswer = (idx) => {
    if (selected !== null || isHost) return;

    setSelected(idx);

    socket.emit("participant:submitAnswer", {
      roomCode,
      selectedIndex: idx,
    });
  };

  // Final Results
  if (phase === "finished") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#080014] text-white">

        <div className="relative w-full max-w-xl p-8 rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl shadow-2xl">

          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🏆</div>

            <h2 className="text-3xl font-extrabold">
              Final Results
            </h2>

            <p className="text-gray-400 text-sm mt-2">
              Quiz completed successfully!
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {finalLeaderboard.map((p, idx) => (
              <div
                key={idx}
                className={`flex justify-between items-center px-4 py-4 rounded-xl border ${idx === 0
                    ? "bg-yellow-500/10 border-yellow-400/40"
                    : "bg-white/5 border-white/10"
                  }`}
              >
                <span className="font-semibold">
                  {idx + 1}. {p.name} {idx === 0 && "🏆"}
                </span>

                <span className="font-bold text-pink-400">
                  {p.score} pts
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-lg transition hover:scale-[1.02]"
          >
            Back to Home →
          </button>
        </div>
      </div>
    );
  }

  // Leaderboard
  if (phase === "leaderboard") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#080014] text-white">

        <div className="relative w-full max-w-xl p-8 rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl shadow-2xl">

          <div className="text-center mb-8">
            <div className="text-4xl mb-3">📊</div>

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
                key={idx}
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
                  {p.score} pts
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

  // Loading Question
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

  // Live Question Screen
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
                Math.min(100, (timeLeft / (question.timeLimit || 1)) * 100)
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