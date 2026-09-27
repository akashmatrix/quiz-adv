import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";

function Metric({ label, value, hint }) {
  return (
    <div className="surface rounded-2xl p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function percentOf(item) {
  const total = Number(item?.totalQuestions || 0);
  const correct = Number(item?.correctAnswers ?? item?.score ?? 0);
  return total ? Math.round((correct / total) * 100) : 0;
}

export default function Analytics() {
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get("/quiz/my-results"),
      api.get("/rooms/my-results"),
      api.get("/quiz/leaderboard"),
    ])
      .then(([soloRes, roomRes, leaderboardRes]) => {
        if (!active) return;
        const solo = Array.isArray(soloRes.data) ? soloRes.data.map((x) => ({ ...x, mode: "Solo" })) : [];
        const rooms = Array.isArray(roomRes.data) ? roomRes.data.map((x) => ({ ...x, mode: "Live" })) : [];
        const merged = [...solo, ...rooms].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setHistory(merged);
        setLeaderboard(Array.isArray(leaderboardRes.data) ? leaderboardRes.data : []);
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || "Unable to load quiz history.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const attempted = history.length;
    const questions = history.reduce((sum, item) => sum + Number(item.totalQuestions || 0), 0);
    const correct = history.reduce((sum, item) => sum + Number(item.correctAnswers ?? item.score ?? 0), 0);
    const accuracy = questions ? Math.round((correct / questions) * 100) : 0;
    const best = history.reduce((max, item) => Math.max(max, percentOf(item)), 0);
    return { attempted, questions, correct, accuracy, best };
  }, [history]);

  return (
    <div className="page-shell">
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="page-container max-w-6xl">
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-400">Performance center</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Analytics</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Your solo practice, live quiz results and leaderboard in one place.</p>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">⚠ {error}</div>}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Attempts" value={loading ? "—" : stats.attempted} hint="Completed quizzes" />
          <Metric label="Accuracy" value={loading ? "—" : `${stats.accuracy}%`} hint="Overall accuracy" />
          <Metric label="Best score" value={loading ? "—" : `${stats.best}%`} hint="Highest percentage" />
          <Metric label="Correct" value={loading ? "—" : stats.correct} hint="Total correct answers" />
          <Metric label="Questions" value={loading ? "—" : stats.questions} hint="Questions attempted" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
          <div className="surface rounded-2xl p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">History</p><h2 className="mt-1 text-lg font-bold">Recent results</h2></div>
              <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-bold text-indigo-300">{history.length} attempts</span>
            </div>
            {loading ? <p className="text-sm text-slate-500">Loading results...</p> : history.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No quiz results yet.</div> : (
              <div className="space-y-2">
                {history.slice(0, 10).map((item, index) => {
                  const percent = percentOf(item);
                  const correct = Number(item.correctAnswers ?? item.score ?? 0);
                  const total = Number(item.totalQuestions || 0);
                  return (
                    <div key={item._id || `${item.createdAt}-${index}`} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-200">{item.category || item.quizTitle || "Quiz attempt"}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.mode} • {correct}/{total} correct</p>
                        </div>
                        <span className="shrink-0 font-black text-indigo-300">{percent}%</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${percent}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="surface rounded-2xl p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Leaderboard</p>
            <h2 className="mt-1 text-lg font-bold">Top players</h2>
            <div className="mt-5 space-y-2">
              {loading ? <p className="text-sm text-slate-500">Loading leaderboard...</p> : leaderboard.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No multiplayer results yet.</div> : leaderboard.slice(0, 10).map((r, idx) => (
                <div key={r._id || `${r.user?._id}-${idx}`} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-black text-indigo-300">{idx + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-200">{r.user?.name || "Player"}</p><p className="text-xs text-slate-500">{r.correctAnswers ?? r.score ?? 0}/{r.totalQuestions ?? "—"}</p></div>
                  <span className="font-bold text-slate-300">{r.score ?? r.correctAnswers ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
