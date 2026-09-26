const mongoose = require("mongoose");

const QuizQuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 4 && arr.every((item) => typeof item === "string" && item.trim()),
        message: "Each question must have exactly 4 filled options",
      },
      required: true,
    },
    correctAnswerIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, default: "", trim: true },
    timeLimit: { type: Number, required: true, min: 2, max: 120, default: 20 },
  },
  { _id: true }
);

const QuizSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    topic: { type: String, default: "General", trim: true, maxlength: 100 },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    creationMethod: {
      type: String,
      enum: ["manual", "ai", "pdf", "ppt"],
      default: "manual",
    },
    status: {
      type: String,
      enum: ["draft", "ready", "live", "completed", "archived"],
      default: "draft",
    },
    timePerQuestion: { type: Number, min: 2, max: 120, default: 20 },
    questions: {
      type: [QuizQuestionSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Quiz must contain at least one question",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", QuizSchema);
