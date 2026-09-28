import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const optionLetter = (index) => {
  const number = Number(index);
  return Number.isInteger(number) && number >= 0 && number < 26
    ? String.fromCharCode(65 + number)
    : "—";
};

const getOptionText = (options, index) => {
  const number = Number(index);
  if (!Array.isArray(options) || !Number.isInteger(number) || number < 0 || number >= options.length) {
    return "Not answered";
  }
  return options[number];
};

const AnswerOption = ({ label, text, tone = "default" }) => {
  const toneClass =
    tone === "correct"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : tone === "wrong"
        ? "border-red-500/30 bg-red-500/10 text-red-200"
        : "border-white/10 bg-white/[0.03] text-gray-300";

  return (
    <div className={`rounded-xl border px-4 py-3 ${toneClass}`}>
      <span className="mr-2 font-bold">{label}.</span>
      {text}
    </div>
  );
};

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#080014] text-white">
        <div className="w-full max-w-md p-8 text-center rounded-3xl border border-violet-500/30 bg-white/5 backdrop-blur-xl">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-2xl font-bold mb-3">No Result Found</h2>
          <p className="text-gray-400 text-sm mb-6">Complete a quiz to view your result.</p>
          <button onClick={() => navigate("/")} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-bold transition hover:scale-[1.02]">
            Take a Quiz →
          </button>
        </div>
      </div>
    );
  }

  const { score = 0, totalQuestions = 0, breakdown = [] } = state;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen px-4 py-10 bg-[#080014] text-white">
      <div className="fixed top-10 left-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-72 h-72 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-2xl mx-auto">
        <div className="p-8 rounded-3xl border border-violet-500/30 bg-white/5 backdrop-blur-xl shadow-2xl mb-6">
          <div className="text-center">
            <div className="text-5xl mb-4">{percentage >= 80 ? "🏆" : percentage >= 50 ? "🎉" : "💪"}</div>
            <h2 className="text-3xl font-extrabold">Quiz Result</h2>
            <p className="text-gray-400 text-sm mt-2">Here is your performance summary</p>
          </div>

          <div className="my-8 text-center">
            <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              {score} / {totalQuestions}
            </p>
            <p className="text-gray-400 mt-3">You scored <span className="text-indigo-400 font-bold">{percentage}%</span></p>
          </div>

          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} />
          </div>
        </div>

        <div className="p-6 md:p-8 rounded-3xl border border-violet-500/30 bg-white/5 backdrop-blur-xl">
          <h3 className="text-xl font-bold mb-5">Answer Review</h3>

          <div className="space-y-4">
            {breakdown.map((b, idx) => {
              const selected = Number(b.selectedIndex);
              const correct = Number(b.correctAnswerIndex);
              const hasSelected = Number.isInteger(selected) && selected >= 0;
              const selectedText = getOptionText(b.options, selected);
              const correctText = getOptionText(b.options, correct);

              return (
                <div key={idx} className={`p-5 rounded-2xl border ${b.isCorrect ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}`}>
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <p className="font-semibold leading-relaxed">{idx + 1}. {b.questionText}</p>
                    <span className="text-xl">{b.isCorrect ? "✅" : "❌"}</span>
                  </div>

                  {b.imageUrl && <img src={b.imageUrl} alt="Question visual" className="mb-4 max-h-64 w-full rounded-xl border border-white/10 object-contain bg-black/20" />}

                  <div className="space-y-2 text-sm">
                    <AnswerOption
                      label={hasSelected ? optionLetter(selected) : "—"}
                      text={hasSelected ? selectedText : "Not answered"}
                      tone={b.isCorrect ? "correct" : hasSelected ? "wrong" : "default"}
                    />

                    {!b.isCorrect && (
                      <AnswerOption
                        label={optionLetter(correct)}
                        text={correctText}
                        tone="correct"
                      />
                    )}
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm">
                    <p className="font-semibold text-gray-300">Correct Answer</p>
                    <p className="mt-1 text-emerald-300 font-semibold">
                      {optionLetter(correct)}. {correctText}
                    </p>
                  </div>

                  {b.explanation?.trim() && (
                    <div className="mt-3 rounded-xl border border-indigo-400/20 bg-indigo-500/5 px-4 py-3 text-sm">
                      <p className="font-semibold text-indigo-200">💡 Explanation</p>
                      <p className="mt-1 leading-6 text-gray-300">{b.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button onClick={() => navigate("/")} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-bold transition hover:scale-[1.02]">
              🔄 Play Again
            </button>
            <button onClick={() => navigate("/history")} className="flex-1 py-3 rounded-xl border border-violet-500/40 bg-white/5 font-bold hover:bg-violet-500/20 transition">
              🕘 Quiz History
            </button>
            <button onClick={() => navigate("/leaderboard")} className="flex-1 py-3 rounded-xl border border-violet-500/40 bg-white/5 font-bold hover:bg-violet-500/20 transition">
              🏆 Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
