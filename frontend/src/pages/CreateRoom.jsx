import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import socket from "../socket.js";

const emptyQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctAnswerIndex: 0,
  timeLimit: 20,
});

export default function CreateRoom() {
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIdx, optIdx, value) => {
    const updated = [...questions];
    const opts = [...updated[qIdx].options];

    opts[optIdx] = value;
    updated[qIdx] = {
      ...updated[qIdx],
      options: opts,
    };

    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([...questions, emptyQuestion()]);
  };

  const removeQuestion = (idx) => {
    if (questions.length === 1) return;

    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    for (const q of questions) {
      if (
        !q.questionText.trim() ||
        q.options.some((o) => !o.trim())
      ) {
        setError(
          "Please fill in every question and all 4 options"
        );
        return;
      }
    }

    setLoading(true);

    try {
      const res = await api.post("/rooms/create", {
        questions,
      });

      const roomCode = res.data.roomCode;

      if (!socket.connected) {
        socket.connect();
      }

      navigate(`/room/${roomCode}`, {
        state: { isHost: true },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not create room"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#11131c] px-4 py-10 text-white relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-3xl shadow-lg shadow-pink-500/30 mb-4">
            ⚡
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Create Your Room
          </h1>

          <p className="text-gray-400 mt-3">
            Build your quiz, challenge your friends and
            dominate the leaderboard.
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl border border-white/10 bg-[#191b26]/90 backdrop-blur-xl shadow-2xl p-5 sm:p-8">

          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
            <div>
              <h2 className="text-xl font-bold">
                Quiz Questions
              </h2>

              <p className="text-sm text-gray-400 mt-1">
                Add questions and select the correct answers.
              </p>
            </div>

            <div className="rounded-full bg-purple-500/15 border border-purple-400/20 px-4 py-2 text-sm text-purple-300">
              {questions.length}{" "}
              {questions.length === 1
                ? "Question"
                : "Questions"}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">

            {/* Questions */}
            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 transition hover:border-pink-400/30"
              >

                {/* Question Header */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                      {qIdx + 1}
                    </div>

                    <h3 className="font-bold text-lg">
                      Question {qIdx + 1}
                    </h3>
                  </div>

                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="text-sm text-red-400 hover:text-red-300 hover:underline transition"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Question Input */}
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Question Text
                </label>

                <textarea
                  rows="3"
                  placeholder="Enter your question..."
                  value={q.questionText}
                  onChange={(e) =>
                    updateQuestion(
                      qIdx,
                      "questionText",
                      e.target.value
                    )
                  }
                  required
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                />

                {/* Options */}
                <div className="mt-6 mb-3">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Answer Options
                  </label>

                  <p className="text-xs text-gray-500 mb-4">
                    Select the radio button next to the correct answer.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                        q.correctAnswerIndex === optIdx
                          ? "border-pink-500/60 bg-pink-500/10"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      {/* Correct Answer Radio */}
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        checked={
                          q.correctAnswerIndex === optIdx
                        }
                        onChange={() =>
                          updateQuestion(
                            qIdx,
                            "correctAnswerIndex",
                            optIdx
                          )
                        }
                        title="Mark as correct answer"
                        className="h-4 w-4 accent-pink-500 cursor-pointer"
                      />

                      <span className="text-xs font-bold text-gray-500">
                        {String.fromCharCode(65 + optIdx)}
                      </span>

                      <input
                        type="text"
                        placeholder={`Option ${optIdx + 1}`}
                        value={opt}
                        onChange={(e) =>
                          updateOption(
                            qIdx,
                            optIdx,
                            e.target.value
                          )
                        }
                        required
                        className="w-full min-w-0 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Time Limit */}
                <div className="mt-7 rounded-xl bg-white/[0.03] border border-white/10 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-300">
                      Time Limit
                    </label>

                    <span className="rounded-full bg-purple-500/20 px-3 py-1 text-sm font-bold text-purple-300">
                      {q.timeLimit} seconds
                    </span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="30"
                    value={q.timeLimit}
                    onChange={(e) =>
                      updateQuestion(
                        qIdx,
                        "timeLimit",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full accent-pink-500 cursor-pointer"
                  />

                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>10 sec</span>
                    <span>30 sec</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Question */}
            <button
              type="button"
              onClick={addQuestion}
              className="w-full rounded-2xl border-2 border-dashed border-pink-400/40 py-4 font-semibold text-pink-300 transition hover:border-pink-400 hover:bg-pink-500/10"
            >
              + Add Another Question
            </button>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 py-4 font-bold tracking-wide shadow-lg shadow-pink-500/20 transition hover:scale-[1.01] hover:shadow-pink-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating Room..."
                : "Create Room & Get Code ⚡"}
            </button>

          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Create challenging questions and enjoy the battle.
        </p>

      </div>
    </div>
  );
}