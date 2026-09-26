import React from "react";
import { Link } from "react-router-dom";

const methods = [
  {
    icon: "✍️",
    title: "Manual Quiz",
    text: "Create every question yourself. Add options, correct answers, explanations and timers.",
    to: "/create-quiz/manual",
    button: "Create Manually",
    className: "from-pink-500 to-rose-600",
  },
  {
    icon: "🤖",
    title: "AI Quiz",
    text: "Give a topic, difficulty and number of questions. Gemini generates a quiz you can review and edit.",
    to: "/create-quiz/ai",
    button: "Generate with AI",
    className: "from-purple-500 to-indigo-600",
  },
  {
    icon: "📄",
    title: "PDF / PPT Quiz",
    text: "Turn your PDF, PPT or PPTX study material into quiz questions.",
    to: "/create-quiz/document",
    button: "Open Document Quiz",
    className: "from-indigo-500 to-blue-600",
    comingSoon: true,
  },
];

export default function CreateQuizHome() {
  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#11131c] px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-pink-300">Quiz Builder</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Create Your Quiz</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-400">
            Choose how you want to build your quiz. Every method opens the same review/edit workflow.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {methods.map((method) => (
            <div key={method.title} className="group rounded-3xl border border-white/10 bg-[#191b26] p-6 shadow-xl transition hover:-translate-y-1 hover:border-pink-400/30">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${method.className} text-2xl shadow-lg`}>
                {method.icon}
              </div>
              <div className="mt-5 flex items-center gap-2">
                <h2 className="text-xl font-bold">{method.title}</h2>
                {method.comingSoon && <span className="rounded-full bg-yellow-500/10 px-2 py-1 text-[10px] font-bold uppercase text-yellow-300">Next</span>}
              </div>
              <p className="mt-3 min-h-20 text-sm leading-6 text-gray-400">{method.text}</p>

              {method.comingSoon ? (
                <Link to={method.to} className="mt-6 block w-full rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-gray-300 hover:bg-white/5">
                  {method.button} →
                </Link>
              ) : (
                <Link to={method.to} className={`mt-6 block w-full rounded-xl bg-gradient-to-r ${method.className} px-4 py-3 text-center text-sm font-bold shadow-lg`}>
                  {method.button} →
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-purple-400/20 bg-purple-500/5 p-6">
          <p className="font-bold text-purple-200">One quiz, multiple ways to use it</p>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            After creating and reviewing questions, you can save the quiz to My Quizzes, start a solo attempt, or host a multiplayer room.
            Saving is optional for the current quiz session.
          </p>
        </div>
      </div>
    </main>
  );
}
