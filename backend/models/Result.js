const mongoose = require("mongoose");

const BreakdownSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: false },
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

const ResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: false },
    quizTitle: { type: String, default: "General Quiz" },
    score: { type: Number, required: true },
    points: { type: Number, default: 0 },
    rank: { type: Number, default: null },
    totalQuestions: { type: Number, required: true },
    category: { type: String, default: "General" },
    source: { type: String, enum: ["solo", "saved-quiz", "unknown"], default: "solo" },
    detailsRetained: { type: Boolean, default: true },
    breakdown: { type: [BreakdownSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Result", ResultSchema);
