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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isHost && !participantName) {
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
      let participantId = localStorage.getItem(
        `quizneon-participant-${roomCode}`
      );

      if (!participantId) {
        participantId = crypto.randomUUID();

        localStorage.setItem(
          `quizneon-participant-${roomCode}`,
          participantId
        );
      }

      // Save participant name for refresh/reconnect
      localStorage.setItem(
        `quizneon-name-${roomCode}`,
        participantName
      );

      socket.emit("participant:joinRoom", {
        roomCode,
        participantName,
        participantId,
      });
    }
    localStorage.setItem(
      `quizneon-name-${roomCode}`,
      participantName
    );

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

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy room code:", err);
    }
  };

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#080014] text-white">
        <div className="w-full max-w-md p-8 rounded-3xl border border-red-500/30 bg-white/5 backdrop-blur-xl text-center shadow-2xl">
          <div className="text-5xl mb-5">⚠️</div>

          <h2 className="text-2xl font-bold mb-4">
            Room Error
          </h2>

          <p className="text-red-300 mb-6">
            {error}
          </p>

          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold transition hover:scale-[1.02]"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080014] text-white">
        <div className="text-center">
          <div className="text-5xl mb-5 animate-bounce">
            🚀
          </div>

          <h2 className="text-2xl font-bold">
            Connecting to Room...
          </h2>

          <p className="text-gray-400 mt-2">
            Please wait a moment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#080014] text-white">

      {/* Background Glow */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-pink-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[120px]" />

      {/* Main Card */}
      <div className="relative w-full max-w-lg p-8 rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl shadow-2xl shadow-purple-900/20">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30">
              <span className="text-3xl">🎮</span>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold">
            Room Lobby
          </h2>

          <p className="text-gray-400 text-sm mt-2">
            {isHost
              ? "Your room is ready. Invite your friends!"
              : "You have joined the room successfully!"}
          </p>
        </div>

        {/* Room Code Section */}
        <div className="p-5 rounded-2xl bg-black/30 border border-purple-500/20 text-center mb-6">
          <p className="text-sm text-gray-400 mb-3">
            ROOM CODE
          </p>

          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-extrabold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              {roomCode}
            </span>

            <button
              onClick={copyCode}
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm hover:bg-white/20 transition"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Room Information */}
        <div className="flex justify-between gap-3 mb-6">
          <div className="flex-1 p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-2xl font-bold text-pink-400">
              {totalQuestions}
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Questions
            </p>
          </div>

          <div className="flex-1 p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-2xl font-bold text-purple-400">
              {participants.length}/50
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Players
            </p>
          </div>
        </div>

        {/* Participants */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">
              Participants
            </h3>

            <span className="text-xs text-gray-400">
              Maximum 50
            </span>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">

            {participants.length === 0 && (
              <div className="p-4 rounded-xl bg-white/5 border border-dashed border-purple-500/30 text-center">
                <p className="text-sm text-gray-400">
                  Waiting for players to join...
                </p>
              </div>
            )}

            {participants.map((name, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/40 transition"
              >
                <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 font-bold">
                  {name.charAt(0).toUpperCase()}
                </div>

                <span className="text-sm font-medium">
                  {name}
                </span>

                <span className="ml-auto text-xs text-green-400">
                  Joined
                </span>
              </div>
            ))}

          </div>
        </div>

        {/* Host / Participant Action */}
        {isHost ? (
          <button
            onClick={startQuiz}
            disabled={participants.length === 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-lg shadow-lg shadow-pink-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
          >
            🚀 Start Quiz
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <div className="text-2xl mb-2 animate-pulse">
              ⏳
            </div>

            <p className="text-sm text-gray-300">
              Waiting for the host to start the quiz...
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Share the room code with your friends to play together.
        </p>

      </div>
    </div>
  );
}