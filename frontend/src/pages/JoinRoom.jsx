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
      state: {
        isHost: false,
        participantName: participantName.trim(),
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#080014] text-white">

      {/* Background Glow */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-pink-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[120px]" />

      {/* Main Card */}
      <div className="relative w-full max-w-md p-8 rounded-3xl border border-purple-500/30 bg-white/5 backdrop-blur-xl shadow-2xl shadow-purple-900/20">

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30">
            <span className="text-3xl">🚀</span>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-extrabold text-center mb-2">
          Join a Room
        </h2>

        <p className="text-gray-400 text-center text-sm mb-8">
          Enter the room code and start playing with friends
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-5 p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Room Code */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room Code
            </label>

            <input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                setError("");
              }}
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl border border-purple-500/30 bg-black/30 text-white placeholder-gray-500 text-center font-bold tracking-[0.4em] uppercase outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
            />
          </div>

          {/* Participant Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              value={participantName}
              onChange={(e) => {
                setParticipantName(e.target.value);
                setError("");
              }}
              maxLength={30}
              className="w-full px-4 py-3 rounded-xl border border-purple-500/30 bg-black/30 text-white placeholder-gray-500 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
            />
          </div>

          {/* Join Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg shadow-lg shadow-pink-500/20 transition duration-300 hover:scale-[1.02] hover:shadow-pink-500/40 active:scale-95"
          >
            Join Room →
          </button>
        </form>

        {/* Bottom Text */}
        <p className="text-xs text-center text-gray-500 mt-6">
          No account needed — just enter your name and join.
        </p>

      </div>
    </div>
  );
}