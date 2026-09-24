const mongoose = require("mongoose");

const QuizQuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2 && arr.length <= 6,
        message: "Question must have between 2 and 6 options",
      },
      required: true,
    },
    correctAnswerIndex: { type: Number, required: true, min: 0, max: 5 },
    explanation: { type: String, default: "" },
  },
  { _id: true }
);

const QuizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    subject: { type: String, required: true, trim: true },
    topic: { type: String, default: "", trim: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Mixed", "easy", "medium", "hard", "mixed"],
      default: "Medium",
    },
    language: {
      type: String,
      enum: ["English", "Hindi", "Hinglish"],
      default: "English",
    },
    questionType: {
      type: String,
      enum: ["MCQ", "True/False", "Mixed"],
      default: "MCQ",
    },
    questionCount: { type: Number, required: true, min: 1, max: 50 },
    timePerQuestion: { type: Number, default: 30, min: 0, max: 120 }, // 0 = no timer
    showExplanations: { type: Boolean, default: true },
    customInstructions: { type: String, default: "" },
    questions: {
      type: [QuizQuestionSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Quiz must have at least 1 question",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", QuizSchema);
