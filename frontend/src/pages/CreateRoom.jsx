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
    updated[qIdx] = { ...updated[qIdx], options: opts };
    setQuestions(updated);
  };

  const addQuestion = () => setQuestions([...questions, emptyQuestion()]);

  const removeQuestion = (idx) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    for (const q of questions) {
      if (!q.questionText.trim() || q.options.some((o) => !o.trim())) {
        setError("Please fill in every question and all 4 options");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await api.post("/rooms/create", { questions });
      const roomCode = res.data.roomCode;

      if (!socket.connected) socket.connect();

      navigate(`/room/${roomCode}`, { state: { isHost: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Could not create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center text-indigo-700 dark:text-indigo-400 mb-6">
        Create a Room
      </h2>
      {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="border dark:border-gray-600 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold dark:text-white">Question {qIdx + 1}</span>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="text-red-500 text-sm hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Question text"
              value={q.questionText}
              onChange={(e) => updateQuestion(qIdx, "questionText", e.target.value)}
              className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 mb-3"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {q.options.map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qIdx}`}
                    checked={q.correctAnswerIndex === optIdx}
                    onChange={() => updateQuestion(qIdx, "correctAnswerIndex", optIdx)}
                    title="Mark as correct answer"
                  />
                  <input
                    type="text"
                    placeholder={`Option ${optIdx + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                    className="flex-1 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Select the radio button next to the correct option
            </p>

            <label className="text-sm text-gray-600 dark:text-gray-300">
              Time limit: <span className="font-semibold">{q.timeLimit} seconds</span>
            </label>
            <input
              type="range"
              min="10"
              max="30"
              value={q.timeLimit}
              onChange={(e) => updateQuestion(qIdx, "timeLimit", parseInt(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="w-full border-2 border-dashed border-indigo-400 text-indigo-600 dark:text-indigo-400 py-2 rounded hover:bg-indigo-50 dark:hover:bg-gray-700 transition"
        >
          + Add Another Question
        </button>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Room & Get Code"}
        </button>
      </form>
    </div>
  );
}
