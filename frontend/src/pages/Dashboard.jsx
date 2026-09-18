import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const actions = [
  {
    icon: "⚡",
    title: "Create Room",
    description: "Build a custom quiz and challenge your friends.",
    route: "/create-room",
    label: "Create Quiz",
    accent: "from-pink-500 to-purple-500",
  },
  {
    icon: "🔑",
    title: "Join Room",
    description: "Enter a room code and join a live quiz battle.",
    route: "/join-room",
    label: "Join Battle",
    accent: "from-purple-500 to-indigo-500",
  },
  {
    icon: "🎯",
    title: "Practice Solo",
    description: "Improve your knowledge with individual practice.",
    route: "/practice",
    label: "Start Practice",
    accent: "from-indigo-500 to-blue-500",
  },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <main className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[#11131c] text-[#e1e1ef] px-4 py-8 sm:px-8 lg:px-12">

      {/* Animated Background */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-pink-600/20 blur-[120px]" />

      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[30rem] w-[30rem] animate-pulse rounded-full bg-purple-700/20 blur-[130px]" />

      {/* Dashboard Content */}
      <div className="relative z-10 mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-pink-300">
              ⚡ QuizNeon Arena
            </p>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-pink-300 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {user?.name || "Player"}
              </span>
              !
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#debec8] sm:text-base">
              Ready for your next challenge? Enter the arena,
              test your skills, and climb the leaderboard.
            </p>
          </div>

          <Link
            to="/leaderboard"
            className="w-fit rounded-full border border-pink-400/30 bg-pink-500/10 px-5 py-3 text-sm font-semibold text-pink-200 transition hover:bg-pink-500/20"
          >
            🏆 Leaderboard →
          </Link>

        </header>

        {/* Hero Preview */}
        <section className="relative mb-10 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#282333] via-[#1d1f2b] to-[#151724] p-6 shadow-2xl sm:p-10">

          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-pink-500/10 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-2 lg:items-center">

            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-3 py-1.5 text-xs font-semibold text-purple-200">
                <span className="h-2 w-2 animate-pulse rounded-full bg-pink-400" />
                YOUR QUIZ HUB
              </span>

              <h2 className="max-w-lg text-3xl font-extrabold leading-tight sm:text-4xl">
                Test your knowledge.
                <br />
                <span className="bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
                  Beat the clock.
                </span>
              </h2>

              <p className="mt-4 max-w-md text-sm leading-6 text-gray-400">
                Challenge your friends in real-time quizzes
                or practice at your own pace.
              </p>
            </div>

            {/* Quiz Preview Card */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 shadow-xl backdrop-blur-xl">

              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm font-semibold">
                  🔥 Speed Round
                </span>

                <span className="rounded-full bg-pink-500/20 px-3 py-1 text-xs font-bold text-pink-300">
                  LIVE MODE
                </span>
              </div>

              <p className="mb-5 text-lg font-semibold leading-relaxed">
                Ready to prove your knowledge?
              </p>

              <div className="space-y-3">
                <div className="rounded-xl bg-white/5 px-4 py-3 text-sm text-gray-300">
                  ⚡ Real-time quiz battles
                </div>

                <div className="rounded-xl bg-pink-500/15 px-4 py-3 text-sm text-pink-200">
                  🏆 Compete on the leaderboard
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* Action Cards */}
        <section>

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold sm:text-2xl">
              Choose your battle
            </h2>

            <span className="text-xs uppercase tracking-wider text-gray-500">
              3 MODES
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-3">

            {actions.map((action) => (
              <Link
                key={action.title}
                to={action.route}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#191b24] p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-pink-400/40 hover:shadow-pink-500/10"
              >

                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${action.accent} text-3xl shadow-lg transition-transform duration-300 group-hover:scale-110`}
                >
                  {action.icon}
                </div>

                <h3 className="text-xl font-bold">
                  {action.title}
                </h3>

                <p className="mt-3 min-h-[48px] text-sm leading-6 text-gray-400">
                  {action.description}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-semibold text-pink-300">
                    {action.label}
                  </span>

                  <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </div>

              </Link>
            ))}

          </div>

        </section>

        {/* Footer Tip */}
        <div className="mt-10 text-center text-xs text-gray-500">
          💡 Challenge your friends and climb the leaderboard.
        </div>

      </div>
    </main>
  );
}