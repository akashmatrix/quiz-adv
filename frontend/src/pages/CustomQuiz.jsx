import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function CustomQuiz() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const quiz = state?.quiz;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(quiz?.questions?.[0]?.timeLimit || quiz?.timePerQuestion || 20);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!quiz?.questions?.length) return;
    setSeconds(quiz.questions[current]?.timeLimit || quiz.timePerQuestion || 20);
  }, [current, quiz]);

  useEffect(() => {
    if (!quiz?.questions?.length || submitting) return undefined;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setTimeout(() => nextQuestion(true), 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [current, quiz, submitting]);

  if (!quiz?.questions?.length) {
    return <div className="min-h-screen bg-[#11131c] p-8 text-center text-white"><p>No quiz session found.</p><button onClick={() => navigate("/create-quiz")} className="mt-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3 font-bold">Back to Create Quiz</button></div>;
  }

  const question = quiz.questions[current];
  const selected = answers[current];
  const progress = ((current + 1) / quiz.questions.length) * 100;

  function choose(index) {
    setAnswers((items) => ({ ...items, [current]: index }));
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        category: quiz.topic || "General",
        answers: quiz.questions.map((q, index) => ({
          questionText: q.questionText,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex,
          selectedIndex: answers[index] ?? -1,
        })),
      };
      const { data } = await api.post("/quizzes/submit-draft", payload);
      navigate("/result", { state: data });
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit quiz.");
      setSubmitting(false);
    }
  }

  function nextQuestion() {
    if (current < quiz.questions.length - 1) setCurrent((value) => value + 1);
    else submit();
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#080014] px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div><p className="text-xs uppercase tracking-widest text-gray-500">{quiz.topic || "General"}</p><h1 className="mt-1 text-xl font-bold sm:text-2xl">{quiz.title}</h1></div>
          <div className="rounded-full border border-pink-400/30 bg-pink-500/10 px-4 py-2 text-sm font-bold text-pink-200">⏱️ {seconds}s</div>
        </div>
        <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${progress}%` }} /></div>

        {error && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        <section className="rounded-3xl border border-white/10 bg-[#191b26] p-6 shadow-2xl sm:p-8">
          <p className="text-sm text-gray-500">Question {current + 1} of {quiz.questions.length}</p>
          <h2 className="mt-3 text-xl font-bold leading-relaxed sm:text-2xl">{question.questionText}</h2>
          <div className="mt-7 grid gap-3">
            {question.options.map((option, index) => (
              <button key={index} onClick={() => choose(index)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${selected === index ? "border-pink-500 bg-pink-500/10" : "border-white/10 bg-white/[0.03] hover:border-pink-400/40"}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 font-bold">{String.fromCharCode(65 + index)}</span>
                <span>{option}</span>
              </button>
            ))}
          </div>
          <button onClick={nextQuestion} disabled={submitting} className="mt-7 w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3 font-bold disabled:opacity-50">
            {current === quiz.questions.length - 1 ? "Finish Quiz" : "Next Question →"}
          </button>
        </section>
      </div>
    </main>
  );
}
