import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

function BrandPanel() {
  return (
    <div className="hidden min-h-[650px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#181522] via-[#11121d] to-[#0a0b12] p-10 lg:flex">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-black shadow-lg shadow-indigo-500/20">Q</div>
          <div><p className="text-lg font-black">Quiz<span className="text-indigo-400">Neon</span></p><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">Quiz workspace</p></div>
        </div>
        <div className="mt-20">
          <span className="rounded-full border border-indigo-400/15 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-indigo-300">YOUR KNOWLEDGE ARENA</span>
          <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight">Create.<br /><span className="bg-gradient-to-r from-indigo-300 to-violet-400 bg-clip-text text-transparent">Challenge.</span><br />Improve.</h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-500">Build quizzes with AI or manually, practice at your pace, and compete in live rooms.</p>
        </div>
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
        <div className="flex items-center justify-between text-xs"><span className="font-bold text-indigo-300">LIVE QUIZ</span><span className="text-slate-600">12 sec</span></div>
        <p className="mt-4 text-sm font-semibold">Which planet has the largest volcano?</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-white/[0.04] p-3 text-slate-500">A. Venus</div><div className="rounded-lg bg-indigo-500/15 p-3 font-bold text-indigo-200">✓ B. Mars</div><div className="rounded-lg bg-white/[0.04] p-3 text-slate-500">C. Earth</div><div className="rounded-lg bg-white/[0.04] p-3 text-slate-500">D. Jupiter</div></div>
      </div>
    </div>
  );
}

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { const res = await api.post("/auth/login", form); login(res.data.user, res.data.token); navigate("/"); }
    catch (err) { setError(err.response?.data?.message || "Login failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07080f] px-4 py-8 text-white">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0e1018] shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
        <BrandPanel />
        <div className="flex items-center p-7 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 lg:hidden"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-black">Q</div><span className="font-black">Quiz<span className="text-indigo-400">Neon</span></span></div></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Welcome back</span>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Sign in to your workspace</h2>
            <p className="mt-2 text-sm text-slate-500">Continue creating and playing quizzes.</p>
            {error && <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
            <form onSubmit={submit} className="mt-7 space-y-5">
              <div><label className="mb-2 block text-xs font-bold text-slate-300">Email address</label><input className="input-modern" type="email" name="email" value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} placeholder="you@example.com" required /></div>
              <div><div className="mb-2 flex justify-between"><label className="text-xs font-bold text-slate-300">Password</label><span className="text-[10px] text-slate-600">Secure login</span></div><div className="relative"><input className="input-modern pr-16" type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={(e) => setForm({...form,password:e.target.value})} placeholder="Enter your password" required /><button type="button" onClick={() => setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-300">{showPassword ? "Hide" : "Show"}</button></div></div>
              <button disabled={loading} className="btn-primary w-full py-3.5">{loading ? "Signing in..." : "Sign in →"}</button>
            </form>
            <p className="mt-7 text-center text-sm text-slate-500">Don't have an account? <Link to="/register" className="font-bold text-indigo-300 hover:text-indigo-200">Create one</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
