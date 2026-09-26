import React, { useEffect, useState } from "react";
import api from "../api/axios.js";

export default function Leaderboard() {
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const res = await api.get("/quiz/leaderboard");
        setResults(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Could not load leaderboard"
        );
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  return (
    <div className="min-h-screen px-4 py-10 bg-[#080014] text-white">

      {/* Background Glow */}
      <div className="fixed top-10 left-10 w-72 h-72 bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="relative max-w-2xl mx-auto p-8 rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl shadow-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">
            🏆
          </div>

          <h2 className="text-3xl font-extrabold">
            Leaderboard
          </h2>

          <p className="text-sm text-gray-400 mt-2">
            Top multiplayer quiz performers
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="text-4xl animate-bounce mb-3">
              ⏳
            </div>

            <p className="text-gray-400">
              Loading leaderboard...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && !error && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">
              🎯
            </div>

            <p className="text-gray-400">
              No multiplayer results yet.
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((r, idx) => {
              const rank = r.rank || idx + 1;

              const playerName =
                r.participantName ||
                r.user?.name ||
                "Unknown Player";

              return (
                <div
                  key={r._id || `${playerName}-${rank}`}
                  className={`flex items-center justify-between gap-4 p-4 rounded-2xl border transition hover:scale-[1.01] ${rank === 1
                      ? "bg-yellow-500/10 border-yellow-400/40"
                      : rank === 2
                        ? "bg-gray-400/10 border-gray-400/30"
                        : rank === 3
                          ? "bg-orange-500/10 border-orange-400/30"
                          : "bg-white/5 border-white/10"
                    }`}
                >

                  {/* Rank + User */}
                  <div className="flex items-center gap-3 min-w-0">

                    <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 font-bold">
                      {rank === 1
                        ? "🥇"
                        : rank === 2
                          ? "🥈"
                          : rank === 3
                            ? "🥉"
                            : rank}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {playerName}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        {r.correctAnswers ?? 0} correct
                        {" • "}
                        {r.totalQuestions ?? 0} questions
                      </p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-pink-400">
                      {r.score ?? 0}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Points
                    </p>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <p className="text-xs text-gray-500 text-center mt-8">
            Keep playing and improve your score! 🚀
          </p>
        )}

      </div>
    </div>
  );
}