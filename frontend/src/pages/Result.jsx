import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#080014] text-white">
        <div className="w-full max-w-md p-8 text-center rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl">
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

  const { score, totalQuestions, breakdown } = state;

  const percentage =
    totalQuestions > 0
      ? Math.round((score / totalQuestions) * 100)
      : 0;

  return (
    <div className="min-h-screen px-4 py-10 bg-[#080014] text-white">

      {/* Background Glow */}
      <div className="fixed top-10 left-10 w-72 h-72 bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-2xl mx-auto">

        {/* Header Card */}
        <div className="p-8 rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl shadow-2xl mb-6">

          <div className="text-center">
            <div className="text-5xl mb-4">
              {percentage >= 80
                ? "🏆"
                : percentage >= 50
                  ? "🎉"
                  : "💪"}
            </div>

            <h2 className="text-3xl font-extrabold">
              Quiz Result
            </h2>

            <p className="text-gray-400 text-sm mt-2">
              Here is your performance summary
            </p>
          </div>

          {/* Score */}
          <div className="my-8 text-center">
            <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              {score} / {totalQuestions}
            </p>

            <p className="text-gray-400 mt-3">
              You scored{" "}
              <span className="text-pink-400 font-bold">
                {percentage}%
              </span>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(0, percentage))}%`,
              }}
            />
          </div>
        </div>

        {/* Breakdown */}
        <div className="p-6 md:p-8 rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl">

          <h3 className="text-xl font-bold mb-5">
            Answer Review
          </h3>

          <div className="space-y-4">
            {breakdown?.map((b, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border ${b.isCorrect
                    ? "border-green-500/30 bg-green-500/10"
                    : "border-red-500/30 bg-red-500/10"
                  }`}
              >

                {/* Question Header */}
                <div className="flex justify-between items-start gap-3 mb-3">
                  <p className="font-semibold leading-relaxed">
                    {idx + 1}. {b.questionText}
                  </p>

                  <span className="text-xl">
                    {b.isCorrect ? "✅" : "❌"}
                  </span>
                </div>

                {/* Answer Info */}
                <div className="text-sm space-y-2">
                  <p className="text-gray-300">
                    Your answer index:{" "}
                    <span className="font-bold text-white">
                      {b.selectedIndex}
                    </span>
                  </p>

                  <p
                    className={
                      b.isCorrect
                        ? "text-green-400 font-semibold"
                        : "text-red-400 font-semibold"
                    }
                  >
                    {b.isCorrect ? "Correct Answer" : "Wrong Answer"}
                  </p>

                  {!b.isCorrect && (
                    <p className="text-green-400">
                      Correct index:{" "}
                      <span className="font-bold">
                        {b.correctAnswerIndex}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">

            <button
              onClick={() => navigate("/")}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold transition hover:scale-[1.02]"
            >
              🔄 Play Again
            </button>

            <button
              onClick={() => navigate("/leaderboard")}
              className="flex-1 py-3 rounded-xl border border-purple-500/40 bg-white/5 font-bold hover:bg-purple-500/20 transition"
            >
              🏆 Leaderboard
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}