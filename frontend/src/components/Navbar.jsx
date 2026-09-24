import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "AI Quiz", path: "/create-quiz", badge: "AI" },
    { label: "Practice", path: "/practice" },
    { label: "Multiplayer", path: "/create-room" },
    { label: "Leaderboard", path: "/leaderboard" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#080014]/90 dark:bg-[#080014]/90 backdrop-blur-xl text-white transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            onClick={closeMenus}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 shadow-md shadow-purple-500/25 group-hover:scale-105 transition">
              <span className="text-xl">✨</span>
            </div>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Quiz<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                  isActive(item.path)
                    ? "text-white bg-white/10 shadow-sm"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}

            {user && (
              <Link
                to="/dashboard"
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                  isActive("/dashboard")
                    ? "text-white bg-white/10 shadow-sm"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition"
            >
              {dark ? "☀️" : "🌙"}
            </button>

            {user ? (
              /* User Profile Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/40 hover:bg-white/10 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user.name ? user.name[0] : "U"}
                  </div>
                  <span className="text-sm font-semibold text-gray-200 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <span className="text-xs text-gray-400">▾</span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#120d24] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <p className="text-xs font-medium text-gray-400">Signed in as</p>
                      <p className="text-sm font-bold text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={closeMenus}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-200 hover:bg-white/10 hover:text-pink-300 transition"
                    >
                      👤 Profile & Stats
                    </Link>

                    <Link
                      to="/my-quizzes"
                      onClick={closeMenus}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-200 hover:bg-white/10 hover:text-pink-300 transition"
                    >
                      📚 My AI Quizzes
                    </Link>

                    <Link
                      to="/dashboard"
                      onClick={closeMenus}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-200 hover:bg-white/10 hover:text-pink-300 transition"
                    >
                      📊 Results History
                    </Link>

                    <div className="border-t border-white/10 my-1" />

                    <button
                      onClick={() => {
                        closeMenus();
                        logout();
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-300 hover:bg-red-500/10 transition"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Guest Auth Buttons */
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-md shadow-pink-500/25 transition hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-sm"
            >
              {dark ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 space-y-2">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMenus}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={closeMenus}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  📊 Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={closeMenus}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  👤 Profile & Stats
                </Link>
                <Link
                  to="/my-quizzes"
                  onClick={closeMenus}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  📚 My AI Quizzes
                </Link>
                <button
                  onClick={() => {
                    closeMenus();
                    logout();
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10"
                >
                  🚪 Logout ({user.name})
                </button>
              </>
            ) : (
              <div className="pt-2 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={closeMenus}
                  className="text-center py-2.5 rounded-xl border border-white/10 font-semibold text-sm hover:bg-white/5"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenus}
                  className="text-center py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-semibold text-sm shadow-md"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
