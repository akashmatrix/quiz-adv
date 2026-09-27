import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { const res = await api.post("/auth/register", form); login(res.data.user, res.data.token); navigate("/"); }
    catch (err) { setError(err.response?.data?.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07080f] px-4 py-8 text-white">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0e1018] p-7 shadow-2xl sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-violet-600/15 blur-[80px]" />
        <div className="relative">
          <div className="mb-8 flex items-center justify-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-black shadow-lg shadow-indigo-500/20">Q</div><div><p className="text-xl font-black">Quiz<span className="text-indigo-400">Neon</span></p><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">Quiz workspace</p></div></div>
          <div className="text-center"><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Get started</span><h1 className="mt-2 text-3xl font-black">Create your account</h1><p className="mt-2 text-sm text-slate-500">Your quizzes and progress in one place.</p></div>
          {error && <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">{error}</div>}
          <form onSubmit={submit} className="mt-7 space-y-5">
            <div><label className="mb-2 block text-xs font-bold text-slate-300">Full name</label><input className="input-modern" type="text" name="name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Your name" required /></div>
            <div><label className="mb-2 block text-xs font-bold text-slate-300">Email address</label><input className="input-modern" type="email" name="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="you@example.com" required /></div>
            <div><label className="mb-2 block text-xs font-bold text-slate-300">Password</label><div className="relative"><input className="input-modern pr-16" type={showPassword ? "text" : "password"} name="password" minLength={6} value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} placeholder="Minimum 6 characters" required /><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-300">{showPassword ? "Hide" : "Show"}</button></div></div>
            <button disabled={loading} className="btn-primary w-full py-3.5">{loading ? "Creating account..." : "Create account →"}</button>
          </form>
          <p className="mt-7 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-bold text-indigo-300 hover:text-indigo-200">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
