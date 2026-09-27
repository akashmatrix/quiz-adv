import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";

const Icon = ({ name, size = 20, stroke = 1.8 }) => {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    trophy: <><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4"/><path d="M17 6h3v2a4 4 0 0 1-4 4"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    trend: <><path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
    medal: <><path d="M8 3h8l-2 5h-4L8 3Z"/><circle cx="12" cy="15" r="5"/><path d="m12 12 1 2 2 .3-1.5 1.5.4 2.2-1.9-1-1.9 1 .4-2.2L8 14.3l2-.3 1-2"/></>,
    refresh: <><path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10"/><path d="M3 4v6h6"/><path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14"/><path d="M21 20v-6h-6"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const initials = (name = "U") => name.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

export default function Leaderboard() {
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeaderboard = async (silent = false) => {
    try {
      if (silent) setRefreshing(true); else setLoading(true);
      setError("");
      const res = await api.get("/quiz/leaderboard");
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load leaderboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadLeaderboard(); }, []);

  const stats = useMemo(() => {
    const scores = results.map((r) => Number(r.score || 0));
    const correct = results.reduce((n, r) => n + Number(r.correctAnswers || 0), 0);
    const questions = results.reduce((n, r) => n + Number(r.totalQuestions || 0), 0);
    return {
      players: results.length,
      topScore: scores.length ? Math.max(...scores) : 0,
      accuracy: questions ? Math.round((correct / questions) * 100) : 0,
    };
  }, [results]);

  const podium = results.slice(0, 3);
  const rest = results.slice(3);

  return (
    <div className="page-shell min-h-screen">
      <div className="page-container">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-indigo-300">
              <Icon name="trophy" size={14} /> Performance
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-slate-50">Leaderboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">See how players are performing across multiplayer quizzes.</p>
          </div>
          <button onClick={() => loadLeaderboard(true)} disabled={refreshing} className="btn-secondary self-start md:self-auto">
            <Icon name="refresh" size={16} /> {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          <Stat icon="users" label="Players" value={stats.players} />
          <Stat icon="trophy" label="Top Score" value={stats.topScore} />
          <Stat icon="target" label="Avg. Accuracy" value={`${stats.accuracy}%`} />
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</div>}

        {loading ? (
          <div className="surface rounded-3xl p-12 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-400" />
            <p className="text-sm text-slate-400">Loading leaderboard...</p>
          </div>
        ) : results.length === 0 && !error ? (
          <div className="surface rounded-3xl p-14 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-300"><Icon name="target" size={27}/></div>
            <h2 className="text-lg font-bold text-slate-100">No results yet</h2>
            <p className="mt-2 text-sm text-slate-500">Complete a multiplayer quiz to appear here.</p>
          </div>
        ) : (
          <>
            <section className="surface rounded-3xl overflow-hidden mb-7">
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 md:px-6">
                <div><h2 className="font-bold text-slate-100">Top performers</h2><p className="text-xs text-slate-500 mt-1">Highest scores in the current leaderboard</p></div>
                <Icon name="medal" size={20} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 md:p-6">
                {podium.map((r, i) => <PodiumCard key={r._id || i} result={r} rank={i + 1} />)}
              </div>
            </section>

            {rest.length > 0 && (
              <section className="surface rounded-3xl overflow-hidden">
                <div className="border-b border-white/5 px-5 py-4 md:px-6"><h2 className="font-bold text-slate-100">Full rankings</h2><p className="text-xs text-slate-500 mt-1">Detailed score breakdown</p></div>
                <div className="divide-y divide-white/5">
                  {rest.map((r, i) => <RankingRow key={r._id || i} result={r} rank={i + 4} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return <div className="surface rounded-2xl p-5 flex items-center gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-300"><Icon name={icon} /></div><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-slate-100">{value}</p></div></div>;
}

function getPlayer(result) { return result.participantName || result.user?.name || "Unknown Player"; }
function getAccuracy(result) { const total = Number(result.totalQuestions || 0); return total ? Math.round((Number(result.correctAnswers || 0) / total) * 100) : 0; }

function PodiumCard({ result, rank }) {
  const name = getPlayer(result);
  return <div className={`relative rounded-2xl border p-5 ${rank === 1 ? "border-indigo-400/30 bg-indigo-500/[.08]" : "border-white/7 bg-white/[.025]"}`}>
    <div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10 text-xs font-black text-indigo-300">#{rank}</span><Icon name="medal" size={18}/></div>
    <div className="mt-5 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-black text-white">{initials(name)}</div><div className="min-w-0"><p className="truncate font-bold text-slate-100">{name}</p><p className="text-xs text-slate-500">{result.correctAnswers ?? 0}/{result.totalQuestions ?? 0} correct</p></div></div>
    <div className="mt-5 flex items-end justify-between"><div><p className="text-2xl font-black text-indigo-300">{result.score ?? 0}</p><p className="text-[10px] uppercase tracking-wider text-slate-600">points</p></div><span className="text-xs font-bold text-slate-400">{getAccuracy(result)}% accuracy</span></div>
  </div>;
}

function RankingRow({ result, rank }) {
  const name = getPlayer(result);
  const accuracy = getAccuracy(result);
  return <div className="grid grid-cols-[42px_minmax(0,1fr)_100px_90px] items-center gap-3 px-5 py-4 md:px-6 hover:bg-white/[.025] transition-colors">
    <span className="text-sm font-bold text-slate-500">#{rank}</span>
    <div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-800 text-[11px] font-black text-slate-300">{initials(name)}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-200">{name}</p><p className="text-xs text-slate-600">{result.correctAnswers ?? 0} correct</p></div></div>
    <div className="hidden sm:block"><div className="mb-1 flex justify-between text-[10px] text-slate-600"><span>Accuracy</span><span>{accuracy}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${accuracy}%` }} /></div></div>
    <div className="text-right"><p className="font-black text-indigo-300">{result.score ?? 0}</p><p className="text-[10px] text-slate-600">points</p></div>
  </div>;
}
