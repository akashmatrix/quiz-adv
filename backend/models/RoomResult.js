const mongoose = require("mongoose");

const RoomResultSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    roomCode: { type: String, required: true },
    participantName: { type: String, required: true },
    score: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    rank: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoomResult", RoomResultSchema);
