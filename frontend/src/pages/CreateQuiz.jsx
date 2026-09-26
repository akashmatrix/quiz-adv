import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios.js";
import socket from "../socket.js";

const makeQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctAnswerIndex: 0,
  explanation: "",
  timeLimit: 20,
});

const defaultQuiz = () => ({
  title: "",
  description: "",
  topic: "General",
  difficulty: "medium",
  creationMethod: "manual",
  status: "draft",
  timePerQuestion: 20,
  questions: [makeQuestion()],
});

export default function CreateQuiz() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(defaultQuiz);
  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!editId) return;
    let active = true;
    api.get(`/quizzes/${editId}`)
      .then(({ data }) => active && setQuiz(data))
      .catch((err) => active && setError(err.response?.data?.message || "Could not load quiz"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [editId]);

  const update = (field, value) => setQuiz((current) => ({ ...current, [field]: value }));

  const updateQuestion = (index, field, value) => {
    setQuiz((current) => {
      const questions = [...current.questions];
      questions[index] = { ...questions[index], [field]: value };
      return { ...current, questions };
    });
  };

  const updateOption = (qIndex, optionIndex, value) => {
    setQuiz((current) => {
      const questions = [...current.questions];
      const options = [...questions[qIndex].options];
      options[optionIndex] = value;
      questions[qIndex] = { ...questions[qIndex], options };
      return { ...current, questions };
    });
  };

  const addQuestion = () => update("questions", [...quiz.questions, makeQuestion()]);
  const removeQuestion = (index) => {
    if (quiz.questions.length === 1) return;
    update("questions", quiz.questions.filter((_, i) => i !== index));
  };
  const duplicateQuestion = (index) => {
    const copy = { ...quiz.questions[index], options: [...quiz.questions[index].options] };
    const questions = [...quiz.questions];
    questions.splice(index + 1, 0, copy);
    update("questions", questions);
  };
  const moveQuestion = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= quiz.questions.length) return;
    const questions = [...quiz.questions];
    [questions[index], questions[target]] = [questions[target], questions[index]];
    update("questions", questions);
  };

  const validate = () => {
    if (!quiz.title.trim()) return "Quiz title is required.";
    if (!quiz.questions.length) return "Add at least one question.";
    for (let i = 0; i < quiz.questions.length; i += 1) {
      const q = quiz.questions[i];
      if (!q.questionText.trim()) return `Question ${i + 1} needs text.`;
      if (q.options.length !== 4 || q.options.some((option) => !option.trim())) return `Question ${i + 1} needs all 4 options.`;
      if (q.correctAnswerIndex < 0 || q.correctAnswerIndex > 3) return `Question ${i + 1} needs a correct answer.`;
      if (q.timeLimit < 2 || q.timeLimit > 120) return `Question ${i + 1} timer must be between 2 and 120 seconds.`;
    }
    return "";
  };

  const saveQuiz = async (afterSave = "stay") => {
    setError("");
    setNotice("");
    const validation = validate();
    if (validation) {
      setError(validation);
      return null;
    }

    setSaving(true);
    try {
      const payload = { ...quiz, status: "draft" };
      const response = editId
        ? await api.put(`/quizzes/${editId}`, payload)
        : await api.post("/quizzes", payload);
      const saved = response.data;
      setQuiz(saved);
      setNotice("Quiz saved to MongoDB successfully.");

      if (afterSave === "host") {
        const hostResponse = await api.post(`/quizzes/${saved._id}/host`);
        const roomCode = hostResponse.data.roomCode;
        if (!socket.connected) socket.connect();
        navigate(`/room/${roomCode}`, { state: { isHost: true } });
      } else if (afterSave === "list") {
        navigate("/my-quizzes");
      }
      return saved;
    } catch (err) {
      setError(err.response?.data?.message || "Could not save quiz.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const questionCount = useMemo(() => quiz.questions.length, [quiz.questions.length]);

  if (loading) return <div className="min-h-screen bg-[#11131c] p-10 text-center text-gray-300">Loading quiz...</div>;

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#11131c] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link to="/my-quizzes" className="text-sm text-pink-300 hover:text-pink-200">← My Quizzes</Link>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{editId ? "Edit Quiz" : "Create Manual Quiz"}</h1>
            <p className="mt-2 text-sm text-gray-400">Build it now, save it, and host it later.</p>
          </div>
          <span className="rounded-full border border-pink-400/20 bg-pink-500/10 px-4 py-2 text-sm text-pink-200">{questionCount} questions</span>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">⚠️ {error}</div>}
        {notice && <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">✓ {notice}</div>}

        <section className="mb-6 rounded-3xl border border-white/10 bg-[#191b26] p-5 shadow-xl sm:p-7">
          <h2 className="text-xl font-bold">Quiz Details</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2 text-sm font-semibold text-gray-300">Title<input value={quiz.title} onChange={(e) => update("title", e.target.value)} placeholder="Java OOP Quiz" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-normal outline-none focus:border-pink-500" /></label>
            <label className="md:col-span-2 text-sm font-semibold text-gray-300">Description<textarea value={quiz.description} onChange={(e) => update("description", e.target.value)} placeholder="What this quiz covers..." rows="3" className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-normal outline-none focus:border-pink-500" /></label>
            <label className="text-sm font-semibold text-gray-300">Topic<input value={quiz.topic} onChange={(e) => update("topic", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-normal outline-none focus:border-pink-500" /></label>
            <label className="text-sm font-semibold text-gray-300">Difficulty<select value={quiz.difficulty} onChange={(e) => update("difficulty", e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#20212d] px-4 py-3 font-normal outline-none focus:border-pink-500"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
          </div>
        </section>

        <div className="space-y-5">
          {quiz.questions.map((q, qIndex) => (
            <section key={q._id || qIndex} className="rounded-3xl border border-white/10 bg-[#191b26] p-5 shadow-xl sm:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 font-bold">{qIndex + 1}</span><h2 className="text-xl font-bold">Question {qIndex + 1}</h2></div>
                <div className="flex flex-wrap gap-2 text-xs"><button type="button" onClick={() => moveQuestion(qIndex, -1)} disabled={qIndex === 0} className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-30">↑</button><button type="button" onClick={() => moveQuestion(qIndex, 1)} disabled={qIndex === quiz.questions.length - 1} className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-30">↓</button><button type="button" onClick={() => duplicateQuestion(qIndex)} className="rounded-lg border border-purple-400/20 px-3 py-2 text-purple-200">Duplicate</button><button type="button" onClick={() => removeQuestion(qIndex)} disabled={quiz.questions.length === 1} className="rounded-lg border border-red-400/20 px-3 py-2 text-red-300 disabled:opacity-30">Delete</button></div>
              </div>
              <textarea rows="3" value={q.questionText} onChange={(e) => updateQuestion(qIndex, "questionText", e.target.value)} placeholder="Enter question text..." className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-pink-500" />
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {q.options.map((option, optionIndex) => <div key={optionIndex} className={`flex items-center gap-3 rounded-xl border p-3 ${q.correctAnswerIndex === optionIndex ? "border-pink-500/50 bg-pink-500/10" : "border-white/10 bg-white/[0.03]"}`}><input type="radio" name={`correct-${qIndex}`} checked={q.correctAnswerIndex === optionIndex} onChange={() => updateQuestion(qIndex, "correctAnswerIndex", optionIndex)} className="accent-pink-500" /><b className="text-xs text-gray-500">{String.fromCharCode(65 + optionIndex)}</b><input value={option} onChange={(e) => updateOption(qIndex, optionIndex, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`} className="w-full bg-transparent outline-none" /></div>)}
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-[1fr_220px]">
                <label className="text-sm font-semibold text-gray-300">Explanation <span className="font-normal text-gray-500">(optional)</span><textarea rows="2" value={q.explanation || ""} onChange={(e) => updateQuestion(qIndex, "explanation", e.target.value)} placeholder="Explain why the answer is correct..." className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-normal outline-none focus:border-pink-500" /></label>
                <label className="text-sm font-semibold text-gray-300">Time per question<select value={q.timeLimit} onChange={(e) => updateQuestion(qIndex, "timeLimit", Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#20212d] px-4 py-3 font-normal outline-none focus:border-pink-500">{[2,5,10,15,30,45,60,90,120].map((n) => <option key={n} value={n}>{n} seconds</option>)}</select></label>
              </div>
            </section>
          ))}
        </div>

        <button type="button" onClick={addQuestion} className="mt-5 w-full rounded-2xl border-2 border-dashed border-pink-400/30 py-4 font-semibold text-pink-300 hover:bg-pink-500/10">+ Add Question</button>

        <div className="sticky bottom-4 mt-7 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#10111a]/95 p-3 shadow-2xl backdrop-blur sm:flex-row sm:justify-end">
          <button type="button" onClick={() => saveQuiz("stay")} disabled={saving} className="rounded-xl border border-white/10 px-5 py-3 font-semibold hover:bg-white/5 disabled:opacity-50">{saving ? "Saving..." : "Save Quiz"}</button>
          <button type="button" onClick={() => saveQuiz("list")} disabled={saving} className="rounded-xl border border-purple-400/30 bg-purple-500/10 px-5 py-3 font-semibold text-purple-200 disabled:opacity-50">Save & View My Quizzes</button>
          <button type="button" onClick={() => saveQuiz("host")} disabled={saving} className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3 font-bold shadow-lg shadow-pink-500/20 disabled:opacity-50">Save & Host ⚡</button>
        </div>
      </div>
    </main>
  );
}
