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
    // Host decides timer for each question - between 10 and 30 seconds
    timeLimit: { type: Number, required: true, min: 10, max: 30, default: 20 },
  },
  { _id: false }
);

const RoomSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true, uppercase: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hostName: { type: String, required: true },
    questions: {
      type: [RoomQuestionSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "Room must have at least 1 question",
      },
    },
    status: { type: String, enum: ["waiting", "active", "finished"], default: "waiting" },
    maxParticipants: { type: Number, default: 50 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", RoomSchema);
