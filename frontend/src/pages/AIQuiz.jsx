import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function AIQuiz() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateQuiz = async (event) => {
    event.preventDefault();
    setError("");

    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/quizzes/ai/generate", {
        topic,
        difficulty,
        questionCount: Number(questionCount),
        timePerQuestion: Number(timePerQuestion),
        instructions,
      });

      navigate("/create-quiz/manual", { state: { generatedQuiz: data } });
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#11131c] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/create-quiz" className="text-sm text-pink-300 hover:text-pink-200">← Create Quiz</Link>

        <div className="mt-5 mb-8">
          <div className="inline-flex rounded-2xl border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-200">✨ AI Quiz Creator</div>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Generate a Quiz with AI</h1>
          <p className="mt-2 text-gray-400">Give the AI your topic and preferences. You will review and edit the generated quiz before saving it.</p>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">⚠️ {error}</div>}

        <form onSubmit={generateQuiz} className="space-y-5 rounded-3xl border border-white/10 bg-[#191b26] p-5 shadow-xl sm:p-8">
          <label className="block text-sm font-semibold text-gray-300">
            Topic
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Java OOP" maxLength={100} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-normal outline-none focus:border-pink-500" />
          </label>

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block text-sm font-semibold text-gray-300">
              Difficulty
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#20212d] px-4 py-3 font-normal outline-none focus:border-pink-500">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-gray-300">
              Questions
              <input type="number" min="1" max="50" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-normal outline-none focus:border-pink-500" />
            </label>

            <label className="block text-sm font-semibold text-gray-300">
              Time / Question
              <select value={timePerQuestion} onChange={(e) => setTimePerQuestion(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#20212d] px-4 py-3 font-normal outline-none focus:border-pink-500">
                {[2, 5, 10, 15, 30, 45, 60, 90, 120].map((n) => <option key={n} value={n}>{n} seconds</option>)}
              </select>
            </label>
          </div>

          <label className="block text-sm font-semibold text-gray-300">
            Additional instructions <span className="font-normal text-gray-500">(optional)</span>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={1000} rows="5" placeholder="Example: Focus on inheritance and polymorphism. Include conceptual and code-based questions." className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-normal outline-none focus:border-pink-500" />
          </label>

          <div className="rounded-2xl border border-purple-400/20 bg-purple-500/5 p-4 text-sm text-gray-300">
            <p className="font-semibold text-purple-200">How it works</p>
            <p className="mt-1">Generate → Review/Edit → Start Solo / Host Now / Save for later.</p>
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3 font-bold shadow-lg shadow-pink-500/20 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Generating quiz..." : "✨ Generate Quiz with AI"}
          </button>
        </form>
      </div>
    </main>
  );
}
