import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function JoinRoom() {
  const [roomCode, setRoomCode] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomCode.trim() || !participantName.trim()) {
      setError("Please enter both the room code and your name");
      return;
    }
    navigate(`/room/${roomCode.trim().toUpperCase()}`, {
      state: { isHost: false, participantName: participantName.trim() },
    });
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700 dark:text-indigo-400">
        Join a Room
      </h2>
      {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Room Code (e.g. AB12CD)"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 uppercase tracking-widest text-center font-bold"
          maxLength={6}
        />
        <input
          type="text"
          placeholder="Your Name"
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
          className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2"
          maxLength={30}
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
        >
          Join Room
        </button>
      </form>
      <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
        No account needed to join a room — just your name.
      </p>
    </div>
  );
}
