const mongoose = require("mongoose");

const RoomQuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: {
      type: [String],
      validate: {
        validator: (arr) => arr.length === 4,
        message: "A question must have exactly 4 options",
      },
      required: true,
    },
    correctAnswerIndex: { type: Number, required: true, min: 0, max: 3 },
    imageUrl: { type: String, default: "", trim: true },
    // Host decides timer for each question - between 2 and 120 seconds
    timeLimit: { type: Number, required: true, min: 2, max: 120, default: 20 },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const RoomSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true, uppercase: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hostName: { type: String, required: true },
    title: { type: String, default: "Hosted Quiz" },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: false },
    questions: {
      type: [RoomQuestionSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "Room must have at least 1 question",
      },
    },
    status: { type: String, enum: ["waiting", "active", "finished"], default: "waiting" },
    maxParticipants: { type: Number, default: 150, min: 1, max: 150 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", RoomSchema);
