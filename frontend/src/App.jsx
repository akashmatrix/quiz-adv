import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Profile from "./pages/Profile.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Quiz from "./pages/Quiz.jsx";
import Result from "./pages/Result.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Analytics from "./pages/Analytics.jsx";
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
import History from "./pages/History.jsx";
import HostHistory from "./pages/HostHistory.jsx";

const Icon = ({ name, size = 19 }) => {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></>,
    create: <><path d="M12 5v14"/><path d="M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="5"/></>,
    library: <><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    analytics: <><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3-4 3 2 5-6"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></>,
    host: <><path d="M4 21V5"/><path d="M4 5h11l-2 4 2 4H4"/><path d="M18 14v7"/><path d="M15 21h6"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></>,
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"/>,
    logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
    x: <><path d="M6 6l12 12M18 6 6 18"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    panelLeft: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M14 9l-2 3 2 3"/></>,
    join: <><path d="M8 12h13"/><path d="m16 7 5 5-5 5"/><path d="M3 5v14"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

function ProtectedRoute({ children }) { const { user } = useAuth(); return user ? children : <Navigate to="/login" replace />; }

const navItems = [
  { to: "/", label: "Dashboard", icon: "home", exact: true },
  { to: "/create-quiz", label: "Create Quiz", icon: "create" },
  { to: "/join-room", label: "Join Room", icon: "join" },
  { to: "/my-quizzes", label: "My Quizzes", icon: "library" },
  { to: "/analytics", label: "Analytics", icon: "analytics" },
  { to: "/history", label: "Quiz History", icon: "history" },
  { to: "/host-history", label: "Host History", icon: "host" },
];

function getUserAvatarUrl(user) {
  if (!user?.avatar) return "";
  const number = Number(String(user.avatar).replace("avatar-", ""));
  const style = number >= 11 ? "lorelei" : "adventurer";
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(user.avatar)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

function ProfilePanel({ user, logout, onClose }) {
  return <div className="profile-popover">
    <div className="profile-popover-head">
      <div className="avatar avatar-lg overflow-hidden">
        {user?.profileImage ? <img src={user.profileImage} alt="" className="h-full w-full object-cover" /> : user?.avatar ? <img src={getUserAvatarUrl(user)} alt="" className="h-full w-full object-cover" /> : (user?.name || "P").charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0"><p className="truncate font-bold text-white">{user?.name || "Player"}</p><p className="truncate text-xs text-slate-400">{user?.email || "Quiz account"}</p></div>
      <button onClick={onClose} className="icon-button" aria-label="Close profile"><Icon name="x" size={17}/></button>
    </div>
    <div className="profile-details">
      <div><span>Name</span><strong>{user?.name || "Not available"}</strong></div>
      <div><span>Email</span><strong>{user?.email || "Not available"}</strong></div>
      {user?._id && <div><span>Account ID</span><strong className="truncate">{user._id}</strong></div>}
    </div>
    <Link to="/profile" onClick={onClose} className="profile-edit-link">
      <span className="profile-edit-icon"><Icon name="user" size={16}/></span>
      <span><strong>Edit Profile</strong><small>Photo, avatar & personal details</small></span>
      <Icon name="chevron" size={15}/>
    </Link>
    <button onClick={logout} className="profile-logout"><Icon name="logout" size={17}/> Log out</button>
  </div>;
}

function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  if (location.pathname === "/login" || location.pathname === "/register") return null;
  const active = (item) => item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

  return <aside className={`app-sidebar ${collapsed ? "sidebar-collapsed" : "sidebar-expanded"}`}>
    <button className="sidebar-toggle" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
      <Icon name="menu" size={18}/>
    </button>
    <div className="sidebar-brand"><Link to="/" className="brand-mark">Q</Link><div><div className="brand-name">Quiz<span>Neon</span></div><div className="brand-caption">Quiz workspace</div></div></div>
    <div className="sidebar-create"><Link to="/create-quiz"><Icon name="create" size={18}/> <span>Create Quiz</span><span className="sidebar-plus">+</span></Link></div>
    <nav className="sidebar-nav">
      <p className="sidebar-label">Workspace</p>
      {navItems.map(item => <Link key={item.to} to={item.to} className={`sidebar-link ${active(item) ? "active" : ""}`}><span className="sidebar-icon"><Icon name={item.icon}/></span><span>{item.label}</span>{active(item) && <span className="active-dot"/>}</Link>)}
    </nav>
    <div className="sidebar-spacer"/>
    <div className="sidebar-bottom">
      <button onClick={toggleTheme} className="sidebar-link sidebar-theme"><span className="sidebar-icon"><Icon name={dark ? "sun" : "moon"}/></span><span>{dark ? "Light mode" : "Dark mode"}</span></button>
      <div className="profile-wrap">
        {profileOpen && <ProfilePanel user={user} logout={logout} onClose={() => setProfileOpen(false)}/>} 
        <button className={`profile-trigger ${profileOpen ? "open" : ""}`} onClick={() => setProfileOpen(v => !v)}>
          <div className="avatar overflow-hidden">
            {user?.profileImage ? <img src={user.profileImage} alt="" className="h-full w-full object-cover" /> : user?.avatar ? <img src={getUserAvatarUrl(user)} alt="" className="h-full w-full object-cover" /> : (user?.name || "P").charAt(0).toUpperCase()}
          </div>
          <div className="profile-trigger-text"><strong>{user?.name || "Player"}</strong><span>{user?.email || "View profile"}</span></div><span className="profile-chevron"><Icon name="chevron" size={16}/></span>
        </button>
      </div>
    </div>
  </aside>;
}

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== "undefined" && window.innerWidth <= 768);
  const touchStartRef = useRef(null);

  useEffect(() => {
    const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

    const handleTouchStart = (event) => {
      if (!isMobile()) return;
      const touch = event.touches[0];
      if (!touch) return;

      // When the sidebar is closed, only a swipe starting very close to the
      // left screen edge can open it. This avoids hijacking normal page swipes.
      if (sidebarCollapsed) {
        if (touch.clientX <= 24) touchStartRef.current = { x: touch.clientX, y: touch.clientY, edgeOpen: true };
        return;
      }

      // When open, horizontal swipes beginning inside the sidebar can close it.
      if (touch.clientX <= Math.min(300, window.innerWidth * 0.78)) {
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, edgeOpen: false };
      }
    };

    const handleTouchEnd = (event) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || !isMobile()) return;

      const touch = event.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;

      // Ignore mostly vertical scrolling.
      if (Math.abs(dx) < 55 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;

      if (sidebarCollapsed && start.edgeOpen && dx > 55) {
        setSidebarCollapsed(false);
      } else if (!sidebarCollapsed && !start.edgeOpen && dx < -55) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [sidebarCollapsed]);

  return <div className={`app-frame ${sidebarCollapsed ? "sidebar-is-collapsed" : "sidebar-is-expanded"}`}>
    <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)}/>
    {!sidebarCollapsed && <button className="mobile-sidebar-backdrop" onClick={() => setSidebarCollapsed(true)} aria-label="Close sidebar" />}
    <main className="app-content"><Routes>
    <Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route path="/forgot-password" element={<ForgotPassword/>}/><Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>}/>
    <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
    <Route path="/practice" element={<Navigate to="/create-quiz" replace/>}/>
    <Route path="/result" element={<ProtectedRoute><Result/></ProtectedRoute>}/>
    <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard/></ProtectedRoute>}/>
    <Route path="/analytics" element={<ProtectedRoute><Analytics/></ProtectedRoute>}/><Route path="/host-history" element={<ProtectedRoute><HostHistory/></ProtectedRoute>}/>
    <Route path="/history" element={<ProtectedRoute><History/></ProtectedRoute>}/>
    <Route path="/history/:kind/:id" element={<ProtectedRoute><History/></ProtectedRoute>}/><Route path="/history/:id" element={<ProtectedRoute><History/></ProtectedRoute>}/>
    <Route path="/create-quiz" element={<ProtectedRoute><CreateQuizHome/></ProtectedRoute>}/>
    <Route path="/create-quiz/manual" element={<ProtectedRoute><CreateQuiz/></ProtectedRoute>}/>
    <Route path="/create-quiz/ai" element={<ProtectedRoute><AIQuiz/></ProtectedRoute>}/>
    <Route path="/create-quiz/document" element={<ProtectedRoute><DocumentQuiz/></ProtectedRoute>}/>
    <Route path="/quiz-custom" element={<ProtectedRoute><CustomQuiz/></ProtectedRoute>}/><Route path="/ai-quiz" element={<ProtectedRoute><AIQuiz/></ProtectedRoute>}/>
    <Route path="/my-quizzes" element={<ProtectedRoute><MyQuizzes/></ProtectedRoute>}/><Route path="/create-room" element={<ProtectedRoute><CreateRoom/></ProtectedRoute>}/>
    <Route path="/join-room" element={<JoinRoom/>}/><Route path="/room/:roomCode" element={<RoomLobby/>}/><Route path="/room/:roomCode/play" element={<LiveQuiz/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></main></div>;
}
