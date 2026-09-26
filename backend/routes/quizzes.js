const express = require("express");
const Quiz = require("../models/Quiz");
const Room = require("../models/Room");
const authMiddleware = require("../middleware/auth");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();

const VALID_DIFFICULTIES = ["easy", "medium", "hard"];
const VALID_METHODS = ["manual", "ai", "pdf", "ppt"];
const VALID_STATUSES = ["draft", "ready"];

function normalizeQuestions(input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("At least 1 question is required");
  }

  return input.map((q, index) => {
    const questionText = String(q.questionText || "").trim();
    const options = Array.isArray(q.options)
      ? q.options.map((option) => String(option || "").trim())
      : [];
    const correctAnswerIndex = Number(q.correctAnswerIndex);
    const timeLimit = Number(q.timeLimit ?? 20);

    if (!questionText) throw new Error(`Question ${index + 1} is empty`);
    if (options.length !== 4 || options.some((option) => !option)) {
      throw new Error(`Question ${index + 1} must have 4 filled options`);
    }
    if (!Number.isInteger(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex > 3) {
      throw new Error(`Question ${index + 1} has an invalid correct answer`);
    }
    if (!Number.isFinite(timeLimit) || timeLimit < 2 || timeLimit > 120) {
      throw new Error(`Question ${index + 1} timer must be between 2 and 120 seconds`);
    }

    return {
      questionText,
      options,
      correctAnswerIndex,
      explanation: String(q.explanation || "").trim(),
      timeLimit,
    };
  });
}

function normalizeQuizBody(body) {
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const topic = String(body.topic || "General").trim() || "General";
  const difficulty = body.difficulty || "medium";
  const creationMethod = body.creationMethod || "manual";
  const status = body.status || "draft";
  const timePerQuestion = Number(body.timePerQuestion ?? 20);

  if (!title) throw new Error("Quiz title is required");
  if (!VALID_DIFFICULTIES.includes(difficulty)) throw new Error("Invalid difficulty");
  if (!VALID_METHODS.includes(creationMethod)) throw new Error("Invalid creation method");
  if (!VALID_STATUSES.includes(status)) throw new Error("Invalid quiz status");
  if (!Number.isFinite(timePerQuestion) || timePerQuestion < 2 || timePerQuestion > 120) {
    throw new Error("Time per question must be between 2 and 120 seconds");
  }

  return {
    title,
    description,
    topic,
    difficulty,
    creationMethod,
    status,
    timePerQuestion,
    questions: normalizeQuestions(body.questions),
  };
}

// GET all quizzes owned by the authenticated user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ ownerId: req.user.id }).sort({ updatedAt: -1 });
    res.json(quizzes);
  } catch (err) {
    console.error("Get quizzes error:", err);
    res.status(500).json({ message: "Server error fetching your quizzes" });
  }
});

