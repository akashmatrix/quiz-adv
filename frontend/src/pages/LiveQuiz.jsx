import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import socket from "../socket.js";

export default function LiveQuiz() {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isHost = location.state?.isHost || false;

  const [phase, setPhase] = useState("question"); // question | leaderboard | finished
  const [question, setQuestion] = useState(
    location.state?.initialQuestion || null
  );
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(
    location.state?.initialQuestion?.timeLimit || 0
  );
  const [leaderboard, setLeaderboard] = useState([]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);

  useEffect(() => {
    function handleQuestion(data) {
      setQuestion(data);
      setSelected(null);
      setPhase("question");
      setTimeLeft(data.timeLimit);
    }
    function handleLeaderboard(data) {
      setLeaderboard(data.leaderboard);
      setCorrectAnswerIndex(data.correctAnswerIndex);
      setPhase("leaderboard");
    }
    function handleFinished(data) {
      setFinalLeaderboard(data.leaderboard);
      setPhase("finished");
    }

    socket.on("quiz:question", handleQuestion);
    socket.on("quiz:leaderboard", handleLeaderboard);
    socket.on("quiz:finished", handleFinished);

    return () => {
      socket.off("quiz:question", handleQuestion);
      socket.off("quiz:leaderboard", handleLeaderboard);
      socket.off("quiz:finished", handleFinished);
    };
  }, []);

  // Local countdown timer display (server is the source of truth for actual timing)
  useEffect(() => {
    if (phase !== "question" || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const selectAnswer = (idx) => {
    if (selected !== null || isHost) return;
    setSelected(idx);
    socket.emit("participant:submitAnswer", { roomCode, selectedIndex: idx });
  };

  if (phase === "finished") {
    return (
      <div className="max-w-xl mx-auto mt-10 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-indigo-700 dark:text-indigo-400 mb-6">
          🏁 Final Results
        </h2>
        <div className="space-y-2 mb-6">
          {finalLeaderboard.map((p, idx) => (
            <div
              key={idx}
              className={`flex justify-between items-center px-4 py-3 rounded ${idx === 0
                  ? "bg-yellow-100 dark:bg-yellow-900 font-bold"
                  : "bg-gray-100 dark:bg-gray-700"
                } dark:text-white`}
            >
              <span>
                {idx + 1}. {p.name} {idx === 0 && "🏆"}
              </span>
              <span>{p.score} pts</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate("/")}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (phase === "leaderboard") {
    return (
      <div className="max-w-xl mx-auto mt-10 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-center text-indigo-700 dark:text-indigo-400 mb-2">
          Leaderboard
        </h2>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          Next question starts automatically in a few seconds...
        </p>
        <div className="space-y-2">
          {leaderboard.map((p, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 dark:text-white px-4 py-3 rounded"
            >
              <span>
                {idx + 1}. {p.name}{" "}
                {p.lastCorrect === true && (
                  <span className="text-green-600 dark:text-green-400">✅ +{p.lastPoints}</span>
                )}
                {p.lastCorrect === false && <span className="text-red-500">❌</span>}
              </span>
              <span className="font-semibold">{p.score} pts</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!question) {
    return <p className="text-center mt-16 dark:text-white">Loading question...</p>;
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Question {question.questionNumber} of {question.totalQuestions}
        </span>
        <span
          className={`text-lg font-bold ${timeLeft <= 5 ? "text-red-600" : "text-indigo-600 dark:text-indigo-400"
            }`}
        >
          ⏱ {timeLeft}s
        </span>
      </div>
      <h2 className="text-xl font-semibold mb-6 dark:text-white">{question.questionText}</h2>

      {isHost ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Players are answering on their own screens...
        </p>
      ) : (
        <div className="space-y-3">
          {question.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => selectAnswer(idx)}
              disabled={selected !== null}
              className={`w-full text-left px-4 py-3 rounded border transition ${selected === idx
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
                } disabled:cursor-not-allowed`}
            >
              {opt}
            </button>
          ))}
          {selected !== null && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              Answer submitted — waiting for others / time to run out...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
