import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function Quiz() {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/questions/categories")
      .then((res) => setCategories(res.data))
      .catch(() => setError("Could not load categories"));
  }, []);

  const startQuiz = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/questions", {
        params: category ? { category } : {},
      });

      if (res.data.length === 0) {
        setError("No questions found for this category yet.");
        setLoading(false);
        return;
      }

      setQuestions(res.data);
      setStarted(true);
      setCurrent(0);
      setAnswers({});
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load questions"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionId, index) => {
    setAnswers({
      ...answers,
      [questionId]: index,
    });
  };

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    setError("");

    try {
      const payload = {
        category: category || "General",
        answers: questions.map((q) => ({
          questionId: q._id,
          selectedIndex: answers[q._id] ?? -1,
        })),
      };

      const res = await api.post("/quiz/submit", payload);

      navigate("/result", {
        state: res.data,
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not submit quiz"
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= START QUIZ SCREEN =================

  if (!started) {
    return (
      <div className="min-h-screen bg-[#080014] text-white px-4 py-12 relative overflow-hidden">

        {/* Background Glow */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-pink-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-md mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30 mb-5">
              <span className="text-3xl">🧠</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight">
              Start Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                Quiz
              </span>
            </h1>

            <p className="text-gray-400 mt-2 text-sm">
              Test your knowledge and challenge yourself
            </p>
          </div>

          {/* Card */}
          <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-purple-950/40">

            {/* Error */}
            {error && (
              <div className="mb-5 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm text-center">
                ⚠️ {error}
              </div>
            )}

            {/* Category Label */}
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Select Category
            </label>

            {/* Category Select */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 mb-6 rounded-xl bg-[#160b29] border border-white/10 text-white outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition cursor-pointer"
            >
              <option value="">🌐 All Categories</option>

              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Quiz Info */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/[0.05] border border-white/10 rounded-xl p-3 text-center">
                <p className="text-xl mb-1">📝</p>
                <p className="text-xs text-gray-400">Questions</p>
                <p className="font-bold text-pink-300">Multiple</p>
              </div>

              <div className="bg-white/[0.05] border border-white/10 rounded-xl p-3 text-center">
                <p className="text-xl mb-1">⚡</p>
                <p className="text-xs text-gray-400">Difficulty</p>
                <p className="font-bold text-purple-300">Mixed</p>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startQuiz}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-lg shadow-pink-600/20 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⟳</span>
                  Loading Questions...
                </span>
              ) : (
                "🚀 Start Quiz"
              )}
            </button>

          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const selectedAnswer = answers[q._id];
  const progress = ((current + 1) / questions.length) * 100;

  // ================= QUIZ SCREEN =================

  return (
    <div className="min-h-screen bg-[#080014] text-white px-4 py-8 relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-2xl mx-auto">

        {/* Top Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500">
              Current Category
            </p>

            <p className="text-sm font-bold text-pink-300 mt-1">
              {category || "General"}
            </p>
          </div>

          <div className="px-4 py-2 rounded-full bg-white/[0.06] border border-white/10">
            <span className="text-sm font-bold text-gray-200">
              {current + 1}{" "}
              <span className="text-gray-500">
                / {questions.length}
              </span>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Quiz Card */}
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-purple-950/40">

          {/* Question Number */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600 font-extrabold shadow-lg shadow-pink-500/20">
              {current + 1}
            </div>

            <p className="text-sm text-gray-400 font-medium">
              Question {current + 1}
            </p>
          </div>

          {/* Question */}
          <h2 className="text-xl sm:text-2xl font-bold leading-relaxed text-white mb-8">
            {q.questionText}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;

              return (
                <button
                  key={idx}
                  onClick={() => selectAnswer(q._id, idx)}
                  className={`w-full flex items-center gap-4 text-left px-4 py-4 rounded-2xl border transition-all duration-200 group ${
                    isSelected
                      ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500 shadow-lg shadow-pink-500/10"
                      : "bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-pink-500/50"
                  }`}
                >
                  {/* Option Letter */}
                  <span
                    className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition ${
                      isSelected
                        ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white"
                        : "bg-white/10 text-gray-300 group-hover:bg-pink-500/20 group-hover:text-pink-300"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>

                  {/* Option Text */}
                  <span
                    className={`flex-1 text-sm sm:text-base ${
                      isSelected
                        ? "text-white font-semibold"
                        : "text-gray-300"
                    }`}
                  >
                    {opt}
                  </span>

                  {/* Selected Icon */}
                  {isSelected && (
                    <span className="text-pink-400 text-lg">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-5 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm text-center">
              ⚠️ {error}
            </div>
          )}

          {/* Next / Submit Button */}
          <button
            onClick={nextQuestion}
            disabled={selectedAnswer === undefined || loading}
            className="w-full mt-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-lg shadow-pink-600/20 transition-all duration-300 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {current === questions.length - 1
              ? loading
                ? "Submitting..."
                : "🏆 Submit Quiz"
              : "Next Question →"}
          </button>

          {/* Footer Info */}
          <p className="text-center text-xs text-gray-500 mt-5">
            Select an option to continue
          </p>

        </div>
      </div>
    </div>
  );
}