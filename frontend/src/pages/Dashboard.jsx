import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Welcome Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900 text-4xl mb-5">
          🧠
        </div>

        <h1 className="text-4xl md:text-5xl font-bold dark:text-white mb-3">
          Welcome back, {user?.name}! 👋
        </h1>

        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Ready to challenge your brain? Choose how you want to play and start
          your quiz adventure.
        </p>
      </div>

      {/* Quiz Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Create Room */}
        <Link
          to="/create-room"
          className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-700"
        >
          <div className="text-6xl mb-5 group-hover:scale-110 transition-transform">
            🎮
          </div>

          <h3 className="font-bold text-xl mb-3 dark:text-white">
            Create Room
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Create your own quiz room and invite friends to compete with you.
          </p>

          <div className="mt-6 text-indigo-600 dark:text-indigo-400 font-semibold">
            Create a quiz →
          </div>
        </Link>


        {/* Join Room */}
        <Link
          to="/join-room"
          className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-700"
        >
          <div className="text-6xl mb-5 group-hover:scale-110 transition-transform">
            🔑
          </div>

          <h3 className="font-bold text-xl mb-3 dark:text-white">
            Join Room
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Enter a room code and join a live quiz hosted by someone else.
          </p>

          <div className="mt-6 text-indigo-600 dark:text-indigo-400 font-semibold">
            Join now →
          </div>
        </Link>


        {/* Practice Solo */}
        <Link
          to="/practice"
          className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-700"
        >
          <div className="text-6xl mb-5 group-hover:scale-110 transition-transform">
            📚
          </div>

          <h3 className="font-bold text-xl mb-3 dark:text-white">
            Practice Solo
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Practice questions at your own pace and improve your knowledge.
          </p>

          <div className="mt-6 text-indigo-600 dark:text-indigo-400 font-semibold">
            Start practicing →
          </div>
        </Link>

      </div>


      {/* Bottom Section */}
      <div className="mt-12 text-center">

        <div className="inline-block bg-indigo-50 dark:bg-gray-800 rounded-xl px-6 py-4 border border-indigo-100 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            💡 <span className="font-semibold">Pro Tip:</span> Challenge your
            friends and see who reaches the top of the leaderboard!
          </p>
        </div>

      </div>

    </div>
  );
}