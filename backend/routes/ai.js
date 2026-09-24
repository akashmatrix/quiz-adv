const express = require("express");
const authMiddleware = require("../middleware/auth");
const {
  generateAndSaveQuiz,
  regenerateQuiz,
  getWeakAreas,
  generateWeakAreaQuiz,
} = require("../services/aiQuizService");
const aiProvider = require("../services/ai/aiProvider");

const router = express.Router();

// Simple in-memory rate limiter to prevent duplicate/spam AI requests
const requestTimestamps = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function aiRateLimiter(req, res, next) {
  const identifier = req.user?.id || req.ip || "unknown";
  const now = Date.now();
  const timestamps = requestTimestamps.get(identifier) || [];

  // Filter timestamps within current window
  const activeTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      message: "Too many AI generation requests. Please wait a moment before generating another quiz.",
    });
  }

  activeTimestamps.push(now);
  requestTimestamps.set(identifier, activeTimestamps);
  next();
}

/**
 * GET /api/ai/status
 * Check if the AI provider is configured and available
 */
router.get("/status", (req, res) => {
  const info = aiProvider.getProviderInfo();
  res.json({
    configured: info.configured,
    provider: info.provider,
    model: info.model,
  });
});

/**
 * POST /api/ai/generate-quiz
 * Generate a new quiz from user preferences and persist to MongoDB
 */
router.post("/generate-quiz", authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const {
      subject,
      topic,
      difficulty,
      questionCount,
      language,
      questionType,
      timePerQuestion,
      explanations,
      customInstructions,
    } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: "Subject is required" });
    }

    const quiz = await generateAndSaveQuiz(
      {
        subject,
        topic,
        difficulty,
        questionCount,
        language,
        questionType,
        timePerQuestion,
        explanations,
        customInstructions,
      },
      req.user.id
    );

    res.status(201).json({
      message: "Quiz generated successfully",
      quiz,
    });
  } catch (err) {
    console.error("AI Generation Route Error:", err);

    if (err.code === "AI_KEY_MISSING") {
      return res.status(503).json({
        message: "AI generation is not yet configured. Please set AI_API_KEY in backend/.env.",
        code: "AI_KEY_MISSING",
      });
    }

    const clientMsg =
      err.status === 429
        ? "AI provider rate limit reached. Please try again shortly."
        : err.message || "AI could not generate the quiz. Please try again.";

    res.status(500).json({ message: clientMsg });
  }
});

/**
 * POST /api/ai/regenerate-quiz
 * Generate a new quiz based on previous quiz preferences with distinct questions
 */
router.post("/regenerate-quiz", authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { quizId } = req.body;

    if (!quizId) {
      return res.status(400).json({ message: "quizId is required to regenerate" });
    }

    const quiz = await regenerateQuiz(quizId, req.user.id);

    res.status(201).json({
      message: "Similar quiz generated successfully",
      quiz,
    });
  } catch (err) {
    console.error("AI Regeneration Route Error:", err);
    res.status(500).json({
      message: err.message || "Could not regenerate quiz. Please try again.",
    });
  }
});

/**
 * GET /api/ai/weak-areas
 * Return weak areas based on actual stored user quiz results
 */
router.get("/weak-areas", authMiddleware, async (req, res) => {
  try {
    const data = await getWeakAreas(req.user.id);
    res.json(data);
  } catch (err) {
    console.error("Weak areas error:", err);
    res.status(500).json({ message: "Could not analyze performance history." });
  }
});

/**
 * POST /api/ai/generate-weak-area-quiz
 * Generate targeted quiz on user's weak areas
 */
router.post("/generate-weak-area-quiz", authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const quiz = await generateWeakAreaQuiz(req.user.id);
    res.status(201).json({
      message: "Targeted practice quiz generated successfully",
      quiz,
    });
  } catch (err) {
    console.error("Weak area quiz generation error:", err);
    res.status(500).json({
      message: err.message || "Could not generate targeted quiz.",
    });
  }
});

module.exports = router;
