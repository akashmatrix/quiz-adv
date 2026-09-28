import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios.js";

const optionLetter = (index) => {
  const n = Number(index);
  return Number.isInteger(n) && n >= 0 && n < 26 ? String.fromCharCode(65 + n) : "—";
};

const optionText = (options, index) => {
  const n = Number(index);
  return Array.isArray(options) && Number.isInteger(n) && n >= 0 && n < options.length
    ? options[n]
    : "Not answered";
};

function HistoryList({ items, loading, error, onOpen }) {
  return (
    <section className="surface rounded-3xl p-5 sm:p-7">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Your activity</p>
          <h2 className="mt-1 text-2xl font-black">Quiz History</h2>
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Latest 7 have full review
        </span>
      </div>

      {error && <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">⚠ {error}</div>}
      {loading ? (
        <div className="rounded-2xl bg-white/[0.025] p-6 text-sm text-slate-500">Loading your history...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.09] p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl">◷</div>
          <p className="mt-4 font-semibold">No quiz history yet</p>
          <p className="mt-1 text-sm text-slate-500">Complete a solo or multiplayer quiz and it will appear here.</p>
          <Link to="/create-quiz" className="mt-5 inline-flex btn-primary">Create a Quiz →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item._id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-indigo-400/20 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 font-bold text-indigo-300">{index + 1}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-bold text-slate-100">{item.quizTitle || item.category || "General Quiz"}</p>
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">{item.kind === "multiplayer" ? "Live" : "Solo"}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Date unavailable"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:gap-6">
                  <div><p className="text-sm font-black text-white">{item.points ?? item.score ?? 0}</p><p className="text-[9px] uppercase tracking-wider text-slate-600">Points</p></div>
                  <div><p className="text-sm font-black text-white">{item.score ?? 0}/{item.totalQuestions ?? 0}</p><p className="text-[9px] uppercase tracking-wider text-slate-600">Correct</p></div>
                  <div><p className="text-sm font-black text-violet-300">{item.rank ? `#${item.rank}` : "—"}</p><p className="text-[9px] uppercase tracking-wider text-slate-600">Rank</p></div>
                </div>

                {item.detailsRetained ? (
                  <button onClick={() => onOpen(item)} className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-2.5 text-sm font-bold text-indigo-200 transition hover:bg-indigo-500/20">View Answers →</button>
                ) : (
                  <span className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-center text-xs font-semibold text-slate-500">Summary only</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function HistoryDetail({ item, loading, error, onBack }) {
  if (loading) return <div className="surface rounded-3xl p-7 text-sm text-slate-400">Loading quiz review...</div>;
  if (error) return <div className="surface rounded-3xl p-7"><p className="text-red-300">{error}</p><button onClick={onBack} className="mt-5 btn-secondary">← Back to History</button></div>;
  if (!item) return null;

  return (
    <section className="surface rounded-3xl p-5 sm:p-7">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button onClick={onBack} className="mb-4 text-sm font-bold text-indigo-300 hover:text-indigo-200">← Back to History</button>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Quiz Review</p>
          <h2 className="mt-1 text-2xl font-black">{item.quizTitle || item.category || "General Quiz"}</h2>
          <p className="mt-2 text-sm text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-white/[0.04] px-4 py-3"><p className="font-black">{item.points ?? item.score ?? 0}</p><p className="text-[9px] uppercase tracking-wider text-slate-600">Points</p></div>
          <div className="rounded-xl bg-white/[0.04] px-4 py-3"><p className="font-black">{item.score ?? 0}/{item.totalQuestions ?? 0}</p><p className="text-[9px] uppercase tracking-wider text-slate-600">Correct</p></div>
          <div className="rounded-xl bg-white/[0.04] px-4 py-3"><p className="font-black text-violet-300">{item.rank ? `#${item.rank}` : "—"}</p><p className="text-[9px] uppercase tracking-wider text-slate-600">Rank</p></div>
        </div>
      </div>

      <div className="space-y-4">
        {(item.breakdown || []).map((b, index) => {
          const selected = Number(b.selectedIndex);
          const correct = Number(b.correctAnswerIndex);
          const answered = Number.isInteger(selected) && selected >= 0;
          return (
            <article key={index} className={`rounded-2xl border p-5 ${b.isCorrect ? "border-emerald-500/20 bg-emerald-500/[0.05]" : "border-red-500/20 bg-red-500/[0.05]"}`}>
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-bold leading-6 text-slate-100">{index + 1}. {b.questionText}</h3>
                <span className="text-xl">{b.isCorrect ? "✅" : "❌"}</span>
              </div>
              {b.imageUrl && <img src={b.imageUrl} alt="Question visual" className="mt-4 max-h-64 w-full rounded-xl border border-white/10 object-contain bg-black/20" />}

              <div className="mt-4 grid gap-2">
                <div className={`rounded-xl border px-4 py-3 text-sm ${b.isCorrect ? "border-emerald-500/20 bg-emerald-500/10" : "border-red-500/20 bg-red-500/10"}`}>
                  <span className="font-bold">Your Answer: </span>
                  {answered ? `${optionLetter(selected)}. ${optionText(b.options, selected)}` : "Not answered"}
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  <span className="font-bold">Correct Answer: </span>
                  {optionLetter(correct)}. {optionText(b.options, correct)}
                </div>
              </div>

              {b.explanation?.trim() && (
                <div className="mt-3 rounded-xl border border-indigo-400/20 bg-indigo-500/[0.05] px-4 py-3 text-sm">
                  <p className="font-bold text-indigo-200">💡 Explanation</p>
                  <p className="mt-1 leading-6 text-slate-300">{b.explanation}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function History() {
  const { id, kind } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(Boolean(id));
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get("/quizzes/history")
      .then(({ data }) => active && setItems(Array.isArray(data) ? data : []))
      .catch((err) => active && setError(err.response?.data?.message || "Unable to load quiz history."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!id) {
      setDetail(null);
      setDetailLoading(false);
      return;
    }
    let active = true;
    setDetailLoading(true);
    setDetailError("");
    api.get(`/quizzes/history/${kind === "multiplayer" ? "room/" : ""}${id}`)
      .then(({ data }) => active && setDetail(data))
      .catch((err) => active && setDetailError(err.response?.data?.message || "Unable to load this quiz review."))
      .finally(() => active && setDetailLoading(false));
    return () => { active = false; };
  }, [id, kind]);

  const openDetail = (item) => {
    const historyId = item.historyId || item._id;
    const itemKind = item.kind || "solo";
    navigate(`/history/${itemKind}/${historyId}`);
  };
  const back = () => navigate("/history");

  return (
    <div className="page-shell">
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="page-container">
        <div className="mb-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-400">Review center</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Quiz History</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Review your latest seven attempts with answers and explanations. Older attempts keep their score, points and rank summary.</p>
        </div>
        {id ? <HistoryDetail item={detail} loading={detailLoading} error={detailError} onBack={back} /> : <HistoryList items={items} loading={loading} error={error} onOpen={openDetail} />}
      </div>
    </div>
  );
}
