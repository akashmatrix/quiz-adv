import React, { useState, useEffect } from "react";

const DEFAULT_MESSAGES = [
  "Understanding your topic & subject...",
  "Designing high-quality questions...",
  "Calibrating difficulty levels & distractors...",
  "Validating single correct answers...",
  "Crafting detailed educational explanations...",
  "Finalizing your AI quiz...",
];

export default function LoadingState({
  title = "Generating Your AI Quiz",
  messages = DEFAULT_MESSAGES,
  interval = 2400,
}) {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % messages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [messages.length, interval]);

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-lg mx-auto">
      {/* Animated Glowing Orb / Indeterminate Indicator */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 animate-spin blur-md opacity-70" />
        <div className="absolute inset-2 rounded-full bg-[#0d0722] flex items-center justify-center border border-white/20">
          <span className="text-3xl animate-pulse">✨</span>
        </div>
      </div>

      {/* Main Title */}
      <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
        {title}
      </h3>

      {/* Rotating status message */}
      <div className="h-10 flex items-center justify-center">
        <p className="text-sm sm:text-base font-medium text-pink-300 animate-fade transition-all duration-300">
          {messages[currentIdx]}
        </p>
      </div>

      {/* Indeterminate pulsing progress bar */}
      <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mt-6">
        <div className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 w-1/2 rounded-full animate-indeterminate" />
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Our AI is structuring academic-grade questions and verified answers.
      </p>

      <style>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-indeterminate {
          animation: indeterminate 1.8s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
