const express = require("express");
const Question = require("../models/Question");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// GET all questions for a category (protected route - must be logged in to fetch quiz)
// NOTE: we do NOT send correctAnswerIndex to the frontend, so users can't cheat via devtools
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};

    const questions = await Question.find(filter).select("-correctAnswerIndex");
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching questions" });
  }
});

// GET all distinct categories
router.get("/categories", authMiddleware, async (req, res) => {
  try {
    const categories = await Question.distinct("category");
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching categories" });
  }
});

// ADMIN-STYLE: add a new question (open here for simplicity - add auth/role check in production)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { category, questionText, options, correctAnswerIndex, difficulty } = req.body;

    if (!questionText || !options || options.length !== 4 || correctAnswerIndex === undefined) {
      return res.status(400).json({ message: "Invalid question data" });
    }

    const question = await Question.create({
      category,
      questionText,
      options,
      correctAnswerIndex,
      difficulty,
    });

    res.status(201).json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error creating question" });
  }
});

module.exports = router;
