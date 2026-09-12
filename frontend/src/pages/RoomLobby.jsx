import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import socket from "../socket.js";

export default function RoomLobby() {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isHost = location.state?.isHost || false;
  const participantName = location.state?.participantName || "";

  const [participants, setParticipants] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isHost && !participantName) {
      // Someone landed here directly without joining first
      navigate("/join-room");
      return;
    }

    if (!socket.connected) socket.connect();

    function handleHostReady(data) {
      setParticipants(data.participants);
      setTotalQuestions(data.totalQuestions);
      setReady(true);
    }
    function handleJoined(data) {
      setParticipants(data.participants);
      setTotalQuestions(data.totalQuestions);
      setReady(true);
    }
    function handleParticipantsUpdate(names) {
      setParticipants(names);
    }
    function handleErrorMsg(msg) {
      setError(msg);
    }
    function handleQuestion(questionData) {
  navigate(`/room/${roomCode}/play`, {
    state: {
      isHost,
      participantName,
      initialQuestion: questionData,
    },
  });
}
    function handleHostLeft() {
      setError("The host has left the room. The quiz cannot continue.");
    }

    socket.on("room:hostReady", handleHostReady);
    socket.on("room:joined", handleJoined);
    socket.on("room:participantsUpdate", handleParticipantsUpdate);
    socket.on("error:message", handleErrorMsg);
    socket.on("quiz:question", handleQuestion);
    socket.on("room:hostLeft", handleHostLeft);

    if (isHost) {
      const token = localStorage.getItem("token");
      socket.emit("host:enterRoom", { roomCode, token });
    } else {
      socket.emit("participant:joinRoom", { roomCode, participantName });
    }

    return () => {
      socket.off("room:hostReady", handleHostReady);
      socket.off("room:joined", handleJoined);
      socket.off("room:participantsUpdate", handleParticipantsUpdate);
      socket.off("error:message", handleErrorMsg);
      socket.off("quiz:question", handleQuestion);
      socket.off("room:hostLeft", handleHostLeft);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  const startQuiz = () => {
    socket.emit("host:startQuiz", { roomCode });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
        >
          Go Home
        </button>
      </div>
    );
  }

  if (!ready) {
    return <p className="text-center mt-16 dark:text-white">Connecting to room...</p>;
  }

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
      <p className="text-gray-500 dark:text-gray-400 mb-2">Room Code</p>
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className="text-4xl font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400">
          {roomCode}
        </span>
        <button
          onClick={copyCode}
          className="text-sm bg-gray-200 dark:bg-gray-700 dark:text-white px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          Copy
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {totalQuestions} question{totalQuestions !== 1 ? "s" : ""} · Share this code with friends
        to join (max 50)
      </p>

      <div className="text-left mb-6">
        <p className="font-semibold mb-2 dark:text-white">
          Participants ({participants.length}/50)
        </p>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {participants.length === 0 && (
            <p className="text-gray-400 text-sm">Waiting for players to join...</p>
          )}
          {participants.map((name, idx) => (
            <div
              key={idx}
              className="bg-gray-100 dark:bg-gray-700 dark:text-white px-3 py-2 rounded text-sm"
            >
              {name}
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <button
          onClick={startQuiz}
          disabled={participants.length === 0}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          Start Quiz
        </button>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">Waiting for the host to start the quiz...</p>
      )}
    </div>
  );
}
