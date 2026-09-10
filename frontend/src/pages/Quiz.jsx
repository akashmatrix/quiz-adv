import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function Quiz() {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedIndex }
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/questions/categories")
      .then((res) => setCategories(res.data))
      .catch(() => setError("Could not load categories"));
  }, []);

  const startQuiz = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/questions", { params: category ? { category } : {} });
      if (res.data.length === 0) {
        setError("No questions found for this category yet.");
        setLoading(false);
        return;
      }
      setQuestions(res.data);
      setStarted(true);
      setCurrent(0);
      setAnswers({});
    } catch (err) {
      setError(err.response?.data?.message || "Could not load questions");
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionId, index) => {
    setAnswers({ ...answers, [questionId]: index });
  };

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      const payload = {
        category: category || "General",
        answers: questions.map((q) => ({
          questionId: q._id,
          selectedIndex: answers[q._id] ?? -1,
        })),
      };
      const res = await api.post("/quiz/submit", payload);
      navigate("/result", { state: res.data });
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit quiz");
    } finally {
      setLoading(false);
    }
  };

  if (!started) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-6 text-indigo-700 dark:text-indigo-400">Start a Quiz</h2>
        {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 mb-4"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button
          onClick={startQuiz}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "Loading..." : "Start Quiz"}
        </button>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
        <span>
          Question {current + 1} of {questions.length}
        </span>
        <span>{category || "General"}</span>
      </div>
      <h2 className="text-xl font-semibold mb-6 dark:text-white">{q.questionText}</h2>
      <div className="space-y-3">
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => selectAnswer(q._id, idx)}
            className={`w-full text-left px-4 py-3 rounded border transition ${
              answers[q._id] === idx
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <button
        onClick={nextQuestion}
        disabled={answers[q._id] === undefined || loading}
        className="w-full mt-6 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
      >
        {current === questions.length - 1 ? (loading ? "Submitting..." : "Submit Quiz") : "Next"}
      </button>
    </div>
  );
}
