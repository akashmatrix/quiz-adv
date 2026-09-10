import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <p>No result found.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Take a Quiz
        </button>
      </div>
    );
  }

  const { score, totalQuestions, breakdown } = state;
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center text-indigo-700 dark:text-indigo-400 mb-2">Quiz Result</h2>
      <p className="text-center text-4xl font-extrabold my-4">
        {score} / {totalQuestions}
      </p>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-6">You scored {percentage}%</p>

      <div className="space-y-4">
        {breakdown.map((b, idx) => (
          <div
            key={idx}
            className={`p-4 rounded border ${
              b.isCorrect ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"
            }`}
          >
            <p className="font-medium">{b.questionText}</p>
            <p className="text-sm mt-1">
              Your answer index: {b.selectedIndex} {b.isCorrect ? "✅ Correct" : "❌ Wrong"}
            </p>
            {!b.isCorrect && (
              <p className="text-sm text-green-700">Correct index: {b.correctAnswerIndex}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => navigate("/")}
          className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
        >
          Play Again
        </button>
        <button
          onClick={() => navigate("/leaderboard")}
          className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition"
        >
          Leaderboard
        </button>
      </div>
    </div>
  );
}
