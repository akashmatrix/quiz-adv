import React, { useEffect, useState } from "react";
import api from "../api/axios.js";

const statusLabel = (status) => ({
  waiting: "Waiting",
  active: "Active",
  finished: "Finished",
}[status] || status || "Unknown");

export default function HostHistory() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openRoom, setOpenRoom] = useState(null);

  useEffect(() => {
    let active = true;
    api.get("/rooms/host-history")
      .then(({ data }) => active && setRooms(Array.isArray(data) ? data : []))
      .catch((err) => active && setError(err.response?.data?.message || "Unable to load host history."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <div className="page-shell">
      <div className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="page-container">
        <div className="mb-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-400">Host workspace</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Host History</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Every quiz room you hosted is saved here with its participants and final ranking.</p>
        </div>

        <section className="surface rounded-3xl p-5 sm:p-7">
          {error && <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">⚠ {error}</div>}
          {loading ? (
            <div className="rounded-2xl bg-white/[0.025] p-6 text-sm text-slate-500">Loading hosted quizzes...</div>
          ) : rooms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.09] p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl">🎤</div>
              <p className="mt-4 font-semibold">No hosted quizzes yet</p>
              <p className="mt-1 text-sm text-slate-500">Create a live room and its hosting record will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => {
                const participants = Array.isArray(room.participants) ? room.participants : [];
                const expanded = openRoom === String(room._id);
                return (
                  <article key={room._id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate font-black text-slate-100">{room.title || "Hosted Quiz"}</h2>
                          <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-violet-300">{statusLabel(room.status)}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Room {room.roomCode} · {room.questions?.length || 0} questions · {room.createdAt ? new Date(room.createdAt).toLocaleString() : "Date unavailable"}</p>
                      </div>

                      <div className="flex items-center gap-5">
                        <div className="text-center"><p className="font-black text-white">{room.participantCount || 0}</p><p className="text-[9px] uppercase tracking-wider text-slate-600">Players</p></div>
                        <button onClick={() => setOpenRoom(expanded ? null : String(room._id))} className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2.5 text-sm font-bold text-violet-200 transition hover:bg-violet-500/20">
                          {expanded ? "Hide Results" : "View Results →"}
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-5 border-t border-white/[0.07] pt-5">
                        {participants.length === 0 ? (
                          <p className="rounded-xl bg-white/[0.03] p-4 text-sm text-slate-500">No participant result was recorded for this room.</p>
                        ) : (
                          <div className="space-y-2">
                            {participants.slice(0, 10).map((p, index) => (
                              <div key={p._id || `${p.participantName}-${index}`} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
                                <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-xs font-black text-violet-300">#{p.rank || index + 1}</span><span className="font-semibold">{p.participantName}</span></div>
                                <div className="text-right"><p className="font-black">{p.score} pts</p><p className="text-[10px] text-slate-500">{p.correctAnswers}/{p.totalQuestions} correct</p></div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
