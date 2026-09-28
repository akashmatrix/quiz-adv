const mongoose = require("mongoose");

const RoomBreakdownSchema = new mongoose.Schema(
  {
    questionText: { type: String, default: "" },
    options: { type: [String], default: [] },
    selectedIndex: { type: Number, default: -1 },
    correctAnswerIndex: { type: Number, required: true, min: 0, max: 3 },
    imageUrl: { type: String, default: "" },
    explanation: { type: String, default: "" },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const RoomResultSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    roomCode: { type: String, required: true },
    participantName: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, index: true },
    score: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    rank: { type: Number },
    detailsRetained: { type: Boolean, default: true },
    breakdown: { type: [RoomBreakdownSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoomResult", RoomResultSchema);
