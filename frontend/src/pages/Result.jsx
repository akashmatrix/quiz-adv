import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#080014] text-white relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-pink-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-md p-8 text-center rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl shadow-2xl">
          <div className="text-5xl mb-4">📋</div>

          <h2 className="text-2xl font-bold mb-3">
            No Result Found
          </h2>

          <p className="text-gray-400 text-sm mb-6">
            Complete a quiz to view your result.
          </p>

          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold transition hover:scale-[1.02]"
          >
            Take a Quiz →
          </button>
        </div>
      </div>
    );
  }

  const {
    score = 0,
    totalQuestions = 0,
    breakdown = [],
  } = state;

  const correctAnswers = breakdown.filter(
    (item) => item.isCorrect
  ).length;

  const wrongAnswers = breakdown.filter(
    (item) => !item.isCorrect && item.selectedIndex !== -1
  ).length;

  const unanswered = breakdown.filter(
    (item) => item.selectedIndex === -1
  ).length;

  const percentage =
    totalQuestions > 0
      ? Math.round((score / totalQuestions) * 100)
      : 0;

  const getOptionLetter = (index) => {
    if (index === undefined || index === null || index < 0) {
      return null;
    }

    return String.fromCharCode(65 + index);
  };

  const getResultIcon = () => {
    if (percentage >= 80) return "🏆";
    if (percentage >= 60) return "🎉";
    if (percentage >= 40) return "👍";
    return "💪";
  };

  const getResultMessage = () => {
    if (percentage >= 80) {
      return "Excellent performance!";
    }

    if (percentage >= 60) {
      return "Great job! Keep improving.";
    }

    if (percentage >= 40) {
      return "Good attempt! You can do even better.";
    }

    return "Keep practicing and come back stronger.";
  };

  return (
    <div className="min-h-screen px-4 py-10 bg-[#080014] text-white relative overflow-hidden">

      {/* Background Glow */}
      <div className="fixed top-10 left-10 w-72 h-72 bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">

        {/* ================= RESULT HEADER ================= */}

        <div className="p-7 sm:p-9 rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl shadow-2xl mb-6">

          <div className="text-center">

            <div className="text-6xl mb-4">
              {getResultIcon()}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold">
              Quiz Completed!
            </h1>

            <p className="text-gray-400 text-sm mt-2">
              {getResultMessage()}
            </p>

          </div>

          {/* Score */}
          <div className="my-8 text-center">

            <p className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              {score} / {totalQuestions}
            </p>

            <p className="text-gray-400 mt-3">
              Overall Score{" "}
              <span className="text-pink-400 font-bold">
                {percentage}%
              </span>
            </p>

          </div>

          {/* Progress */}
          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">

            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-700"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, percentage)
                )}%`,
              }}
            />

          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">

            {/* Correct */}
            <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-center">
              <p className="text-2xl mb-1">✅</p>

              <p className="text-2xl font-extrabold text-green-400">
                {correctAnswers}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Correct
              </p>
            </div>

            {/* Wrong */}
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center">
              <p className="text-2xl mb-1">❌</p>

              <p className="text-2xl font-extrabold text-red-400">
                {wrongAnswers}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Wrong
              </p>
            </div>

            {/* Unanswered */}
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-center">
              <p className="text-2xl mb-1">⏭️</p>

              <p className="text-2xl font-extrabold text-yellow-400">
                {unanswered}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Unanswered
              </p>
            </div>

            {/* Total */}
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4 text-center">
              <p className="text-2xl mb-1">📝</p>

              <p className="text-2xl font-extrabold text-purple-400">
                {totalQuestions}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Total
              </p>
            </div>

          </div>

        </div>

        {/* ================= ANSWER REVIEW ================= */}

        <div className="p-6 md:p-8 rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl shadow-2xl">

          <div className="flex items-center justify-between gap-3 mb-6">

            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                Answer Review
              </h2>

              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Check your answers and correct options
              </p>
            </div>

            <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400">
              {breakdown.length} Questions
            </div>

          </div>

          {/* Questions */}
          <div className="space-y-4">

            {breakdown.map((item, idx) => {

              const selectedLetter = getOptionLetter(
                item.selectedIndex
              );

              const correctLetter = getOptionLetter(
                item.correctAnswerIndex
              );

              return (
                <div
                  key={item.questionId || idx}
                  className={`p-5 rounded-2xl border transition ${item.isCorrect
                    ? "border-green-500/30 bg-green-500/10"
                    : "border-red-500/30 bg-red-500/10"
                    }`}
                >

                  {/* Question */}
                  <div className="flex items-start justify-between gap-4">

                    <div className="flex gap-3">

                      <div
                        className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold ${item.isCorrect
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                          }`}
                      >
                        {idx + 1}
                      </div>

                      <p className="font-semibold leading-relaxed text-gray-100">
                        {item.questionText}
                      </p>

                    </div>

                    <span className="text-xl flex-shrink-0">
                      {item.isCorrect ? "✅" : "❌"}
                    </span>

                  </div>

                  {/* Answer Information */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">

                    {/* Your Answer */}
                    <div className="rounded-xl bg-black/20 border border-white/10 p-3">

                      <p className="text-xs text-gray-500 mb-1">
                        Your Answer
                      </p>

                      {selectedLetter ? (
                        <p
                          className={`font-bold ${item.isCorrect
                            ? "text-green-400"
                            : "text-red-400"
                            }`}
                        >
                          Option {selectedLetter}
                        </p>
                      ) : (
                        <p className="font-bold text-yellow-400">
                          Not Answered
                        </p>
                      )}

                    </div>

                    {/* Correct Answer */}
                    <div className="rounded-xl bg-black/20 border border-white/10 p-3">

                      <p className="text-xs text-gray-500 mb-1">
                        Correct Answer
                      </p>

                      <p className="font-bold text-green-400">
                        Option {correctLetter}
                      </p>

                    </div>

                  </div>

                  {/* Status */}
                  <div className="mt-4">

                    {item.isCorrect ? (
                      <p className="text-sm font-semibold text-green-400">
                        ✓ Correct answer
                      </p>
                    ) : item.selectedIndex === -1 ? (
                      <p className="text-sm font-semibold text-yellow-400">
                        ⏭ Not answered
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-red-400">
                        ✗ Incorrect answer
                      </p>
                    )}

                  </div>

                </div>
              );
            })}

          </div>

          {/* ================= BUTTONS ================= */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">

            <button
              onClick={() => navigate("/")}
              className="py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold transition hover:scale-[1.02]"
            >
              🔄 Play Again
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="py-3 rounded-xl border border-purple-500/40 bg-white/5 font-bold hover:bg-purple-500/20 transition"
            >
              📊 Dashboard
            </button>

            <button
              onClick={() => navigate("/leaderboard")}
              className="py-3 rounded-xl border border-purple-500/40 bg-white/5 font-bold hover:bg-purple-500/20 transition"
            >
              🏆 Leaderboard
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}