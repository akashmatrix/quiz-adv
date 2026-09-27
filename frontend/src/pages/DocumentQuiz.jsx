import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";

const timers = [2, 5, 10, 15, 20, 30, 45, 60, 90, 120];
const allowed = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

export default function DocumentQuiz() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chooseFile = (event) => {
    const selected = event.target.files?.[0];
    setError("");
    if (!selected) return;
    const ext = selected.name.toLowerCase().slice(selected.name.lastIndexOf("."));
    if (![".pdf", ".ppt", ".pptx"].includes(ext) || (selected.type && !allowed.includes(selected.type))) {
      setFile(null);
      setError("Please select a PDF, PPT, or PPTX file.");
      return;
    }
    if (selected.size > 100 * 1024 * 1024) {
      setFile(null);
      setError("File size must be 100 MB or less.");
      return;
    }
    setFile(selected);
  };

  const generateQuiz = async (event) => {
    event.preventDefault();
    setError("");
    if (!file) return setError("Please choose a PDF, PPT, or PPTX file first.");

    setLoading(true);
    try {
      const fileData = await readAsBase64(file);
      const { data } = await api.post("/quizzes/document/generate", {
        fileName: file.name,
        mimeType: file.type,
        fileData,
        questionCount: Number(questionCount),
        difficulty,
        timePerQuestion: Number(timePerQuestion),
        instructions,
      });
      navigate("/create-quiz/manual", { state: { generatedQuiz: data } });
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate quiz from this document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#11131c] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/create-quiz" className="text-sm text-indigo-300 hover:text-indigo-200">← Create Quiz</Link>
        <div className="mt-5 mb-8">
          <div className="inline-flex rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">📄 Document Quiz Creator</div>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Generate Quiz from PDF / PPT</h1>
          <p className="mt-2 text-gray-400">Upload your study material. AI will create questions from the document content, then you can review and edit every question.</p>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">⚠️ {error}</div>}

        <form onSubmit={generateQuiz} className="space-y-5 rounded-3xl border border-white/10 bg-[#191b26] p-5 shadow-xl sm:p-8">
          <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-blue-400/30 bg-blue-500/5 p-7 text-center hover:bg-blue-500/10">
            <input type="file" accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={chooseFile} className="hidden" />
            <div className="text-4xl">📎</div>
            <p className="mt-3 font-bold">{file ? file.name : "Choose PDF, PPT or PPTX"}</p>
            <p className="mt-1 text-sm text-gray-500">Maximum file size: 100 MB</p>
          </label>

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block text-sm font-semibold text-gray-300">Difficulty
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#20212d] px-4 py-3 font-normal outline-none focus:border-indigo-500">
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-gray-300">Questions
              <input type="number" min="1" max="50" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-normal outline-none focus:border-indigo-500" />
            </label>
            <label className="block text-sm font-semibold text-gray-300">Default Time / Question
              <select value={timePerQuestion} onChange={(e) => setTimePerQuestion(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#20212d] px-4 py-3 font-normal outline-none focus:border-indigo-500">
                {timers.map((n) => <option key={n} value={n}>{n} seconds</option>)}
              </select>
            </label>
          </div>

          <label className="block text-sm font-semibold text-gray-300">Additional instructions <span className="font-normal text-gray-500">(optional)</span>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={1000} rows="4" placeholder="Example: Focus on Unit 2 concepts and include conceptual + application-based questions." className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-normal outline-none focus:border-indigo-500" />
          </label>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4 text-sm text-gray-300">
            <p className="font-semibold text-emerald-200">Important</p>
            <p className="mt-1">Questions are generated from the uploaded material only. You can edit, reorder, delete, save, start solo, or host them after generation.</p>
          </div>

          <button type="submit" disabled={loading || !file} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-3 font-bold shadow-lg shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Reading document & generating quiz..." : "✨ Generate Quiz from Document"}
          </button>
        </form>
      </div>
    </main>
  );
}
