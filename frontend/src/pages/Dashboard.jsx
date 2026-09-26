import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

const actions = [
  { icon: "⚡", title: "Create Room", description: "Build a custom quiz and challenge your friends.", route: "/create-room", label: "Create Quiz", accent: "from-pink-500 to-purple-500" },
  { icon: "🔑", title: "Join Room", description: "Enter a room code and join a live quiz battle.", route: "/join-room", label: "Join Battle", accent: "from-purple-500 to-indigo-500" },
  { icon: "🎯", title: "Practice Solo", description: "Improve your knowledge with individual practice.", route: "/practice", label: "Start Practice", accent: "from-indigo-500 to-blue-500" },
  { icon: "🛠️", title: "Create Quiz", description: "Build and save your own reusable quiz.", route: "/create-quiz", label: "Create Quiz", accent: "from-pink-500 to-rose-500" },
  { icon: "📚", title: "My Quizzes", description: "Edit, duplicate, delete, or host saved quizzes.", route: "/my-quizzes", label: "Open Library", accent: "from-violet-500 to-purple-600" },
];

function StatCard({ icon, label, value, detail }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#191b24] p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs uppercase tracking-wider text-gray-500">Stats</span>
      </div>
      <p className="mt-4 text-3xl font-extrabold text-white">{value}</p>
      <p className="mt-1 text-sm font-semibold text-pink-200">{label}</p>
      <p className="mt-1 text-xs text-gray-400">{detail}</p>
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

    async function loadResults() {
      try {
        setLoading(true);
        const response = await api.get("/rooms/my-results");
        if (active) setResults(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Unable to load quiz history.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadResults();
    return () => { active = false; };
  }, []);

 const stats = useMemo(() => {
  const attempted = results.length;

  const totalQuestions = results.reduce(
    (sum, item) => sum + (item.totalQuestions || 0),
    0
  );

  // Live multiplayer uses correctAnswers.
  // Solo practice uses score.
  const totalCorrect = results.reduce(
    (sum, item) =>
      sum +
      (item.correctAnswers !== undefined
        ? item.correctAnswers
        : item.score || 0),
    0
  );

  const accuracy = totalQuestions
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0;

  const best = results.reduce((bestScore, item) => {
    const correct =
      item.correctAnswers !== undefined
        ? item.correctAnswers
        : item.score || 0;

    const percentage = item.totalQuestions
      ? (correct / item.totalQuestions) * 100
      : 0;

    return Math.max(bestScore, percentage);
  }, 0);

  return {
    attempted,
    accuracy,
    best: Math.round(best),
    totalScore: totalCorrect,
  };
}, [results]);

  return (
    <main className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[#11131c] px-4 py-8 text-[#e1e1ef] sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-pink-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[30rem] w-[30rem] animate-pulse rounded-full bg-purple-700/20 blur-[130px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-pink-300">⚡ QuizNeon Arena</p>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Welcome back, <span className="bg-gradient-to-r from-pink-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">{user?.name || "Player"}</span>!
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#debec8] sm:text-base">Track your progress, practice your skills, and climb the leaderboard.</p>
          </div>
          <Link to="/leaderboard" className="w-fit rounded-full border border-pink-400/30 bg-pink-500/10 px-5 py-3 text-sm font-semibold text-pink-200 transition hover:bg-pink-500/20">🏆 Leaderboard →</Link>
        </header>

        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon="📝" label="Quizzes Attempted" value={loading ? "—" : stats.attempted} detail="Completed quizzes" />
          <StatCard icon="🎯" label="Overall Accuracy" value={loading ? "—" : `${stats.accuracy}%`} detail="Correct answers" />
          <StatCard icon="🏆" label="Best Performance" value={loading ? "—" : `${stats.best}%`} detail="Highest quiz percentage" />
          <StatCard icon="✅" label="Correct Answers" value={loading ? "—" : stats.totalScore} detail="Across your attempts" />
        </section>

        {error && <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        <section className="mb-10 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#282333] via-[#1d1f2b] to-[#151724] p-6 shadow-2xl sm:p-10">
          <span className="inline-flex rounded-full bg-purple-500/20 px-3 py-1.5 text-xs font-semibold text-purple-200">YOUR QUIZ HUB</span>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">Test your knowledge.<br /><span className="bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">Beat the clock.</span></h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-gray-400">Challenge your friends in real-time quizzes or practice at your own pace.</p>
        </section>

        <section className="mb-10">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold sm:text-2xl">Choose your battle</h2><span className="text-xs uppercase tracking-wider text-gray-500">5 ACTIONS</span></div>
          <div className="grid gap-5 md:grid-cols-3">
            {actions.map((action) => <Link key={action.title} to={action.route} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#191b24] p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-pink-400/40">
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${action.accent} text-3xl shadow-lg transition-transform duration-300 group-hover:scale-110`}>{action.icon}</div>
              <h3 className="text-xl font-bold">{action.title}</h3><p className="mt-3 min-h-[48px] text-sm leading-6 text-gray-400">{action.description}</p>
              <div className="mt-6 flex items-center justify-between"><span className="text-sm font-semibold text-pink-300">{action.label}</span><span className="text-lg">→</span></div>
            </Link>)}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#191b24] p-6 shadow-lg">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">Recent Quiz History</h2><span className="text-xs text-gray-500">LATEST 5</span></div>
          {loading ? <p className="text-sm text-gray-400">Loading history...</p> : results.length === 0 ? <p className="text-sm text-gray-400">No quiz attempts yet. Start practicing to see your history.</p> : <div className="space-y-3">{results.slice(0, 5).map((item) => <div key={item._id} className="flex flex-col gap-2 rounded-xl bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-pink-100">{item.category || "General"}</p><p className="text-xs text-gray-400">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Date unavailable"}</p></div>
          <div className="text-right">
  <p className="text-sm font-bold text-white">
    {item.correctAnswers !== undefined
      ? `${item.correctAnswers}/${item.totalQuestions} correct`
      : `${item.score}/${item.totalQuestions} correct`}
  </p>

  {item.score !== undefined && (
    <p className="mt-1 text-xs font-semibold text-pink-300">
      🏆 {item.score} pts
    </p>
  )}

  {item.rank !== undefined && (
    <p className="mt-1 text-xs font-semibold text-purple-300">
      🥇 Rank #{item.rank}
    </p>
  )}
</div>
          </div>)}</div>}
        </section>

        <div className="mt-10 text-center text-xs text-gray-500">💡 Challenge your friends and climb the leaderboard.</div>
      </div>
    </main>
  );
}
