import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

function StatCard({ icon, label, value, detail }) {
  return (
    <div className="surface group rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-indigo-400/20">
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-lg text-indigo-300">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Stats</span>
      </div>
      <p className="mt-5 text-3xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-200">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/rooms/my-results")
      .then(({ data }) => active && setResults(Array.isArray(data) ? data : []))
      .catch((err) => active && setError(err.response?.data?.message || "Unable to load quiz history."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const attempted = results.length;
    const totalQuestions = results.reduce((sum, item) => sum + (item.totalQuestions || 0), 0);
    const totalCorrect = results.reduce((sum, item) => sum + (item.correctAnswers !== undefined ? item.correctAnswers : item.score || 0), 0);
    const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const best = results.reduce((max, item) => {
      const correct = item.correctAnswers !== undefined ? item.correctAnswers : item.score || 0;
      return Math.max(max, item.totalQuestions ? (correct / item.totalQuestions) * 100 : 0);
    }, 0);
    return { attempted, accuracy, best: Math.round(best), totalCorrect };
  }, [results]);

  return (
    <div className="page-shell">
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-72 h-[30rem] w-[30rem] rounded-full bg-violet-700/10 blur-[140px]" />

      <div className="page-container">
        <section className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-400">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,.8)]" />
              Quiz workspace
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
              Welcome back, <span className="bg-gradient-to-r from-indigo-300 to-violet-400 bg-clip-text text-transparent">{user?.name || "Player"}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Create, practice and host quizzes from one clean workspace.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/create-quiz" className="btn-secondary">Build a Quiz</Link>
            <Link to="/create-quiz" className="btn-primary">✦ Create Quiz</Link>
          </div>
        </section>

        <section className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon="▣" label="Quizzes Attempted" value={loading ? "—" : stats.attempted} detail="Completed attempts" />
          <StatCard icon="◎" label="Overall Accuracy" value={loading ? "—" : `${stats.accuracy}%`} detail="Across your attempts" />
          <StatCard icon="♛" label="Best Performance" value={loading ? "—" : `${stats.best}%`} detail="Highest percentage" />
          <StatCard icon="✓" label="Correct Answers" value={loading ? "—" : stats.totalCorrect} detail="Total correct answers" />
        </section>

        {error && <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">⚠ {error}</div>}

        <section className="relative mb-8 overflow-hidden rounded-[28px] border border-white/[0.09] bg-gradient-to-br from-[#171927] via-[#10121c] to-[#0c0e16] p-7 shadow-2xl sm:p-10">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/15 blur-[80px]" />
          <div className="relative max-w-2xl">
            <span className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">Build your next challenge</span>
            <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
              One place for every quiz.
              <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-violet-400 bg-clip-text text-transparent">Create. Practice. Compete.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
              Start from scratch, let AI generate questions, import study material, or jump into a live room.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/create-quiz" className="btn-primary">Start creating <span>→</span></Link>
              <Link to="/leaderboard" className="btn-secondary">View leaderboard</Link>
            </div>
          </div>
        </section>

        <section className="surface rounded-2xl p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Activity</p><h2 className="mt-1 text-lg font-bold">Recent quiz history</h2></div>
            <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Latest 5</span>
          </div>

          {loading ? <div className="rounded-xl bg-white/[0.025] p-5 text-sm text-slate-500">Loading your activity...</div> :
            results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.09] p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl">◈</div>
                <p className="mt-3 font-semibold">No attempts yet</p>
                <p className="mt-1 text-sm text-slate-500">Create or host a quiz and your activity will appear here.</p>
                <Link to="/create-quiz" className="mt-4 inline-flex text-sm font-bold text-indigo-300 hover:text-indigo-200">Create a quiz →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {results.slice(0, 5).map((item) => (
                  <div key={item._id} className="flex flex-col gap-3 rounded-xl border border-white/[0.05] bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-sm text-indigo-300">Q</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{item.category || "General Quiz"}</p>
                        <p className="mt-0.5 text-xs text-slate-600">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Date unavailable"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 sm:text-right">
                      <div><p className="text-sm font-bold">{item.correctAnswers !== undefined ? `${item.correctAnswers}/${item.totalQuestions}` : `${item.score}/${item.totalQuestions}`}</p><p className="text-[10px] uppercase tracking-wider text-slate-600">Correct</p></div>
                      {item.rank !== undefined && <div><p className="text-sm font-bold text-violet-300">#{item.rank}</p><p className="text-[10px] uppercase tracking-wider text-slate-600">Rank</p></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>
      </div>
    </div>
  );
}
