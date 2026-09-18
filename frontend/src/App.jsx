import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Quiz from "./pages/Quiz.jsx";
import Result from "./pages/Result.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import CreateRoom from "./pages/CreateRoom.jsx";
import JoinRoom from "./pages/JoinRoom.jsx";
import RoomLobby from "./pages/RoomLobby.jsx";
import LiveQuiz from "./pages/LiveQuiz.jsx";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();

  return (
    <nav className="bg-indigo-600 dark:bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <Link to="/" className="text-xl font-bold">
        🧠 QuizNeon
      </Link>
      <div className="flex gap-4 items-center">
        <button
          onClick={toggleTheme}
          title="Toggle dark mode"
          className="bg-indigo-800 dark:bg-gray-700 px-3 py-1 rounded hover:opacity-80 transition"
        >
          {dark ? "☀️ Light" : "🌙 Dark"}
        </button>
        {user ? (
          <>
            <Link to="/leaderboard" className="hover:underline hidden sm:inline">
              Leaderboard
            </Link>
            <span className="text-sm hidden sm:inline">Hi, {user.name}</span>
            <button
              onClick={logout}
              className="bg-indigo-800 dark:bg-gray-700 px-3 py-1 rounded hover:bg-indigo-900 dark:hover:bg-gray-600 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">
              Login
            </Link>
            <Link to="/register" className="hover:underline">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#11131c] transition-colors">
      <Navbar />
      <div className="p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Home dashboard - create room / join room / practice solo */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Solo practice mode (existing category-based quiz) */}
          <Route
            path="/practice"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/result"
            element={
              <ProtectedRoute>
                <Result />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />

          {/* Multiplayer rooms - host must be logged in to create */}
          <Route
            path="/create-room"
            element={
              <ProtectedRoute>
                <CreateRoom />
              </ProtectedRoute>
            }
          />

          {/* Joining a room needs no login - just a name */}
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/room/:roomCode" element={<RoomLobby />} />
          <Route path="/room/:roomCode/play" element={<LiveQuiz />} />
        </Routes>
      </div>
    </div>
  );
}
