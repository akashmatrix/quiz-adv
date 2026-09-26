import React, { useState } from "react";
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
import CreateQuiz from "./pages/CreateQuiz.jsx";
import CreateQuizHome from "./pages/CreateQuizHome.jsx";
import CustomQuiz from "./pages/CustomQuiz.jsx";
import DocumentQuiz from "./pages/DocumentQuiz.jsx";
import MyQuizzes from "./pages/MyQuizzes.jsx";
import AIQuiz from "./pages/AIQuiz.jsx";

// ================= PROTECTED ROUTE =================

function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ================= NAVBAR =================

function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#080014]/90 backdrop-blur-xl text-white shadow-lg shadow-purple-950/20">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">

        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30 group-hover:scale-105 transition">
              <span className="text-xl">🧠</span>
            </div>

            <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Quiz
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                Neon
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle theme"
              className="px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 hover:border-pink-500/50 transition text-sm"
            >
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>

            {user ? (
              <>
                <Link
                  to="/"
                  className="px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-pink-300 hover:bg-white/[0.06] transition"
                >
                  Home
                </Link>

                <Link
                  to="/leaderboard"
                  className="px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-pink-300 hover:bg-white/[0.06] transition"
                >
                  🏆 Leaderboard
                </Link>

                <span className="px-3 py-2 text-sm text-gray-300">
                  Hi,{" "}
                  <span className="font-semibold text-pink-300">
                    {user.name}
                  </span>
                </span>

                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-md shadow-pink-500/20 transition hover:scale-105"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 border border-white/10 hover:border-pink-500/50 hover:text-pink-300 transition"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-md shadow-pink-500/20 transition hover:scale-105"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 text-xl hover:border-pink-500/50 transition"
          >
            {menuOpen ? "✕" : "☰"}
          </button>

        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-white/10 space-y-3">

            {/* Theme Button */}
            <button
              onClick={toggleTheme}
              className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-sm"
            >
              {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>

            {user ? (
              <>
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-gray-300 hover:bg-white/[0.06] hover:text-pink-300 transition"
                >
                  🏠 Home
                </Link>

                <Link
                  to="/leaderboard"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-gray-300 hover:bg-white/[0.06] hover:text-pink-300 transition"
                >
                  🏆 Leaderboard
                </Link>

                <div className="px-4 py-2 text-sm text-gray-400">
                  Hi,{" "}
                  <span className="text-pink-300 font-semibold">
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-semibold"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-gray-300 hover:bg-white/[0.06] hover:text-pink-300 transition"
                >
                  🔐 Login
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-semibold"
                >
                  ✨ Register
                </Link>
              </>
            )}

          </div>
        )}

      </div>
    </nav>
  );
}

// ================= MAIN APP =================

export default function App() {
  return (
    <div className="min-h-screen bg-[#080014] text-white transition-colors">

      <Navbar />

      <main className="min-h-[calc(100vh-80px)]">

        <Routes>

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Solo Practice */}
          <Route
            path="/practice"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />

          {/* Quiz Result */}
          <Route
            path="/result"
            element={
              <ProtectedRoute>
                <Result />
              </ProtectedRoute>
            }
          />

          {/* Leaderboard */}
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />

          {/* Quiz Management */}
          <Route
            path="/create-quiz"
            element={
              <ProtectedRoute>
                <CreateQuizHome />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-quiz/manual"
            element={
              <ProtectedRoute>
                <CreateQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-quiz/ai"
            element={
              <ProtectedRoute>
                <AIQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-quiz/document"
            element={
              <ProtectedRoute>
                <DocumentQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz-custom"
            element={
              <ProtectedRoute>
                <CustomQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-quiz"
            element={
              <ProtectedRoute>
                <AIQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-quizzes"
            element={
              <ProtectedRoute>
                <MyQuizzes />
              </ProtectedRoute>
            }
          />

          {/* Create Room */}
          <Route
            path="/create-room"
            element={
              <ProtectedRoute>
                <CreateRoom />
              </ProtectedRoute>
            }
          />

          {/* Join Room */}
          <Route
            path="/join-room"
            element={<JoinRoom />}
          />

          {/* Room Lobby */}
          <Route
            path="/room/:roomCode"
            element={<RoomLobby />}
          />

          {/* Live Multiplayer Quiz */}
          <Route
            path="/room/:roomCode/play"
            element={<LiveQuiz />}
          />

          {/* Unknown Route */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>

      </main>

    </div>
  );
}