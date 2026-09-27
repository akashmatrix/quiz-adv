import React, { useState } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import Login from "./pages/Login.jsx";
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

const Icon = ({ name, size = 19 }) => {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></>,
    create: <><path d="M12 5v14"/><path d="M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="5"/></>,
    library: <><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    analytics: <><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3-4 3 2 5-6"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></>,
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"/>,
    logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
    x: <><path d="M6 6l12 12M18 6 6 18"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    panelLeft: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M14 9l-2 3 2 3"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

function ProtectedRoute({ children }) { const { user } = useAuth(); return user ? children : <Navigate to="/login" replace />; }

const navItems = [
  { to: "/", label: "Dashboard", icon: "home", exact: true },
  { to: "/create-quiz", label: "Create Quiz", icon: "create" },
  { to: "/my-quizzes", label: "My Quizzes", icon: "library" },
  { to: "/analytics", label: "Analytics", icon: "analytics" },
];

function ProfilePanel({ user, logout, onClose }) {
  return <div className="profile-popover">
    <div className="profile-popover-head">
      <div className="avatar avatar-lg">{(user?.name || "P").charAt(0).toUpperCase()}</div>
      <div className="min-w-0"><p className="truncate font-bold text-white">{user?.name || "Player"}</p><p className="truncate text-xs text-slate-400">{user?.email || "Quiz account"}</p></div>
      <button onClick={onClose} className="icon-button" aria-label="Close profile"><Icon name="x" size={17}/></button>
    </div>
    <div className="profile-details">
      <div><span>Profile</span><strong>{user?.name || "Not available"}</strong></div>
      <div><span>Email</span><strong>{user?.email || "Not available"}</strong></div>
      {user?._id && <div><span>Account ID</span><strong className="truncate">{user._id}</strong></div>}
    </div>
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
          <div className="avatar">{(user?.name || "P").charAt(0).toUpperCase()}</div><div className="profile-trigger-text"><strong>{user?.name || "Player"}</strong><span>{user?.email || "View profile"}</span></div><span className="profile-chevron"><Icon name="chevron" size={16}/></span>
        </button>
      </div>
    </div>
  </aside>;
}

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return <div className={`app-frame ${sidebarCollapsed ? "sidebar-is-collapsed" : "sidebar-is-expanded"}`}>
    <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)}/>
    <main className="app-content"><Routes>
    <Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/>
    <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
    <Route path="/practice" element={<Navigate to="/create-quiz" replace/>}/>
    <Route path="/result" element={<ProtectedRoute><Result/></ProtectedRoute>}/>
    <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard/></ProtectedRoute>}/>
    <Route path="/analytics" element={<ProtectedRoute><Analytics/></ProtectedRoute>}/>
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
