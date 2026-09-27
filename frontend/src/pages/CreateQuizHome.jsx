import React from "react";
import { Link } from "react-router-dom";

const methods = [
  { icon: "✍", kicker: "FULL CONTROL", title: "Manual Quiz", text: "Write your own questions, options, answers, explanations and timers.", to: "/create-quiz/manual", button: "Create manually", accent: "from-indigo-500 to-violet-600" },
  { icon: "✦", kicker: "AI POWERED", title: "AI Quiz", text: "Give a topic, difficulty and question count. Generate, review and edit.", to: "/create-quiz/ai", button: "Generate with AI", accent: "from-violet-500 to-indigo-600" },
  { icon: "▤", kicker: "IMPORT", title: "PDF / PPT", text: "Turn your notes, slides or study material into editable quiz questions.", to: "/create-quiz/document", button: "Import document", accent: "from-indigo-500 to-cyan-600" },
];

export default function CreateQuizHome() {
  return (
    <div className="page-shell">
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="page-container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">Quiz Builder</span>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">How do you want to build it?</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Choose a starting point. You can review and edit questions before saving or hosting your quiz.</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {methods.map((method, index) => (
            <Link key={method.title} to={method.to} className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#10121b]/95 p-6 shadow-2xl transition duration-200 hover:-translate-y-1.5 hover:border-indigo-400/25">
              <div className="absolute right-5 top-5 text-xs font-bold text-slate-700">0{index + 1}</div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${method.accent} text-xl font-black shadow-lg`}>{method.icon}</div>
              <p className="mt-7 text-[9px] font-bold tracking-[0.2em] text-slate-600">{method.kicker}</p>
              <h2 className="mt-2 text-xl font-bold">{method.title}</h2>
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-500">{method.text}</p>
              <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-5 text-sm font-bold text-slate-200">
                {method.button}<span className="text-indigo-400 transition group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {["Save to My Quizzes", "Practice it solo", "Host a live room"].map((item, i) => (
            <div key={item} className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-center text-xs font-semibold text-slate-500">
              <span className="mr-2 text-indigo-400">{["✓", "◈", "⌁"][i]}</span>{item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
