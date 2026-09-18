import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);

      login(res.data.user, res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#11131c] text-white flex items-center justify-center px-4 py-8 relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-3xl border border-white/10 bg-[#191b26]/90 shadow-2xl backdrop-blur-xl">

        {/* LEFT PANEL */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#242331] to-[#171923]">

          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-2xl shadow-lg shadow-pink-500/30">
                ⚡
              </div>

              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  QuizNeon
                </h2>

                <p className="text-xs text-pink-300 uppercase tracking-widest">
                  Quiz Arena
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-5">
              <span className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold">
                ✦ LEVEL UP YOUR KNOWLEDGE
              </span>

              <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight">
                Test Your Knowledge.
                <br />

                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                  Beat the Clock.
                </span>
              </h1>

              <p className="text-gray-400 leading-relaxed max-w-md">
                Challenge your friends, compete in live quizzes and climb
                the leaderboard with QuizNeon.
              </p>
            </div>
          </div>

          {/* Quiz Preview */}
          <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
              <span className="text-pink-300 text-sm font-semibold">
                🔥 Speed Round
              </span>

              <span className="text-xs bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full">
                12s LEFT
              </span>
            </div>

            <h3 className="font-semibold text-lg mb-4">
              Which planet has the largest volcano?
            </h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-white/5 p-3 text-gray-300">
                A. Venus
              </div>

              <div className="rounded-lg bg-pink-500 p-3 font-semibold">
                ✓ B. Mars
              </div>

              <div className="rounded-lg bg-white/5 p-3 text-gray-300">
                C. Earth
              </div>

              <div className="rounded-lg bg-white/5 p-3 text-gray-300">
                D. Jupiter
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="text-center">
              <p className="text-xl">👥</p>
              <p className="text-xs text-gray-400 mt-1">Live Battles</p>
            </div>

            <div className="text-center">
              <p className="text-xl">🏆</p>
              <p className="text-xs text-gray-400 mt-1">Leaderboard</p>
            </div>

            <div className="text-center">
              <p className="text-xl">⚡</p>
              <p className="text-xs text-gray-400 mt-1">Fast Quizzes</p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-7 sm:p-10 lg:p-12 flex items-center bg-[#0c0e17]/80">

          <div className="w-full max-w-md mx-auto">

            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-500 items-center justify-center text-2xl mb-3">
                ⚡
              </div>

              <h2 className="text-3xl font-extrabold">QuizNeon</h2>

              <p className="text-sm text-gray-400 mt-1">
                Welcome back, player!
              </p>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold mb-2">
                Welcome Back 👋
              </h2>

              <p className="text-gray-400 text-sm">
                Login to continue your quiz journey.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-200 mb-2"
                >
                  Email Address
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    @
                  </span>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 text-white placeholder-gray-500 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-200"
                  >
                    Password
                  </label>

                  <span className="text-xs text-gray-500">
                    Secure Login
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    🔒
                  </span>

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-12 text-white placeholder-gray-500 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  className="accent-pink-500"
                />

                <span>Remember me</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 py-4 font-bold tracking-wide shadow-lg shadow-pink-500/20 transition hover:scale-[1.02] hover:shadow-pink-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Start Playing ⚡"}
              </button>
            </form>

            {/* Register */}
            <p className="mt-7 text-center text-sm text-gray-400">
              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-semibold text-pink-400 hover:text-pink-300 hover:underline"
              >
                Create Account
              </Link>
            </p>

            {/* Footer */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
              <span>🔐</span>
              <span>Your account is protected</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}