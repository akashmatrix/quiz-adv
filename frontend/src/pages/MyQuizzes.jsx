import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import socket from "../socket.js";

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
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your quizzes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => quizzes.filter((quiz) => {
    const matchesSearch = `${quiz.title} ${quiz.topic}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || quiz.creationMethod === filter || quiz.status === filter;
    return matchesSearch && matchesFilter;
  }), [quizzes, search, filter]);

  const remove = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    try {
      await api.delete(`/quizzes/${id}`);
      setQuizzes((items) => items.filter((quiz) => quiz._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete quiz.");
    }
  };

  const duplicate = async (id) => {
    try {
      const { data } = await api.post(`/quizzes/${id}/duplicate`);
      setQuizzes((items) => [data, ...items]);
    } catch (err) {
      setError(err.response?.data?.message || "Could not duplicate quiz.");
    }
  };

  const host = async (id) => {
    try {
      const { data } = await api.post(`/quizzes/${id}/host`);
      if (!socket.connected) socket.connect();
      navigate(`/room/${data.roomCode}`, { state: { isHost: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Could not host quiz.");
    }
  };

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#11131c] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-300">Quiz Library</p><h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">My Quizzes</h1><p className="mt-2 text-sm text-gray-400">Your saved quizzes stay here until you choose what to do with them.</p></div>
          <Link to="/create-quiz" className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3 text-center font-bold">+ Create Quiz</Link>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">⚠️ {error}</div>}

        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_220px]"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quizzes..." className="rounded-xl border border-white/10 bg-[#191b26] px-4 py-3 outline-none focus:border-pink-500" /><select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#191b26] px-4 py-3 outline-none"><option value="all">All</option><option value="manual">Manual</option><option value="ai">AI</option><option value="pdf">PDF</option><option value="ppt">PPT</option><option value="draft">Draft</option><option value="ready">Ready</option></select></div>

        {loading ? <div className="rounded-2xl border border-white/10 bg-[#191b26] p-8 text-center text-gray-400">Loading your quizzes...</div> : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-[#191b26] p-10 text-center"><p className="text-lg font-semibold">No saved quizzes found.</p><p className="mt-2 text-sm text-gray-400">Create a manual quiz and save it here.</p></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((quiz) => <article key={quiz._id} className="rounded-2xl border border-white/10 bg-[#191b26] p-5 shadow-lg"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{quiz.title}</h2><p className="mt-1 text-sm text-gray-400">{quiz.topic || "General"}</p></div><span className="rounded-full bg-pink-500/10 px-3 py-1 text-xs font-semibold capitalize text-pink-200">{quiz.status}</span></div><div className="mt-5 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white/5 px-3 py-1 text-gray-300">{quiz.questions?.length || 0} Questions</span><span className="rounded-full bg-white/5 px-3 py-1 capitalize text-gray-300">{quiz.difficulty}</span><span className="rounded-full bg-white/5 px-3 py-1 uppercase text-gray-300">{quiz.creationMethod}</span></div><p className="mt-4 line-clamp-2 text-sm text-gray-400">{quiz.description || "No description"}</p><p className="mt-4 text-xs text-gray-500">Updated {quiz.updatedAt ? new Date(quiz.updatedAt).toLocaleString() : "—"}</p><div className="mt-5 grid grid-cols-2 gap-2"><Link to={`/create-quiz/manual?edit=${quiz._id}`} className="rounded-lg border border-white/10 px-3 py-2 text-center text-sm font-semibold hover:bg-white/5">Edit</Link><button onClick={() => host(quiz._id)} className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-2 text-sm font-semibold">Host</button><button onClick={() => duplicate(quiz._id)} className="rounded-lg border border-purple-400/20 px-3 py-2 text-sm text-purple-200">Duplicate</button><button onClick={() => remove(quiz._id)} className="rounded-lg border border-red-400/20 px-3 py-2 text-sm text-red-300">Delete</button></div></article>)}</div>}
      </div>
    </main>
  );
}
