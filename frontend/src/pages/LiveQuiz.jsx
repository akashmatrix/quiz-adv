import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import socket from "../socket.js";


function playerName(player) {
  return player?.name || player?.participantName || "Unknown Player";
}

function initials(name = "U") {
  return name.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
}

function AnimatedLeaderboard({ players = [], previousRanks = {}, participantId, finalView = false, displayDurationMs = 6500 }) {
  const [ready, setReady] = useState(false);
  const [moveBadges, setMoveBadges] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(displayDurationMs / 1000));
  const rowHeight = 78;

  useEffect(() => {
    setReady(false);
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, [players]);

  useEffect(() => {
    setSecondsLeft(Math.ceil(displayDurationMs / 1000));
    if (finalView) return undefined;

    const startedAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, Math.ceil((displayDurationMs - elapsed) / 1000));
      setSecondsLeft(remaining);
    }, 250);

    return () => clearInterval(timer);
  }, [displayDurationMs, players, finalView]);

  useEffect(() => {
    if (!players.length || finalView) return;

    const nextBadges = {};
    players.forEach((p, index) => {
      const id = p.participantId || p.name || `player-${index}`;
      const newRank = index + 1;
      const oldRank = previousRanks[id];

      if (oldRank && oldRank !== newRank) {
        nextBadges[id] = {
          direction: oldRank > newRank ? "up" : "down",
          from: oldRank,
          to: newRank,
        };
      }
    });

    setMoveBadges(nextBadges);
    if (!Object.keys(nextBadges).length) return undefined;

    const timeout = setTimeout(() => setMoveBadges({}), 1800);
    return () => clearTimeout(timeout);
  }, [players, previousRanks, finalView]);

  const ranked = useMemo(() => players.map((p, index) => ({ ...p, __rank: index + 1 })), [players]);

  if (!ranked.length) {
    return <div className="rounded-2xl border border-white/10 bg-white/[.03] p-8 text-center text-sm text-gray-500">No participants yet.</div>;
  }

  return (
    <div className="relative">
      {!finalView && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-violet-400/15 bg-violet-500/[.06] px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-300">Rank transition</p>
            <p className="mt-1 text-xs text-gray-500">Players are moving to their new positions</p>
          </div>
          <div className="min-w-[58px] text-right">
            <p className="text-xl font-black tabular-nums text-white">{secondsLeft}s</p>
            <p className="text-[9px] uppercase tracking-widest text-gray-600">next question</p>
          </div>
        </div>
      )}

      <div className={`${finalView ? "max-h-[62vh]" : "max-h-[55vh]"} overflow-y-auto pr-1`} style={{ scrollbarWidth: "thin" }}>
        <div className="space-y-2">
          {ranked.map((p) => {
            const rank = p.__rank;
            const oldRank = previousRanks[p.participantId];
            const offset = oldRank ? (oldRank - rank) * rowHeight : 0;
            const isMe = participantId && p.participantId === participantId;
            const topFive = rank <= 5;
            const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
            const move = moveBadges[p.participantId];

            return (
              <div
                key={p.participantId || p.name}
                className="relative"
              >
                {move && (
                  <div
                    className={`rank-move-pop absolute right-16 top-1/2 z-20 -translate-y-1/2 rounded-full border px-3 py-1.5 text-[11px] font-black shadow-2xl backdrop-blur-md ${move.direction === "up" ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-300" : "border-rose-300/30 bg-rose-400/15 text-rose-300"}`}
                  >
                    {move.direction === "up" ? "↑" : "↓"} #{move.from} → #{move.to}
                  </div>
                )}

                <div
                  className={`group flex min-h-[68px] items-center gap-3 rounded-2xl border px-3 py-3 md:px-4 ${isMe ? "border-violet-400/50 bg-violet-500/10" : topFive ? "border-white/10 bg-white/[.055]" : "border-white/[.06] bg-white/[.025]"}`}
                  style={{
                    transform: ready ? "translateY(0)" : `translateY(${offset}px)`,
                    transition: "transform 1450ms cubic-bezier(.16,1,.3,1), background-color 450ms ease, border-color 450ms ease, box-shadow 700ms ease",
                    boxShadow: move ? (move.direction === "up" ? "0 0 34px rgba(52, 211, 153, .16)" : "0 0 34px rgba(251, 113, 133, .12)") : undefined,
                  }}
                >
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black ${rank === 1 ? "bg-yellow-400/15 text-yellow-300" : rank === 2 ? "bg-slate-300/15 text-slate-200" : rank === 3 ? "bg-orange-400/15 text-orange-300" : "bg-black/20 text-gray-400"}`}>
                    {medal || `#${rank}`}
                  </div>

                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-black text-white shadow-lg shadow-indigo-900/20">
                    {initials(playerName(p))}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-bold text-slate-100">{playerName(p)}</p>
                      {isMe && <span className="shrink-0 rounded-full bg-violet-400/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-300">You</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{p.correctCount ?? p.correctAnswers ?? 0} correct</p>
                  </div>

                  <div className="text-right">
                    <p className={`font-black ${topFive ? "text-violet-300" : "text-slate-300"}`}>{p.score ?? 0}</p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-600">points</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes rankMovePop {
          0% { opacity: 0; transform: translateY(-50%) scale(.55); filter: blur(3px); }
          18% { opacity: 1; transform: translateY(-50%) scale(1.12); filter: blur(0); }
          38% { transform: translateY(-50%) scale(1); }
          72% { opacity: 1; transform: translateY(-50%) scale(1); }
          100% { opacity: 0; transform: translateY(-68%) scale(.92); }
        }
        .rank-move-pop { animation: rankMovePop 1800ms cubic-bezier(.16,1,.3,1) both; }
      `}</style>
    </div>
  );
}

export default function LiveQuiz() {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isHost = location.state?.isHost || false;

  const [phase, setPhase] = useState("question");

  const [question, setQuestion] = useState(
    location.state?.initialQuestion || null
  );

  const [selected, setSelected] = useState(null);

  const [timeLeft, setTimeLeft] = useState(
    location.state?.initialQuestion?.timeLimit || 0
  );

  const [leaderboard, setLeaderboard] = useState([]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);
  const [previousRanks, setPreviousRanks] = useState({});
  const [leaderboardDurationMs, setLeaderboardDurationMs] = useState(6500);
  const leaderboardRef = useRef([]);

  // =========================================================
  // PARTICIPANT ID + NAME
  // =========================================================

  const participantId = localStorage.getItem(
    `quizneon-participant-${roomCode}`
  );

  const participantName = localStorage.getItem(
    `quizneon-name-${roomCode}`
  );

  // =========================================================
  // SOCKET EVENTS
  // =========================================================

  useEffect(() => {
    function handleQuestion(data) {
      setQuestion(data);
      setSelected(null);
      setPhase("question");
      setTimeLeft(data.timeRemaining ?? data.timeLimit);
    }

    function handleLeaderboard(data) {
      const incoming = data.leaderboard || [];
      const oldRanks = {};
      leaderboardRef.current.forEach((p, index) => { oldRanks[p.participantId] = index + 1; });
      setPreviousRanks(oldRanks);
      leaderboardRef.current = incoming;
      setLeaderboard(incoming);
      setCorrectAnswerIndex(data.correctAnswerIndex);
      setLeaderboardDurationMs(Number(data.displayDurationMs) || 6500);
      setPhase("leaderboard");
    }

    function handleFinished(data) {
      setFinalLeaderboard(data.leaderboard || []);
      setPhase("finished");
    }

    socket.on("quiz:question", handleQuestion);
    socket.on("quiz:leaderboard", handleLeaderboard);
    socket.on("quiz:finished", handleFinished);

    // =======================================================
    // RECONNECT PARTICIPANT AFTER REFRESH
    // =======================================================

    if (!isHost) {
      const savedParticipantId = localStorage.getItem(
        `quizneon-participant-${roomCode}`
      );

      const savedParticipantName = localStorage.getItem(
        `quizneon-name-${roomCode}`
      );

      const token = localStorage.getItem("token");

      if (savedParticipantId && savedParticipantName) {
        socket.emit("participant:joinRoom", {
          roomCode,
          participantName: savedParticipantName,
          participantId: savedParticipantId,
          token,
        });
      }
    }

    return () => {
      socket.off("quiz:question", handleQuestion);
      socket.off("quiz:leaderboard", handleLeaderboard);
      socket.off("quiz:finished", handleFinished);
    };
  }, [roomCode, isHost]);

  // =========================================================
  // COUNTDOWN TIMER
  // =========================================================

  useEffect(() => {
    if (phase !== "question" || timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, timeLeft]);

  // =========================================================
  // SELECT ANSWER
  // =========================================================

  const selectAnswer = (idx) => {
    if (selected !== null || isHost) return;

    setSelected(idx);

    socket.emit("participant:submitAnswer", {
      roomCode,
      selectedIndex: idx,
    });
  };

  // =========================================================
  // FINAL RESULTS
  // =========================================================

  if (phase === "finished") {
    const sortedLeaderboard = [...finalLeaderboard].sort(
      (a, b) => b.score - a.score
    );

    // Top 3
    const topThree = sortedLeaderboard.slice(0, 3);

    // =======================================================
    // FIND CURRENT PLAYER USING participantId
    // =======================================================

    const myIndex =
      !isHost && participantId
        ? sortedLeaderboard.findIndex(
          (p) => p.participantId === participantId
        )
        : -1;

    const myResult =
      myIndex !== -1
        ? sortedLeaderboard[myIndex]
        : null;

    const myRank =
      myIndex !== -1
        ? myIndex + 1
        : null;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#080014] text-white">

        {/* Background Glow */}
        <div className="fixed top-10 left-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="fixed bottom-10 right-10 w-72 h-72 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Main Card */}
        <div className="relative w-full max-w-xl p-8 rounded-3xl border border-violet-500/30 bg-white/5 backdrop-blur-xl shadow-2xl">

          {/* Header */}
          <div className="text-center mb-8">

            <div className="text-5xl mb-4">
              🏆
            </div>

            <h2 className="text-3xl font-extrabold">
              Final Leaderboard
            </h2>

            <p className="text-gray-400 text-sm mt-2">
              Quiz completed successfully!
            </p>

          </div>

          {/* =================================================
              COMPLETE RANKINGS
          ================================================= */}

          <AnimatedLeaderboard
            players={sortedLeaderboard}
            previousRanks={{}}
            participantId={participantId}
            finalView
          />

          {/* =================================================
              BACK HOME
          ================================================= */}

          <button
            onClick={() => navigate("/")}
            className="w-full mt-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-bold text-lg transition hover:scale-[1.02]"
          >
            Back to Home →
          </button>

        </div>
      </div>
    );
  }

  // =========================================================
  // QUESTION-BY-QUESTION LEADERBOARD
  // =========================================================

  if (phase === "leaderboard") {
    return (
      <div className="min-h-screen px-4 py-8 bg-[#080014] text-white">
        <div className="mx-auto w-full max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-white/5 p-5 md:p-8 backdrop-blur-xl shadow-2xl">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />

            <div className="relative mb-6 text-center">
              <div className="text-4xl mb-2">📊</div>
              <h2 className="text-2xl md:text-3xl font-extrabold">Live Leaderboard</h2>
              <p className="mt-2 text-sm text-gray-400">
                Question {leaderboard.length ? "results" : "results"} · rankings update after every question
              </p>
            </div>

            <AnimatedLeaderboard
              players={leaderboard}
              previousRanks={previousRanks}
              participantId={participantId}
              displayDurationMs={leaderboardDurationMs}
            />

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
              Next question will start automatically...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // LOADING QUESTION
  // =========================================================

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080014] text-white">

        <div className="text-center">

          <div className="text-5xl mb-4 animate-bounce">
            🧠
          </div>

          <h2 className="text-2xl font-bold">
            Loading Question...
          </h2>

          <p className="text-gray-400 mt-2">
            Please wait
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // LIVE QUESTION SCREEN
  // =========================================================

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#080014] text-white">

      {/* Background Glow */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-[120px]" />

      <div className="absolute bottom-10 right-10 w-72 h-72 bg-violet-600/20 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-xl p-8 rounded-3xl border border-violet-500/30 bg-white/5 backdrop-blur-xl shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">

          <div>

            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Live Quiz
            </p>

            <p className="text-sm text-gray-300 mt-1">
              Question {question.questionNumber} of{" "}
              {question.totalQuestions}
            </p>

          </div>

          <div
            className={`px-4 py-2 rounded-xl border font-bold ${timeLeft <= 5
                ? "text-red-400 border-red-500/40 bg-red-500/10 animate-pulse"
                : "text-indigo-400 border-indigo-500/30 bg-indigo-500/10"
              }`}
          >
            ⏱ {timeLeft}s
          </div>

        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-white/10 mb-8 overflow-hidden">

          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-1000"
            style={{
              width: `${Math.max(
                0,
                Math.min(
                  100,
                  (timeLeft / (question.timeLimit || 1)) * 100
                )
              )}%`,
            }}
          />

        </div>

        {/* Question */}
        <div className="p-5 rounded-2xl bg-black/20 border border-white/10 mb-6">

          <h2 className="text-xl md:text-2xl font-bold leading-relaxed">
            {question.questionText}
          </h2>

          {question.imageUrl && (
            <img src={question.imageUrl} alt="Question visual" className="mt-5 max-h-80 w-full rounded-2xl border border-white/10 object-contain bg-black/20" />
          )}

        </div>

        {/* Host View */}
        {isHost ? (
          <div className="p-6 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-center">

            <div className="text-4xl mb-3">
              🎯
            </div>

            <p className="text-gray-300">
              Players are answering on their own screens...
            </p>

            <p className="text-sm text-gray-500 mt-2">
              Watch the leaderboard after the question ends.
            </p>

          </div>
        ) : (
          <div className="space-y-3">

            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => selectAnswer(idx)}
                disabled={selected !== null}
                className={`w-full flex items-center gap-3 text-left px-4 py-4 rounded-xl border transition duration-200 ${selected === idx
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 border-indigo-400 text-white"
                    : "bg-white/5 border-white/10 text-gray-200 hover:bg-violet-500/20 hover:border-violet-400"
                  } disabled:cursor-not-allowed`}
              >

                <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/20 font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>

                <span className="font-medium">
                  {opt}
                </span>

              </button>
            ))}

            {selected !== null && (
              <div className="mt-5 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">

                <p className="text-sm text-green-300">
                  ✅ Answer submitted!
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Waiting for other players or timer...
                </p>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}