// GENERATE a quiz with Gemini (nothing is saved automatically)
router.post("/ai/generate", authMiddleware, async (req, res) => {
  try {
    const { topic, difficulty, questionCount, timePerQuestion, instructions } = req.body;

    const cleanTopic = String(topic || "").trim();
    const cleanDifficulty = String(difficulty || "medium").toLowerCase();
    const count = Number(questionCount);
    const timer = Number(timePerQuestion);
    const extraInstructions = String(instructions || "").trim();

    if (!cleanTopic) {
      return res.status(400).json({ message: "Topic is required" });
    }

    if (!VALID_DIFFICULTIES.includes(cleanDifficulty)) {
      return res.status(400).json({ message: "Invalid difficulty" });
    }

    if (!Number.isInteger(count) || count < 1 || count > 50) {
      return res.status(400).json({ message: "Question count must be between 1 and 50" });
    }

    if (!Number.isInteger(timer) || timer < 2 || timer > 120) {
      return res.status(400).json({ message: "Time per question must be between 2 and 120 seconds" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "AI service is not configured on the server" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

    const prompt = `You are a quiz-generation engine. Generate accurate educational multiple-choice quizzes.
Create a ${cleanDifficulty} difficulty quiz about: ${cleanTopic}.
Generate exactly ${count} questions.
The application timer for every question is ${timer} seconds.
Additional instructions: ${extraInstructions || "None"}

Rules:
- Every question must have exactly four distinct, non-empty options.
- correctAnswerIndex must be an integer from 0 to 3.
- Keep explanations concise and useful.
- Do not include markdown fences.
- Do not change the requested timer.
- Return only data matching the requested JSON schema.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            topic: { type: "string" },
            difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  questionText: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 4,
                    maxItems: 4,
                  },
                  correctAnswerIndex: { type: "integer", minimum: 0, maximum: 3 },
                  explanation: { type: "string" },
                },
                required: ["questionText", "options", "correctAnswerIndex", "explanation"],
              },
            },
          },
          required: ["title", "description", "topic", "difficulty", "questions"],
        },
      },
    });

    const raw = response.text;
    let generated;

    try {
      generated = JSON.parse(raw);
    } catch (parseError) {
      console.error("Gemini returned invalid JSON:", parseError.message);
      return res.status(502).json({ message: "AI returned an invalid quiz format. Please try again." });
    }

    if (!generated || !Array.isArray(generated.questions)) {
      return res.status(502).json({ message: "AI returned an invalid quiz structure. Please try again." });
    }

    if (generated.questions.length !== count) {
      return res.status(502).json({
        message: `AI generated ${generated.questions.length} questions instead of ${count}. Please try again.`,
      });
    }

    const questions = generated.questions.map((q, index) => {
      const questionText = String(q?.questionText || "").trim();
      const options = Array.isArray(q?.options)
        ? q.options.map((option) => String(option || "").trim())
        : [];
      const correctAnswerIndex = Number(q?.correctAnswerIndex);
      const explanation = String(q?.explanation || "").trim();

      if (!questionText) throw new Error(`AI question ${index + 1} is empty`);
      if (options.length !== 4 || options.some((option) => !option)) {
        throw new Error(`AI question ${index + 1} must have exactly 4 filled options`);
      }
      if (new Set(options.map((option) => option.toLowerCase())).size !== 4) {
        throw new Error(`AI question ${index + 1} contains duplicate options`);
      }
      if (!Number.isInteger(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex > 3) {
        throw new Error(`AI question ${index + 1} has an invalid correct answer`);
      }

      return {
        questionText,
        options,
        correctAnswerIndex,
        explanation,
        timeLimit: timer,
      };
    });

    const title = String(generated.title || `${cleanTopic} Quiz`).trim().slice(0, 150);
    const description = String(generated.description || `AI-generated quiz about ${cleanTopic}.`).trim().slice(0, 1000);

    res.json({
      title: title || `${cleanTopic} Quiz`,
      description,
      topic: cleanTopic.slice(0, 100),
      difficulty: cleanDifficulty,
      creationMethod: "ai",
      status: "draft",
      timePerQuestion: timer,
      questions,
    });
  } catch (err) {
    console.error("Gemini quiz generation error:", err.message);
    res.status(502).json({ message: "AI quiz generation failed. Please try again." });
  }
});


// HOST a quiz draft directly without saving it to the Quiz collection.
router.post("/host-draft", authMiddleware, async (req, res) => {
  try {
    const data = normalizeQuizBody({ ...req.body, status: "draft" });

    const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let roomCode;
    do {
      roomCode = Array.from(
        { length: 6 },
        () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
      ).join("");
    } while (await Room.exists({ roomCode }));

    const room = await Room.create({
      roomCode,
      host: req.user.id,
      hostName: req.user.name,
      questions: data.questions.map((q) => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        timeLimit: q.timeLimit,
      })),
    });

    res.status(201).json({ roomCode: room.roomCode });
  } catch (err) {
    console.error("Host draft quiz error:", err);
    res.status(400).json({ message: err.message || "Could not host quiz" });
  }
});

// Submit a temporary quiz session without creating a saved Quiz document.
router.post("/submit-draft", authMiddleware, async (req, res) => {
  try {
    const { category, answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "No answers submitted" });
    }

    let score = 0;
    const breakdown = answers.map((answer) => {
      const selectedIndex = Number(answer.selectedIndex);
      const correctAnswerIndex = Number(answer.correctAnswerIndex);
      const isCorrect = selectedIndex === correctAnswerIndex;
      if (isCorrect) score += 1;

      return {
        questionText: String(answer.questionText || ""),
        selectedIndex,
        correctAnswerIndex,
        isCorrect,
      };
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
    console.error("Draft quiz submit error:", err);
    res.status(500).json({ message: "Server error submitting quiz" });
  }
});

// GET one quiz owned by the authenticated user
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    console.error("Get quiz error:", err);
    res.status(400).json({ message: "Invalid quiz ID" });
  }
});

// CREATE a saved quiz/draft
router.post("/", authMiddleware, async (req, res) => {
  try {
    const data = normalizeQuizBody(req.body);
    const quiz = await Quiz.create({ ...data, ownerId: req.user.id });
    res.status(201).json(quiz);
  } catch (err) {
    console.error("Create quiz error:", err);
    res.status(400).json({ message: err.message || "Invalid quiz data" });
  }
});

// UPDATE only the owner's quiz
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const data = normalizeQuizBody(req.body);
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      data,
      { new: true, runValidators: true }
    );

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    console.error("Update quiz error:", err);
    res.status(400).json({ message: err.message || "Could not update quiz" });
  }
});

// DELETE only the owner's quiz
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Existing rooms/results are intentionally not deleted here.
    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    console.error("Delete quiz error:", err);
    res.status(400).json({ message: "Invalid quiz ID" });
  }
});

// DUPLICATE only the owner's quiz
router.post("/:id/duplicate", authMiddleware, async (req, res) => {
  try {
    const source = await Quiz.findOne({ _id: req.params.id, ownerId: req.user.id }).lean();
    if (!source) return res.status(404).json({ message: "Quiz not found" });

    const duplicate = await Quiz.create({
      ownerId: req.user.id,
      title: `${source.title} (Copy)`,
      description: source.description,
      topic: source.topic,
      difficulty: source.difficulty,
      creationMethod: source.creationMethod,
      status: "draft",
      timePerQuestion: source.timePerQuestion,
      questions: source.questions.map(({ _id, ...question }) => question),
    });

    res.status(201).json(duplicate);
  } catch (err) {
    console.error("Duplicate quiz error:", err);
    res.status(400).json({ message: err.message || "Could not duplicate quiz" });
  }
});

// HOST a saved quiz by creating a normal existing Room snapshot.
router.post("/:id/host", authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (!quiz.questions.length) return res.status(400).json({ message: "Quiz has no questions" });

    const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let roomCode;
    do {
      roomCode = Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
    } while (await Room.exists({ roomCode }));

    const room = await Room.create({
      roomCode,
      host: req.user.id,
      hostName: req.user.name,
      questions: quiz.questions.map((q) => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        timeLimit: q.timeLimit,
      })),
    });

    quiz.status = "ready";
    await quiz.save();

    res.status(201).json({ roomCode: room.roomCode, quizId: quiz._id });
  } catch (err) {
    console.error("Host saved quiz error:", err);
    res.status(500).json({ message: "Server error hosting quiz" });
  }
});

module.exports = router;
