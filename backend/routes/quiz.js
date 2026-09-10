const express = require("express");
const Question = require("../models/Question");
const Result = require("../models/Result");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// SUBMIT quiz answers -> calculate score on the SERVER (never trust frontend score)
// Expected body: { category, answers: [{ questionId, selectedIndex }] }
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    const { category, answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "No answers submitted" });
    }

    const questionIds = answers.map((a) => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });

    let score = 0;
    const breakdown = [];

    answers.forEach((ans) => {
      const question = questions.find((q) => q._id.toString() === ans.questionId);
      if (!question) return;

      const isCorrect = question.correctAnswerIndex === ans.selectedIndex;
      if (isCorrect) score += 1;

      breakdown.push({
        questionId: question._id,
        questionText: question.questionText,
        selectedIndex: ans.selectedIndex,
        correctAnswerIndex: question.correctAnswerIndex,
        isCorrect,
      });
    });

    const result = await Result.create({
      user: req.user.id,
      score,
      totalQuestions: answers.length,
      category: category || "General",
    });

    res.json({
      message: "Quiz submitted successfully",
      score,
      totalQuestions: answers.length,
      resultId: result._id,
      breakdown,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error submitting quiz" });
  }
});

// GET leaderboard - top 10 scores overall
router.get("/leaderboard", authMiddleware, async (req, res) => {
  try {
    const results = await Result.find()
      .populate("user", "name email")
      .sort({ score: -1, createdAt: 1 })
      .limit(10);

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching leaderboard" });
  }
});

// GET current user's past results
router.get("/my-results", authMiddleware, async (req, res) => {
  try {
    const results = await Result.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching your results" });
  }
});

module.exports = router;
