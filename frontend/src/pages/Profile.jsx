import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

const maleSeeds = ["Arjun", "Kabir", "Rohan", "Aman", "Dev", "Karan", "Yash", "Raj", "Veer", "Aryan"];
const femaleSeeds = ["Anaya", "Diya", "Meera", "Isha", "Riya", "Sara", "Tara", "Naina", "Kiara", "Myra"];

const avatars = [
  ...maleSeeds.map((seed, i) => ({
    id: `avatar-${String(i + 1).padStart(2, "0")}`,
    label: seed,
    url: `https://api.dicebear.com/9.x/adventurer/svg?seed=avatar-${String(i + 1).padStart(2, "0")}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
  })),
  ...femaleSeeds.map((seed, i) => ({
    id: `avatar-${String(i + 11).padStart(2, "0")}`,
    label: seed,
    url: `https://api.dicebear.com/9.x/lorelei/svg?seed=avatar-${String(i + 11).padStart(2, "0")}&backgroundColor=ffdfbf,f8d2dc,d1d4f9`,
  })),
];

const avatarById = Object.fromEntries(avatars.map((a) => [a.id, a.url]));

function getAvatarUrl(id) {
  return avatarById[id] || avatarById["avatar-01"];
}

export default function Profile() {
  const { user, login } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: user?.name || "",
    dob: user?.dob ? String(user.dob).slice(0, 10) : "",
    profession: user?.profession || "",
    avatar: user?.avatar || "avatar-01",
    profileImage: user?.profileImage || "",
  });
  const [activeSource, setActiveSource] = useState(user?.profileImage ? "photo" : "avatar");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/auth/profile");
        const u = res.data.user;
        setForm({
          name: u.name || "",
          dob: u.dob ? String(u.dob).slice(0, 10) : "",
          profession: u.profession || "",
          avatar: u.avatar || "avatar-01",
          profileImage: u.profileImage || "",
        });
        setActiveSource(u.profileImage ? "photo" : "avatar");
      } catch (err) {
        setError(err.response?.data?.message || "Could not load profile");
      } finally {
        setLoadingProfile(false);
      }
    };
    load();
  }, []);

  const preview = useMemo(() => {
    if (activeSource === "photo" && form.profileImage) return form.profileImage;
    return getAvatarUrl(form.avatar);
  }, [activeSource, form.profileImage, form.avatar]);

  const choosePhoto = () => fileRef.current?.click();

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Please choose a profile photo under 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((p) => ({ ...p, profileImage: reader.result }));
      setActiveSource("photo");
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.put("/auth/profile", {
        name: form.name.trim(),
        dob: form.dob || null,
        profession: form.profession.trim(),
        avatar: form.avatar,
        profileImage: activeSource === "photo" ? form.profileImage : "",
      });

      login(res.data.user, res.data.token);
      setForm((p) => ({ ...p, ...res.data.user, dob: res.data.user.dob ? String(res.data.user.dob).slice(0, 10) : "" }));
      setActiveSource(res.data.user.profileImage ? "photo" : "avatar");
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return <div className="mx-auto max-w-5xl p-6 text-sm text-slate-400">Loading profile...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-4 pb-12 sm:p-6 lg:p-8">
      <div className="mb-8">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Account</span>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Your Profile</h1>
        <p className="mt-2 text-sm text-slate-400">Manage your identity, photo and personal details.</p>
      </div>

      {error && <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      {message && <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
          <div className="flex flex-col items-center">
            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-indigo-400/20 bg-slate-900 shadow-2xl">
              <img src={preview} alt="Profile preview" className="h-full w-full object-cover" />
            </div>

            <h2 className="mt-4 text-lg font-black text-white">{form.name || "Your Name"}</h2>
            <p className="mt-1 text-xs text-slate-500">{user?.email}</p>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <button type="button" onClick={choosePhoto} className="mt-5 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-2.5 text-xs font-bold text-indigo-200 hover:bg-indigo-500/15">
              Upload your photo
            </button>

            <button
              type="button"
              onClick={() => setActiveSource("avatar")}
              className={`mt-2 text-xs font-semibold ${activeSource === "avatar" ? "text-indigo-300" : "text-slate-500 hover:text-slate-300"}`}
            >
              Use an avatar instead
            </button>
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-white">Choose your avatar</h3>
              <span className="text-[10px] font-bold text-slate-600">20 faces</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {avatars.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  title={a.label}
                  onClick={() => {
                    setForm((p) => ({ ...p, avatar: a.id }));
                    setActiveSource("avatar");
                  }}
                  className={`overflow-hidden rounded-xl border p-1 transition ${activeSource === "avatar" && form.avatar === a.id ? "border-indigo-400 bg-indigo-500/15 ring-2 ring-indigo-400/20" : "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.15]"}`}
                >
                  <img src={a.url} alt={`${a.label} avatar`} className="aspect-square w-full rounded-lg" />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-7">
          <h2 className="text-lg font-black text-white">Personal details</h2>
          <p className="mt-1 text-xs text-slate-500">Keep your profile information up to date.</p>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold text-slate-300">Name</label>
              <input className="input-modern" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" maxLength={80} required />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-300">Date of birth</label>
              <input className="input-modern" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-300">Profession</label>
              <input className="input-modern" value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} placeholder="Student, Developer, Designer..." maxLength={100} />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold text-slate-300">Email address</label>
              <input className="input-modern cursor-not-allowed opacity-60" value={user?.email || ""} readOnly />
              <p className="mt-2 text-[11px] text-slate-600">Your email is used for login and password recovery.</p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button disabled={loading} className="btn-primary px-6 py-3">
              {loading ? "Saving..." : "Save changes →"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
