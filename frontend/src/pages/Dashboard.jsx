import React, { useEffect, useState } from "react";
import api from "../api/axios.js";

export default function Dashboard() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/rooms/my-results");

        setResults(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (err) {
        console.error(
          "Dashboard results error:",
          err
        );

        setError(
          err.response?.data?.message ||
          "Could not load your quiz results"
        );
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  // =========================================================
  // BASIC COUNTS
  // =========================================================

  const attempted = results.length;

  const liveQuizCount = results.filter(
    (item) => item.type === "live"
  ).length;

  const soloQuizCount = results.filter(
    (item) => item.type === "solo"
  ).length;

  // =========================================================
  // TOTAL QUESTIONS
  // =========================================================

  const totalQuestions = results.reduce(
    (sum, item) =>
      sum +
      Number(
        item.questionsAnswered ??
        item.totalQuestions ??
        0
      ),
    0
  );

  // =========================================================
  // TOTAL CORRECT
  // =========================================================

  const totalCorrect = results.reduce(
    (sum, item) =>
      sum +
      Number(item.correctAnswers ?? 0),
    0
  );

  // =========================================================
  // OVERALL ACCURACY
  // =========================================================

  const accuracy =
    totalQuestions > 0
      ? Math.min(
        100,
        Math.round(
          (totalCorrect / totalQuestions) * 100
        )
      )
      : 0;

  // =========================================================
  // BEST ACCURACY
  // =========================================================

  const bestAccuracy = results.reduce(
    (best, item) => {
      const correct = Number(
        item.correctAnswers ?? 0
      );

      const total = Number(
        item.questionsAnswered ??
        item.totalQuestions ??
        0
      );

      if (total <= 0) {
        return best;
      }

      const percentage =
        (correct / total) * 100;

      return Math.max(
        best,
        Math.min(100, percentage)
      );
    },
    0
  );

  // =========================================================
  // BEST LIVE SCORE
  // =========================================================

  const liveResults = results.filter(
    (item) => item.type === "live"
  );

  const bestLiveScore =
    liveResults.length > 0
      ? Math.max(
        ...liveResults.map((item) =>
          Number(item.score || 0)
        )
      )
      : 0;

  // =========================================================
  // BEST SOLO ACCURACY
  // =========================================================

  const soloResults = results.filter(
    (item) => item.type === "solo"
  );

  const bestSoloAccuracy =
    soloResults.length > 0
      ? Math.max(
        ...soloResults.map((item) => {
          const correct = Number(
            item.correctAnswers ?? 0
          );

          const total = Number(
            item.questionsAnswered ??
            item.totalQuestions ??
            0
          );

          return total > 0
            ? (correct / total) * 100
            : 0;
        })
      )
      : 0;

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080014] text-white">
        <div className="text-center">

          <div className="text-5xl mb-4 animate-bounce">
            🧠
          </div>

          <h2 className="text-2xl font-bold">
            Loading Dashboard...
          </h2>

          <p className="text-gray-400 mt-2">
            Fetching your quiz statistics
          </p>

        </div>
      </div>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="min-h-screen bg-[#080014] text-white px-4 py-8">

      {/* Background Glow */}
      <div className="fixed top-10 left-10 w-72 h-72 bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="fixed bottom-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">

          <p className="text-sm text-pink-400 font-semibold uppercase tracking-wider">
            QuizNeon
          </p>

          <h1 className="text-3xl md:text-4xl font-extrabold mt-2">
            Your Dashboard
          </h1>

          <p className="text-gray-400 mt-2">
            Track your quiz performance and progress.
          </p>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {/* Attempts */}

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">

            <p className="text-sm text-gray-400">
              Quizzes Attempted
            </p>

            <p className="text-3xl font-extrabold mt-2">
              {attempted}
            </p>

            <p className="text-xs text-gray-500 mt-2">
              Solo: {soloQuizCount} • Live: {liveQuizCount}
            </p>

          </div>

          {/* Questions */}

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">

            <p className="text-sm text-gray-400">
              Questions Answered
            </p>

            <p className="text-3xl font-extrabold mt-2">
              {totalQuestions}
            </p>

            <p className="text-xs text-gray-500 mt-2">
              Across completed quizzes
            </p>

          </div>

          {/* Correct */}

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">

            <p className="text-sm text-gray-400">
              Correct Answers
            </p>

            <p className="text-3xl font-extrabold mt-2 text-green-400">
              {totalCorrect}
            </p>

            <p className="text-xs text-gray-500 mt-2">
              Total correct responses
            </p>

          </div>

          {/* Accuracy */}

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">

            <p className="text-sm text-gray-400">
              Overall Accuracy
            </p>

            <p className="text-3xl font-extrabold mt-2 text-pink-400">
              {accuracy}%
            </p>

            <p className="text-xs text-gray-500 mt-2">
              Across all completed quizzes
            </p>

          </div>

        </div>

        {/* =================================================
            PERFORMANCE
        ================================================= */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

          {/* Overall Accuracy */}

          <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">

            <p className="text-sm text-gray-400">
              Overall Accuracy
            </p>

            <div className="flex items-end gap-2 mt-3">

              <span className="text-5xl font-extrabold">
                {accuracy}
              </span>

              <span className="text-gray-400 mb-2">
                %
              </span>

            </div>

            <div className="mt-5 w-full h-3 rounded-full bg-white/10 overflow-hidden">

              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-700"
                style={{
                  width: `${accuracy}%`,
                }}
              />

            </div>

          </div>

          {/* Best Accuracy */}

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">

            <p className="text-sm text-gray-400">
              Best Accuracy
            </p>

            <p className="text-5xl font-extrabold mt-3 text-purple-400">
              {Math.round(bestAccuracy)}%
            </p>

            <p className="text-sm text-gray-500 mt-3">
              Highest accuracy in any completed quiz
            </p>

          </div>

          {/* Best Live Score */}

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">

            <p className="text-sm text-gray-400">
              Best Live Score
            </p>

            <p className="text-5xl font-extrabold mt-3 text-pink-400">
              {bestLiveScore}
            </p>

            <p className="text-sm text-gray-500 mt-3">
              Highest points earned in a live quiz
            </p>

          </div>

        </div>

        {/* =================================================
            QUIZ TYPE SUMMARY
        ================================================= */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

          {/* Solo */}

          <div className="p-6 rounded-2xl border border-pink-500/20 bg-pink-500/5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-400">
                  Solo Practice
                </p>

                <p className="text-3xl font-extrabold mt-2">
                  {soloQuizCount}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  quizzes completed
                </p>
              </div>

              <div className="text-4xl">
                📝
              </div>

            </div>

            <div className="mt-5">

              <p className="text-xs text-gray-500">
                Best Accuracy
              </p>

              <p className="text-xl font-bold text-pink-400 mt-1">
                {Math.round(bestSoloAccuracy)}%
              </p>

            </div>

          </div>

          {/* Live */}

          <div className="p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-400">
                  Live Multiplayer
                </p>

                <p className="text-3xl font-extrabold mt-2">
                  {liveQuizCount}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  quizzes completed
                </p>
              </div>

              <div className="text-4xl">
                🎮
              </div>

            </div>

            <div className="mt-5">

              <p className="text-xs text-gray-500">
                Best Score
              </p>

              <p className="text-xl font-bold text-purple-400 mt-1">
                {bestLiveScore} pts
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            RECENT RESULTS
        ================================================= */}

        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">

          <div className="p-6 border-b border-white/10">

            <h2 className="text-xl font-bold">
              Recent Quiz Results
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              Your latest completed quizzes
            </p>

          </div>

          {results.length === 0 ? (
            <div className="p-10 text-center">

              <div className="text-5xl mb-4">
                🎯
              </div>

              <h3 className="text-xl font-bold">
                No quiz results yet
              </h3>

              <p className="text-gray-400 mt-2">
                Complete a quiz to see your performance here.
              </p>

            </div>
          ) : (
            <div className="divide-y divide-white/10">

              {results
                .slice(0, 10)
                .map((item, index) => {

                  const correct = Number(
                    item.correctAnswers ?? 0
                  );

                  const total = Number(
                    item.questionsAnswered ??
                    item.totalQuestions ??
                    0
                  );

                  const percentage =
                    total > 0
                      ? Math.round(
                        (correct / total) * 100
                      )
                      : 0;

                  const isLive =
                    item.type === "live";

                  const title = isLive
                    ? `Live Quiz • ${item.roomCode || "Room"
                    }`
                    : item.category ||
                    "Practice Quiz";

                  return (
                    <div
                      key={
                        item._id ||
                        item.id ||
                        index
                      }
                      className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 hover:bg-white/5 transition"
                    >

                      {/* Quiz Info */}

                      <div className="min-w-0">

                        <div className="flex items-center gap-2 flex-wrap">

                          <p className="font-bold">
                            {title}
                          </p>

                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${isLive
                                ? "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                                : "bg-pink-500/15 text-pink-300 border border-pink-500/20"
                              }`}
                          >
                            {isLive
                              ? "Live"
                              : "Solo"}
                          </span>

                        </div>

                        <p className="text-sm text-gray-500 mt-1">
                          {item.createdAt
                            ? new Date(
                              item.createdAt
                            ).toLocaleString()
                            : "Recently completed"}
                        </p>

                      </div>

                      {/* Stats */}

                      <div className="flex flex-wrap items-center gap-5">

                        {/* Correct */}

                        <div>
                          <p className="text-xs text-gray-500">
                            Correct
                          </p>

                          <p className="font-bold">
                            {correct}/{total}
                          </p>
                        </div>

                        {/* Accuracy */}

                        <div>
                          <p className="text-xs text-gray-500">
                            Accuracy
                          </p>

                          <p className="font-bold text-green-400">
                            {percentage}%
                          </p>
                        </div>

                        {/* Score */}

                        <div>
                          <p className="text-xs text-gray-500">
                            {isLive
                              ? "Score"
                              : "Result"}
                          </p>

                          <p className="font-bold text-pink-400">

                            {isLive
                              ? `${Number(
                                item.score || 0
                              )} pts`
                              : `${correct}/${total}`}

                          </p>
                        </div>

                        {/* Rank */}

                        <div>
                          <p className="text-xs text-gray-500">
                            Rank
                          </p>

                          <p className="font-bold text-purple-400">
                            {isLive &&
                              item.rank
                              ? `#${item.rank}`
                              : "—"}
                          </p>
                        </div>

                      </div>

                    </div>
                  );
                })}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}