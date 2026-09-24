import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/rooms/leaderboard"
        );

        setLeaderboard(response.data || []);
      } catch (err) {
        console.error(
          "Global leaderboard error:",
          err
        );

        setError(
          err.response?.data?.message ||
          "Unable to load global leaderboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";

    return `#${rank}`;
  };

  return (
    <div className="min-h-screen px-4 py-10 bg-[#080014] text-white">

      {/* Background Glow */}
      <div className="fixed top-10 left-10 w-72 h-72 bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="fixed bottom-10 right-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">

          <div className="text-6xl mb-4">
            🏆
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold">
            Global Leaderboard
          </h1>

          <p className="text-gray-400 mt-3">
            Top players across live quizzes
          </p>

        </div>

        {/* Loading */}
        {loading && (
          <div className="p-10 rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl text-center">

            <div className="text-5xl mb-4 animate-pulse">
              🏆
            </div>

            <p className="text-gray-400">
              Loading leaderboard...
            </p>

          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-8 rounded-3xl border border-red-500/30 bg-red-500/10 text-center">

            <div className="text-5xl mb-4">
              ⚠️
            </div>

            <h2 className="text-xl font-bold text-red-300">
              Unable to Load Leaderboard
            </h2>

            <p className="text-gray-400 mt-2">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/30 font-bold hover:bg-red-500/30 transition"
            >
              🔄 Try Again
            </button>

          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          leaderboard.length === 0 && (
            <div className="p-10 rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl text-center">

              <div className="text-5xl mb-4">
                🎮
              </div>

              <h2 className="text-xl font-bold">
                No Results Yet
              </h2>

              <p className="text-gray-400 mt-2">
                Complete a live quiz to appear on the
                global leaderboard.
              </p>

              <Link
                to="/join-room"
                className="inline-block mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold hover:scale-[1.02] transition"
              >
                🎮 Join Quiz
              </Link>

            </div>
          )}

        {/* Top 3 */}
        {!loading &&
          !error &&
          leaderboard.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

                {leaderboard
                  .slice(0, 3)
                  .map((player) => (
                    <div
                      key={`${player.roomCode}-${player.rank}-${player.participantName}`}
                      className={`relative p-6 rounded-3xl border backdrop-blur-xl text-center ${player.rank === 1
                          ? "md:order-2 border-yellow-400/40 bg-yellow-500/10 md:-mt-4"
                          : player.rank === 2
                            ? "md:order-1 border-gray-300/30 bg-white/10"
                            : "md:order-3 border-orange-400/30 bg-orange-500/10"
                        }`}
                    >

                      <div className="text-5xl mb-3">
                        {getRankIcon(player.rank)}
                      </div>

                      <h2 className="text-xl font-bold truncate">
                        {player.userName ||
                          player.participantName}
                      </h2>

                      <p className="text-xs text-gray-500 mt-1">
                        Room: {player.roomCode}
                      </p>

                      <p className="text-3xl font-extrabold mt-4">
                        {player.score}
                        <span className="text-sm text-gray-400 ml-2">
                          pts
                        </span>
                      </p>

                      <p className="text-sm text-gray-400 mt-2">
                        {player.correctAnswers}/
                        {player.totalQuestions} correct
                      </p>

                      <div className="mt-4 inline-block px-4 py-2 rounded-full bg-black/20 border border-white/5 text-sm">
                        🎯 {player.accuracy}% accuracy
                      </div>

                    </div>
                  ))}
              </div>

              {/* Remaining Players */}
              {leaderboard.length > 3 && (
                <div className="rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl overflow-hidden">

                  {/* Table Header */}
                  <div className="hidden md:grid grid-cols-[80px_1fr_130px_130px_130px] gap-4 px-6 py-4 border-b border-white/10 text-xs uppercase tracking-wider text-gray-500">
                    <span>Rank</span>
                    <span>Player</span>
                    <span>Room</span>
                    <span>Correct</span>
                    <span>Score</span>
                  </div>

                  {/* Players */}
                  {leaderboard
                    .slice(3)
                    .map((player) => (
                      <div
                        key={`${player.roomCode}-${player.rank}-${player.participantName}`}
                        className="grid grid-cols-1 md:grid-cols-[80px_1fr_130px_130px_130px] gap-3 md:gap-4 px-6 py-5 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition"
                      >

                        {/* Rank */}
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-purple-300">
                            #{player.rank}
                          </span>
                        </div>

                        {/* Player */}
                        <div>
                          <p className="font-bold">
                            {player.userName ||
                              player.participantName}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            {player.accuracy}% accuracy
                          </p>
                        </div>

                        {/* Room */}
                        <div className="flex items-center">
                          <span className="text-sm text-gray-400">
                            {player.roomCode}
                          </span>
                        </div>

                        {/* Correct */}
                        <div className="flex items-center">
                          <span className="text-sm">
                            {player.correctAnswers}/
                            {player.totalQuestions}
                          </span>
                        </div>

                        {/* Score */}
                        <div className="flex items-center">
                          <span className="font-bold">
                            {player.score} pts
                          </span>
                        </div>

                      </div>
                    ))}

                </div>
              )}

              {/* Footer Info */}
              <div className="mt-6 p-5 rounded-2xl border border-purple-500/20 bg-purple-500/5 text-center">

                <p className="text-sm text-gray-400">
                  Showing up to{" "}
                  <span className="text-white font-bold">
                    100
                  </span>{" "}
                  live quiz results.
                </p>

              </div>
            </>
          )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">

          <Link
            to="/dashboard"
            className="flex-1 text-center px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold hover:scale-[1.02] transition"
          >
            🏠 Dashboard
          </Link>

          <Link
            to="/join-room"
            className="flex-1 text-center px-6 py-3 rounded-xl border border-purple-500/30 bg-white/5 font-bold hover:bg-white/10 transition"
          >
            🎮 Join Quiz
          </Link>

        </div>

      </div>
    </div>
  );
}