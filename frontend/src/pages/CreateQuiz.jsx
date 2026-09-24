import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";

const PRESET_SUBJECTS = [
  "Data Structures",
  "Java",
  "C Programming",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "Mathematics",
  "Physics",
  "General Knowledge",
];

export default function CreateQuiz() {
  const navigate = useNavigate();
  const location = useLocation();

  const [subject, setSubject] = useState(location.state?.subject || "Data Structures");
  const [customSubject, setCustomSubject] = useState("");
  const [topic, setTopic] = useState(location.state?.topic || "");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [questionType, setQuestionType] = useState("MCQ");
  const [language, setLanguage] = useState("English");
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [explanations, setExplanations] = useState(true);
  const [customInstructions, setCustomInstructions] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCustomSubject = subject === "Custom";

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");

    const chosenSubject = isCustomSubject ? customSubject.trim() : subject;

    if (!chosenSubject) {
      setError("Please specify a subject for the quiz.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        subject: chosenSubject,
        topic: topic.trim(),
        difficulty,
        questionCount: Number(questionCount),
        questionType,
        language,
        timePerQuestion: Number(timePerQuestion),
        explanations,
        customInstructions: customInstructions.trim(),
      };

      const res = await api.post("/ai/generate-quiz", payload);

      if (res.data?.quiz) {
        navigate("/quiz-preview", {
          state: { quiz: res.data.quiz },
        });
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
      const msg =
        err.response?.data?.message ||
        (err.code === "ECONNABORTED"
          ? "AI generation took too long. Please try with fewer questions or simpler instructions."
          : "AI could not generate the quiz. Please try again.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080014] flex items-center justify-center px-4">
        <LoadingState title="Crafting Your AI Quiz" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080014] text-white px-4 py-10 relative overflow-hidden">
      {/* Background Glow */}
      <div className="fixed top-10 left-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 text-xs font-semibold text-pink-300 uppercase tracking-wider mb-3">
            ✨ AI Quiz Generator
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Create Your AI Quiz
          </h1>
          <p className="text-gray-400 mt-3 text-sm sm:text-base">
            Choose your preferences. AI will create the complete quiz with verified answers.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold">Generation Error</p>
              <p className="text-xs text-red-200 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Main Creation Card Form */}
        <form
          onSubmit={handleGenerate}
          className="rounded-3xl border border-white/10 bg-[#120a21]/80 backdrop-blur-2xl shadow-2xl p-6 sm:p-10 space-y-7"
        >
          {/* A. Subject */}
          <div>
            <label className="block text-sm font-bold text-gray-200 mb-2">
              A. Subject / Domain <span className="text-pink-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {PRESET_SUBJECTS.map((sub) => (
                <button
                  type="button"
                  key={sub}
                  onClick={() => setSubject(sub)}
                  className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium border text-left transition ${
                    subject === sub
                      ? "border-pink-500 bg-pink-500/20 text-white font-bold shadow-md shadow-pink-500/10"
                      : "border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {sub}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSubject("Custom")}
                className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium border text-left transition ${
                  subject === "Custom"
                    ? "border-pink-500 bg-pink-500/20 text-white font-bold"
                    : "border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/10"
                }`}
              >
                ✏️ Custom Topic
              </button>
            </div>

            {isCustomSubject && (
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Enter custom subject (e.g. World History, Quantum Computing, Machine Learning)"
                required={isCustomSubject}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-pink-500/40 text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-pink-500/30"
              />
            )}
          </div>

          {/* B. Topic */}
          <div>
            <label className="block text-sm font-bold text-gray-200 mb-1.5">
              B. Specific Topic <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Stacks, queues and recursion (or leave blank for entire subject)"
              className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition"
            />
          </div>

          {/* Row: Difficulty + Number of Questions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* C. Difficulty */}
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2">
                C. Difficulty Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["Easy", "Medium", "Hard", "Mixed"].map((diff) => (
                  <button
                    type="button"
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 rounded-xl text-xs font-semibold border text-center transition ${
                      difficulty === diff
                        ? "border-purple-500 bg-purple-500/30 text-white shadow-sm"
                        : "border-white/10 bg-white/[0.03] text-gray-400 hover:text-white"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* D. Number of Questions */}
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2">
                D. Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setQuestionCount(num)}
                    className={`py-2 rounded-xl text-xs font-semibold border text-center transition ${
                      questionCount === num
                        ? "border-pink-500 bg-pink-500/30 text-white shadow-sm"
                        : "border-white/10 bg-white/[0.03] text-gray-400 hover:text-white"
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row: Question Type + Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* E. Question Type */}
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2">
                E. Question Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["MCQ", "True/False", "Mixed"].map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setQuestionType(type)}
                    className={`py-2 rounded-xl text-xs font-semibold border text-center transition ${
                      questionType === type
                        ? "border-indigo-500 bg-indigo-500/30 text-white shadow-sm"
                        : "border-white/10 bg-white/[0.03] text-gray-400 hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* F. Language */}
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2">
                F. Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["English", "Hindi", "Hinglish"].map((lang) => (
                  <button
                    type="button"
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`py-2 rounded-xl text-xs font-semibold border text-center transition ${
                      language === lang
                        ? "border-purple-500 bg-purple-500/30 text-white shadow-sm"
                        : "border-white/10 bg-white/[0.03] text-gray-400 hover:text-white"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* G. Time per Question */}
          <div>
            <label className="block text-sm font-bold text-gray-200 mb-2">
              G. Time per Question
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: "15 seconds", value: 15 },
                { label: "30 seconds", value: 30 },
                { label: "45 seconds", value: 45 },
                { label: "60 seconds", value: 60 },
                { label: "No timer", value: 0 },
              ].map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setTimePerQuestion(t.value)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition ${
                    timePerQuestion === t.value
                      ? "border-pink-500 bg-pink-500/20 text-white shadow-sm"
                      : "border-white/10 bg-white/[0.03] text-gray-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* H. Explanation Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div>
              <p className="text-sm font-bold text-gray-200">H. Show Explanations</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Display detailed reasoning and concept reviews after submission
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={explanations}
                onChange={(e) => setExplanations(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-600"></div>
            </label>
          </div>

          {/* I. Custom Instructions */}
          <div>
            <label className="block text-sm font-bold text-gray-200 mb-1.5">
              I. Custom Instructions <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Focus on university exam level questions, or include practical code snippets."
              className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition resize-none"
            />
          </div>

          {/* J. AI Generate Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-extrabold text-base text-white bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 shadow-xl shadow-purple-900/30 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            🤖 Generate Quiz with AI
          </button>
        </form>
      </div>
    </div>
  );
}
