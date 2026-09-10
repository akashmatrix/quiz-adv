import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto mt-12">
      <h1 className="text-3xl font-bold text-center mb-2 dark:text-white">
        Welcome, {user?.name} 👋
      </h1>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-10">
        What would you like to do today?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link
          to="/create-room"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition"
        >
          <div className="text-4xl mb-3">🎮</div>
          <h3 className="font-semibold text-lg mb-1 dark:text-white">Create Room</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Build your own quiz and invite up to 50 people, or just play it solo
          </p>
        </Link>

        <Link
          to="/join-room"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition"
        >
          <div className="text-4xl mb-3">🔑</div>
          <h3 className="font-semibold text-lg mb-1 dark:text-white">Join Room</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter a room code shared by a host to join a live quiz
          </p>
        </Link>

        <Link
          to="/practice"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition"
        >
          <div className="text-4xl mb-3">📚</div>
          <h3 className="font-semibold text-lg mb-1 dark:text-white">Practice Solo</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Practice at your own pace using the built-in question bank
          </p>
        </Link>
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
        Tip: don't share your room code if you want to keep a room just for yourself.
      </p>
    </div>
  );
}
