import React, { useEffect, useState } from "react";
import api from "../api/axios.js";

export default function Leaderboard() {
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/quiz/leaderboard")
      .then((res) => setResults(res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load leaderboard"));
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center text-indigo-700 dark:text-indigo-400 mb-6">🏆 Leaderboard</h2>
      {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>}
      {results.length === 0 && !error && (
        <p className="text-center text-gray-500 dark:text-gray-400">No results yet. Be the first!</p>
      )}
      <div className="space-y-2">
        {results.map((r, idx) => (
          <div
            key={r._id}
            className="flex justify-between items-center border-b py-2 last:border-b-0"
          >
            <span className="font-medium dark:text-white">
              {idx + 1}. {r.user?.name || "Unknown"}
            </span>
            <span className="text-indigo-600 font-semibold">
              {r.score}/{r.totalQuestions} — {r.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
