import React from "react";
import { Link } from "react-router-dom";

export default function Leaderboard() {
  return (
    <div className="min-h-screen px-4 py-10 bg-[#080014] text-white flex items-center justify-center">

      {/* Background Glow */}
      <div className="fixed top-10 left-10 w-72 h-72 bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="fixed bottom-10 right-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-2xl p-8 rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl shadow-2xl">

        {/* Trophy */}
        <div className="text-center mb-8">

          <div className="text-6xl mb-4">
            🏆
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold">
            Quiz Leaderboard
          </h1>

          <p className="text-gray-400 mt-3">
            The leaderboard is available at the end of each live quiz.
          </p>

        </div>

        {/* Info */}
        <div className="space-y-4">

          {/* Top 3 */}
          <div className="p-5 rounded-2xl border border-yellow-400/20 bg-yellow-500/5">

            <div className="flex items-center gap-3 mb-3">

              <span className="text-3xl">
                🥇
              </span>

              <div>
                <h3 className="font-bold text-lg">
                  Top 3 Players
                </h3>

                <p className="text-sm text-gray-400">
                  The final quiz leaderboard shows the top performers.
                </p>
              </div>

            </div>

            <div className="flex justify-center gap-6 text-2xl mt-4">
              <span>🥇</span>
              <span>🥈</span>
              <span>🥉</span>
            </div>

          </div>

          {/* Current Quiz */}
          <div className="p-5 rounded-2xl border border-purple-500/20 bg-purple-500/5">

            <div className="flex items-center gap-3">

              <span className="text-3xl">
                🎯
              </span>

              <div>
                <h3 className="font-bold text-lg">
                  Current Quiz Results
                </h3>

                <p className="text-sm text-gray-400">
                  Your rank, score and correct answers are shown
                  after the quiz finishes.
                </p>
              </div>

            </div>

          </div>

          {/* No Global Leaderboard */}
          <div className="p-5 rounded-2xl border border-pink-500/20 bg-pink-500/5">

            <div className="flex items-center gap-3">

              <span className="text-3xl">
                ⚡
              </span>

              <div>
                <h3 className="font-bold text-lg">
                  No Permanent Ranking
                </h3>

                <p className="text-sm text-gray-400">
                  Leaderboards are specific to each live quiz.
                  Results are not combined into one global ranking.
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">

          <Link
            to="/dashboard"
            className="flex-1 text-center px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold hover:scale-[1.02] transition"
          >
            🏠 Go to Dashboard
          </Link>

          <Link
            to="/join-room"
            className="flex-1 text-center px-6 py-3 rounded-xl border border-purple-500/30 bg-white/5 font-bold hover:bg-white/10 transition"
          >
            🎮 Join Quiz
          </Link>

        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-7">
          Complete a live quiz to see your final leaderboard.
        </p>

      </div>
    </div>
  );
}