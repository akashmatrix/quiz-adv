import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import socket from "../socket.js";

const methodLabels = { manual: "Manual", ai: "AI", pdf: "PDF", ppt: "PPT", pptx: "PPT" };

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/quizzes");
      setQuizzes(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your quizzes.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => quizzes.filter((quiz) => {
    const q = `${quiz.title || ""} ${quiz.topic || ""}`.toLowerCase();
    return q.includes(search.toLowerCase()) && (filter === "all" || quiz.creationMethod === filter || quiz.status === filter);
  }), [quizzes, search, filter]);

  const remove = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    try {
      await api.delete(`/quizzes/${id}`);
      setQuizzes((items) => items.filter((q) => q._id !== id));
    } catch (err) { setError(err.response?.data?.message || "Could not delete quiz."); }
  };

  const duplicate = async (id) => {
    try {
      const { data } = await api.post(`/quizzes/${id}/duplicate`);
      setQuizzes((items) => [data, ...items]);
    } catch (err) { setError(err.response?.data?.message || "Could not duplicate quiz."); }
  };

  const host = async (id) => {
    try {
      const { data } = await api.post(`/quizzes/${id}/host`);
      if (!socket.connected) socket.connect();
      navigate(`/room/${data.roomCode}`, { state: { isHost: true } });
    } catch (err) { setError(err.response?.data?.message || "Could not host quiz."); }
  };

  return (
    <div className="page-shell">
      <div className="page-container">
        <section className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-400">Quiz Library</span>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">My Quizzes</h1>
            <p className="mt-2 text-sm text-slate-500">Your saved quizzes, ready whenever you want to edit, practice or host.</p>
          </div>
          <Link to="/create-quiz" className="btn-primary">✦ Create Quiz</Link>
        </section>

        {error && <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">⚠ {error}</div>}

        <section className="mb-6 rounded-2xl border border-white/[0.07] bg-[#10121b]/80 p-3">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">⌕</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or topic..." className="input-modern pl-10" />
            </div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-modern md:w-52">
              <option value="all">All quizzes</option><option value="manual">Manual</option><option value="ai">AI</option><option value="pdf">PDF</option><option value="ppt">PPT</option><option value="draft">Draft</option><option value="ready">Ready</option>
            </select>
          </div>
        </section>

        <div className="mb-5 flex items-center justify-between text-xs text-slate-600">
          <span>{loading ? "Loading..." : `${filtered.length} quiz${filtered.length === 1 ? "" : "zes"} found`}</span>
          <span>Saved library</span>
        </div>

        {loading ? (
          <div className="surface rounded-2xl p-12 text-center text-sm text-slate-500">Loading your quiz library...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.09] bg-white/[0.02] p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl text-indigo-300">▦</div>
            <h2 className="mt-4 font-bold">No saved quizzes found</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Create your first quiz and keep it here for later editing or hosting.</p>
            <Link to="/create-quiz" className="btn-primary mt-5">Create your first quiz</Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((quiz) => (
              <article key={quiz._id} className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#10121b]/95 shadow-xl transition hover:-translate-y-1 hover:border-indigo-400/20">
                <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-violet-600 opacity-80" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-white">{quiz.title}</h2>
                      <p className="mt-1 truncate text-xs text-slate-500">{quiz.topic || "General topic"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${quiz.status === "ready" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>{quiz.status}</span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-white/[0.045] px-2.5 py-1.5 text-[10px] font-semibold text-slate-400">{quiz.questions?.length || 0} questions</span>
                    <span className="rounded-lg bg-white/[0.045] px-2.5 py-1.5 text-[10px] font-semibold capitalize text-slate-400">{quiz.difficulty || "mixed"}</span>
                    <span className="rounded-lg bg-white/[0.045] px-2.5 py-1.5 text-[10px] font-semibold text-slate-400">{methodLabels[quiz.creationMethod] || quiz.creationMethod || "Quiz"}</span>
                  </div>

                  <p className="mt-4 line-clamp-2 min-h-[40px] text-sm leading-5 text-slate-500">{quiz.description || "No description added."}</p>
                  <p className="mt-4 text-[10px] text-slate-700">Updated {quiz.updatedAt ? new Date(quiz.updatedAt).toLocaleString() : "—"}</p>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Link to={`/create-quiz/manual?edit=${quiz._id}`} className="btn-secondary px-3 py-2 text-xs">Edit</Link>
                    <button onClick={() => host(quiz._id)} className="btn-primary px-3 py-2 text-xs">Host</button>
                    <button onClick={() => duplicate(quiz._id)} className="rounded-xl border border-violet-400/15 bg-violet-500/5 px-3 py-2 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/10">Duplicate</button>
                    <button onClick={() => remove(quiz._id)} className="rounded-xl border border-red-400/15 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10">Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
