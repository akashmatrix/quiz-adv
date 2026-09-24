import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import socket from "../socket";
import LoadingState from "../components/LoadingState";

export default function QuizPreview() {
  const location = useLocation();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(location.state?.quiz || null);
  const [hideAnswers, setHideAnswers] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");

  if (!quiz) {
    return (
      <div className="min-h-screen bg-[#080014] text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold mb-2">No Quiz Found</h2>
          <p className="text-gray-400 text-sm mb-6">
            Please create a new quiz with AI to preview it.
          </p>
          <button
            onClick={() => navigate("/create-quiz")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold hover:scale-105 transition"
          >
            Create AI Quiz →
          </button>
        </div>
      </div>
    );
  }

  // Calculate estimated duration
  const estSeconds = (quiz.questions?.length || 10) * (quiz.timePerQuestion || 30);
  const estMinutes = Math.ceil(estSeconds / 60);

  // Start Solo Practice
  const handleStartSolo = () => {
    navigate("/practice", {
      state: { quiz },
    });
  };

  // Create Multiplayer Room from this Quiz
  const handleCreateRoom = async () => {
    setLoadingAction("Creating room...");
    setError("");

    try {
      const res = await api.post("/rooms/create", {
        quizId: quiz._id,
        title: quiz.title,
        timeLimit: quiz.timePerQuestion || 20,
      });

      const roomCode = res.data.roomCode;

      if (!socket.connected) {
        socket.connect();
      }

      navigate(`/room/${roomCode}`, {
        state: { isHost: true },
      });
    } catch (err) {
      console.error("Create room error:", err);
      setError(err.response?.data?.message || "Could not create multiplayer room");
      setLoadingAction("");
    }
  };

  // Regenerate quiz with the same preferences but non-duplicate questions
  const handleRegenerate = async () => {
    setLoadingAction("Regenerating with new questions...");
    setError("");

    try {
      const res = await api.post("/ai/regenerate-quiz", {
        quizId: quiz._id,
      });

      if (res.data?.quiz) {
        setQuiz(res.data.quiz);
      }
    } catch (err) {
      console.error("Regenerate failed:", err);
      setError(err.response?.data?.message || "Could not regenerate quiz");
    } finally {
      setLoadingAction("");
    }
  };

  // Edit preferences
  const handleEditPreferences = () => {
    navigate("/create-quiz", {
      state: {
        subject: quiz.subject,
        topic: quiz.topic,
      },
    });
  };

  if (loadingAction) {
    return (
      <div className="min-h-screen bg-[#080014] flex items-center justify-center px-4">
        <LoadingState title={loadingAction} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080014] text-white px-4 py-10 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="fixed top-10 left-10 w-96 h-96 bg-pink-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header Summary Card */}
        <div className="rounded-3xl border border-white/10 bg-[#120a21]/80 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 text-xs font-semibold text-pink-300 uppercase tracking-wider mb-2">
                ✨ AI Generated Quiz
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-gray-400 text-sm mt-1">{quiz.description}</p>
              )}
            </div>

            {/* Answer Hide/Show Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-gray-300 font-medium">Hide Answers</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideAnswers}
                  onChange={(e) => setHideAnswers(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
              </label>
            </div>
          </div>

          {/* Metadata Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <p className="text-xs text-gray-400">Subject & Topic</p>
              <p className="text-sm font-bold text-pink-300 truncate mt-0.5">
                {quiz.subject} {quiz.topic ? `• ${quiz.topic}` : ""}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <p className="text-xs text-gray-400">Difficulty</p>
              <p className="text-sm font-bold text-purple-300 mt-0.5">{quiz.difficulty}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <p className="text-xs text-gray-400">Questions</p>
              <p className="text-sm font-bold text-indigo-300 mt-0.5">
                {quiz.questions?.length || 0} Questions
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <p className="text-xs text-gray-400">Est. Duration</p>
              <p className="text-sm font-bold text-emerald-300 mt-0.5">
                ~{estMinutes} min ({quiz.timePerQuestion > 0 ? `${quiz.timePerQuestion}s/Q` : "Untimed"})
              </p>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <button
              onClick={handleStartSolo}
              className="py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-md shadow-pink-500/20 hover:scale-[1.02] transition"
            >
              🎯 Start Solo
            </button>

            <button
              onClick={handleCreateRoom}
              className="py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-500/20 hover:scale-[1.02] transition"
            >
              ⚡ Create Room
            </button>

            <button
              onClick={handleRegenerate}
              className="py-3 px-4 rounded-xl font-semibold text-sm text-gray-200 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-pink-500/30 transition"
            >
              🔄 Generate Again
            </button>

            <button
              onClick={handleEditPreferences}
              className="py-3 px-4 rounded-xl font-semibold text-sm text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              ⚙️ Edit Options
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Questions Preview List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Review Generated Questions</h2>
            <span className="text-xs text-gray-400">
              {quiz.questions?.length} items ready
            </span>
          </div>

          {quiz.questions?.map((q, idx) => (
            <div
              key={q._id || idx}
              className="p-5 sm:p-6 rounded-3xl border border-white/10 bg-[#120a21]/60 backdrop-blur-xl transition hover:border-white/20"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300 flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </span>
                <p className="font-semibold text-base sm:text-lg text-white leading-relaxed">
                  {q.questionText}
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 pl-11">
                {q.options?.map((opt, optIdx) => {
                  const isCorrect = optIdx === q.correctAnswerIndex;
                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-xl border text-sm transition flex items-center gap-2.5 ${
                        !hideAnswers && isCorrect
                          ? "bg-green-500/15 border-green-500/40 text-green-300 font-semibold"
                          : "bg-white/[0.02] border-white/5 text-gray-300"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold ${
                          !hideAnswers && isCorrect
                            ? "bg-green-500/20 text-green-400"
                            : "bg-white/10 text-gray-400"
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="flex-1 truncate">{opt}</span>
                      {!hideAnswers && isCorrect && (
                        <span className="text-green-400 text-xs font-bold">✓ Correct</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {!hideAnswers && q.explanation && (
                <div className="ml-11 p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs sm:text-sm text-purple-200">
                  <span className="font-bold text-pink-300">💡 Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
