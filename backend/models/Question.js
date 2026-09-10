const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, default: "General" },
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
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", QuestionSchema);
