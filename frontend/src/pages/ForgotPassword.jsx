import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(() => setCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const clearAlerts = () => {
    setError("");
    setMessage("");
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    clearAlerts();
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
      setStep(2);
      setCooldown(30);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send verification code");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    clearAlerts();
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      setMessage(res.data.message);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    clearAlerts();

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword: password,
      });
      setMessage("Password changed successfully. You can now sign in.");
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || "Could not change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07080f] px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-[28px] border border-white/[0.08] bg-[#0e1018] p-7 shadow-2xl sm:p-10">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-black">Q</div>
          <p className="text-xl font-black">Quiz<span className="text-indigo-400">Neon</span></p>
        </div>

        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Account recovery</span>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            {step === 1 && "Forgot password?"}
            {step === 2 && "Verify your email"}
            {step === 3 && "Create a new password"}
            {step === 4 && "Password updated"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {step === 1 && "We'll send a 6-digit verification code to your email."}
            {step === 2 && `Enter the code sent to ${email}.`}
            {step === 3 && "Choose a new password for your QuizNeon account."}
            {step === 4 && "Your account is ready. Sign in with your new password."}
          </p>
        </div>

        <div className="mt-7 flex items-center justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`h-1.5 w-14 rounded-full ${step >= n ? "bg-indigo-500" : "bg-white/[0.08]"}`} />
          ))}
        </div>

        {error && <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
        {message && <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}

        {step === 1 && (
          <form onSubmit={sendOtp} className="mt-7 space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-300">Email address</label>
              <input className="input-modern" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <button disabled={loading} className="btn-primary w-full py-3.5">{loading ? "Sending code..." : "Send verification code →"}</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyOtp} className="mt-7 space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-300">6-digit verification code</label>
              <input className="input-modern text-center text-xl font-black tracking-[0.45em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" required />
            </div>
            <button disabled={loading || otp.length !== 6} className="btn-primary w-full py-3.5">{loading ? "Verifying..." : "Verify code →"}</button>
            <button type="button" disabled={loading || cooldown > 0} onClick={sendOtp} className="w-full text-xs font-bold text-indigo-300 disabled:text-slate-600">
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend verification code"}
            </button>
            <button type="button" onClick={() => { clearAlerts(); setStep(1); }} className="w-full text-xs font-semibold text-slate-500 hover:text-slate-300">Use a different email</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={resetPassword} className="mt-7 space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-300">New password</label>
              <div className="relative">
                <input className="input-modern pr-16" type={showPassword ? "text" : "password"} minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" required />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-300">{showPassword ? "Hide" : "Show"}</button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-300">Confirm new password</label>
              <input className="input-modern" type={showPassword ? "text" : "password"} minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Enter password again" required />
            </div>
            <button disabled={loading} className="btn-primary w-full py-3.5">{loading ? "Updating..." : "Change password →"}</button>
          </form>
        )}

        {step === 4 && (
          <button onClick={() => navigate("/login")} className="btn-primary mt-7 w-full py-3.5">Go to login →</button>
        )}

        {step < 4 && (
          <p className="mt-7 text-center text-sm text-slate-500">
            Remember your password? <Link to="/login" className="font-bold text-indigo-300 hover:text-indigo-200">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
