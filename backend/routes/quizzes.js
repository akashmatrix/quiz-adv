const express = require("express");
const Quiz = require("../models/Quiz");
const Room = require("../models/Room");
const Result = require("../models/Result");
const RoomResult = require("../models/RoomResult");
const authMiddleware = require("../middleware/auth");
const { GoogleGenAI, createUserContent, createPartFromUri } = require("@google/genai");
const fs = require("fs");
const os = require("os");
const path = require("path");

const router = express.Router();

// Keep complete question-by-question review data for the newest 7 attempts.
// Older attempts remain as lightweight history records with score/rank/points.
async function trimDetailedHistory(userId) {
  const results = await Result.find({ user: userId })
    .sort({ createdAt: -1, _id: -1 })
    .select("_id")
    .lean();

  const olderIds = results.slice(7).map((item) => item._id);
  if (!olderIds.length) return;

  await Result.updateMany(
    { _id: { $in: olderIds }, user: userId },
    {
      $set: {
        breakdown: [],
        detailsRetained: false,
      },
    }
  );
}

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
      imageUrl: String(q.imageUrl || "").trim(),
      imagePrompt: String(q.imagePrompt || "").trim().slice(0, 5000),
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

// Generate a quiz with Gemini (nothing is saved automatically)
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

    // Repeated AI quiz creation should not keep asking the model the same questions.
    // We only use the user's previously saved quizzes, so one user's history does not
    // leak into another user's generation context.
    const escapedTopic = cleanTopic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const previousQuizzes = await Quiz.find({
      ownerId: req.user.id,
      topic: { $regex: new RegExp(`^${escapedTopic}$`, "i") },
      difficulty: cleanDifficulty,
      creationMethod: "ai",
    })
      .sort({ createdAt: -1 })
      .select("questions.questionText questions.options questions.explanation")
      .limit(20)
      .lean();

    // Keep the prompt context bounded, but keep exact-duplicate checking against
    // every saved question we fetched. We do NOT try to make every question
    // semantically different: similar/related questions are allowed.
    const previousQuestions = previousQuizzes
      .flatMap((quiz) => quiz.questions || [])
      .map((q) => ({
        questionText: String(q.questionText || "").trim(),
        options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
      }))
      .filter((q) => q.questionText);

    // Only the most recent questions are sent to Gemini so repeated generations
    // do not make the prompt grow without limit. Exact duplicates are still
    // checked against the complete fetched set below.
    const previousQuestionsForPrompt = previousQuestions.slice(0, 40);

    const variationStyles = [
      "conceptual understanding",
      "code/output based",
      "real-world scenario/application",
      "debugging/error diagnosis",
      "comparison/distinction",
      "reasoning/why-how",
      "best-practice/design choice",
      "short case study",
    ];

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

    const normalizeText = (value) => String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const meaningfulTokens = (value) => new Set(
      normalizeText(value)
        .split(" ")
        .filter((word) => word.length > 2 && !new Set([
          "what", "which", "where", "when", "why", "how", "does", "this", "that",
          "these", "those", "from", "with", "into", "used", "use", "following", "given",
          "true", "false", "correct", "best", "most", "least", "about", "question",
        ]).has(word))
    );

    const similarity = (a, b) => {
      const left = meaningfulTokens(a);
      const right = meaningfulTokens(b);
      if (!left.size || !right.size) return normalizeText(a) === normalizeText(b) ? 1 : 0;
      let intersection = 0;
      for (const token of left) if (right.has(token)) intersection += 1;
      return intersection / (left.size + right.size - intersection);
    };

    // Important: similarity is intentionally NOT used as a blocker.
    // Two questions can test the same concept in different ways, and that is
    // valid variety for a repeated quiz on the same topic. Only an exact
    // normalized question is rejected.
    const isExactDuplicateQuestion = (candidate, existing) => {
      const normalizedCandidate = normalizeText(candidate);
      return existing.some((old) => normalizeText(old) === normalizedCandidate);
    };

    let previousContext = "No previous saved AI questions exist for this topic.";
    if (previousQuestionsForPrompt.length) {
      previousContext = previousQuestionsForPrompt
        .map((q, index) => `${index + 1}. ${q.questionText}`)
        .join("\n");
    }

    const generateOnce = async (retryNumber) => {
      const retryInstruction = retryNumber > 0
        ? `This is regeneration attempt ${retryNumber}. One or more generated questions were EXACT repeats of earlier questions. Keep the same requested topic and replace only the exact repeats with fresh questions from that same topic. Similar concepts and related questions are allowed.`
        : "";

      const prompt = `You are a high-quality quiz-generation engine.
Create a ${cleanDifficulty} difficulty multiple-choice quiz about: ${cleanTopic}.
Generate exactly ${count} questions.
The application timer for every question is ${timer} seconds.

VARIETY + TOPIC FIDELITY REQUIREMENT:
- The requested topic is a HARD boundary: ${cleanTopic}. Every question must directly test, apply, or reason about this topic.
- NEVER switch to a different subject, neighboring chapter, broad category, or unrelated subtopic just to create variety.
- If the topic has limited room for novelty, stay within the topic and create a different scenario, wording, example, code/output, application, comparison, or reasoning question.
- This may be the user's second, third, or later quiz on the same topic. Some questions may be similar or closely related; that is acceptable.
- Avoid ONLY exact repeats of previous questions. Do not treat a merely similar question as a duplicate.
- Mix question styles where appropriate: ${variationStyles.join(", ")}. Variety means different ways of testing the SAME requested topic, not adding other topics.
- Keep the requested difficulty consistent.
${retryInstruction}

PREVIOUS SAVED QUESTIONS (reference only; stay within the requested topic):
${previousContext}

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

      let generated;
      try {
        generated = JSON.parse(response.text);
      } catch (parseError) {
        throw new Error("AI returned an invalid quiz format. Please try again.");
      }

      if (!generated || !Array.isArray(generated.questions) || generated.questions.length !== count) {
        throw new Error(`AI generated an invalid number of questions. Please try again.`);
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
          imageUrl: "",
          timeLimit: timer,
        };
      });

      const allExisting = previousQuestions.map((q) => q.questionText);
      const seenThisQuiz = [];
      const duplicates = [];
      for (const question of questions) {
        if (isExactDuplicateQuestion(question.questionText, allExisting) || isExactDuplicateQuestion(question.questionText, seenThisQuiz)) {
          duplicates.push(question.questionText);
        }
        seenThisQuiz.push(question.questionText);
      }

      return {
        generated,
        questions,
        duplicates,
      };
    };

    let result = await generateOnce(0);
    const regenerated = result.duplicates.length > 0;
    if (regenerated) {
      result = await generateOnce(1);
    }

    if (result.duplicates.length) {
      return res.status(502).json({
        message: "AI repeated one or more exact questions from an earlier quiz. Please generate again; related or similar questions are allowed, but exact repeats are not.",
      });
    }

    const generated = result.generated;
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
      questions: result.questions,
      variety: {
        previousSavedQuestionCount: previousQuestions.length,
        previousQuestionsUsedAsPromptContext: previousQuestionsForPrompt.length,
        duplicateRule: "exact-only",
        topicLocked: true,
        duplicateCheckPassed: true,
        regenerated,
      },
    });
  } catch (err) {
    console.error("Gemini quiz generation error:", err);
    const detail = String(err?.message || "Unknown AI provider error").slice(0, 500);
    res.status(502).json({ message: `AI quiz generation failed: ${detail}` });
  }
});



// Generate a quiz from an uploaded PDF/PPT/PPTX document.
// The file is used only as AI input; the generated quiz is NOT auto-saved.
router.post("/document/generate", authMiddleware, async (req, res) => {
  let tempPath = "";
  let uploadedFileName = "";

  try {
    const { fileName, mimeType, fileData, questionCount, difficulty, timePerQuestion, instructions } = req.body;
    const cleanFileName = String(fileName || "").trim();
    const cleanMimeType = String(mimeType || "").trim().toLowerCase();
    const count = Number(questionCount);
    const cleanDifficulty = String(difficulty || "medium").toLowerCase();
    const timer = Number(timePerQuestion);

    const allowedTypes = new Set([
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ]);
    const extension = path.extname(cleanFileName).toLowerCase();
    const allowedExtensions = new Set([".pdf", ".ppt", ".pptx"]);

    if (!cleanFileName || !allowedExtensions.has(extension) || !allowedTypes.has(cleanMimeType)) {
      return res.status(400).json({ message: "Only PDF, PPT, and PPTX files are supported." });
    }
    if (!fileData || typeof fileData !== "string") {
      return res.status(400).json({ message: "Document file data is required." });
    }
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      return res.status(400).json({ message: "Question count must be between 1 and 50." });
    }
    if (!VALID_DIFFICULTIES.includes(cleanDifficulty)) {
      return res.status(400).json({ message: "Invalid difficulty." });
    }
    if (!Number.isInteger(timer) || timer < 2 || timer > 120) {
      return res.status(400).json({ message: "Time per question must be between 2 and 120 seconds." });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "AI service is not configured on the server." });
    }

    const rawBase64 = fileData.replace(/^data:[^;]+;base64,/, "");
    const bytes = Buffer.from(rawBase64, "base64");
    if (!bytes.length) return res.status(400).json({ message: "The uploaded document is empty." });
    if (bytes.length > 10 * 1024 * 1024) {
      return res.status(400).json({ message: "Document size must be 10 MB or less." });
    }

    tempPath = path.join(os.tmpdir(), `quiz-document-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
    fs.writeFileSync(tempPath, bytes);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
    const uploaded = await ai.files.upload({
      file: tempPath,
      config: { mimeType: cleanMimeType, displayName: cleanFileName },
    });
    uploadedFileName = uploaded.name;

    const prompt = `You are an exam-quiz generator. Read the uploaded document carefully and create exactly ${count} multiple-choice questions from the DOCUMENT CONTENT ONLY.

Difficulty: ${cleanDifficulty}.
Time per question: ${timer} seconds.
Additional instructions: ${String(instructions || "").trim() || "None"}.

STRICT RULES:
1. Generate exactly ${count} distinct questions. Never return fewer than ${count}.
2. Questions must test actual facts, concepts, definitions, examples, processes, comparisons, or details explicitly present in the document.
3. Do NOT use generic wording such as "According to the document...", "Based on the document...", "What does the document say...", or "What is mentioned in the document...". Ask the question directly as a normal exam question.
4. Do not invent facts that are not supported by the document.
5. Do not repeat questions or options.
6. Each question must have exactly 4 plausible options and exactly one correct answer.
7. Keep questions clear and natural for a college/student quiz.
8. Use the terminology used in the document where appropriate.
9. Explanations must briefly explain the correct answer using the document's content.
10. Return ONLY the requested JSON object. No markdown, commentary, or extra text.`;

    const response = await ai.models.generateContent({
      model,
      contents: createUserContent([
        createPartFromUri(uploaded.uri, uploaded.mimeType || cleanMimeType),
        prompt,
      ]),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            topic: { type: "string" },
            questions: {
              type: "array",
              minItems: count,
              maxItems: count,
              items: {
                type: "object",
                properties: {
                  questionText: { type: "string" },
                  options: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
                  correctAnswerIndex: { type: "integer", minimum: 0, maximum: 3 },
                  explanation: { type: "string" },
                },
                required: ["questionText", "options", "correctAnswerIndex", "explanation"],
              },
            },
          },
          required: ["title", "description", "topic", "questions"],
        },
      },
    });

    let generated;
    try { generated = JSON.parse(response.text); }
    catch { return res.status(502).json({ message: "AI returned an invalid quiz format. Please try again." }); }

    if (!generated || !Array.isArray(generated.questions) || generated.questions.length !== count) {
      return res.status(502).json({ message: `AI generated ${generated?.questions?.length || 0} questions instead of ${count}. Please try again.` });
    }

    const questions = generated.questions.map((q, index) => {
      const questionText = String(q?.questionText || "").trim();
      const options = Array.isArray(q?.options) ? q.options.map((o) => String(o || "").trim()) : [];
      const correctAnswerIndex = Number(q?.correctAnswerIndex);
      const explanation = String(q?.explanation || "").trim();
      if (!questionText || options.length !== 4 || options.some((o) => !o)) throw new Error(`Invalid generated question ${index + 1}`);
      if (new Set(options.map((o) => o.toLowerCase())).size !== 4) throw new Error(`Generated question ${index + 1} has duplicate options`);
      if (!Number.isInteger(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex > 3) throw new Error(`Invalid answer for question ${index + 1}`);
      return { questionText, options, correctAnswerIndex, explanation, imageUrl: "", timeLimit: timer };
    });

    res.json({
      title: String(generated.title || path.basename(cleanFileName, extension)).trim().slice(0, 150),
      description: String(generated.description || `Quiz generated from ${cleanFileName}.`).trim().slice(0, 1000),
      topic: String(generated.topic || path.basename(cleanFileName, extension)).trim().slice(0, 100),
      difficulty: cleanDifficulty,
      creationMethod: extension === ".pdf" ? "pdf" : "ppt",
      status: "draft",
      timePerQuestion: timer,
      questions,
    });
  } catch (err) {
    console.error("Document quiz generation error:", err.message);
    res.status(502).json({ message: "Could not generate quiz from this document. Please try another file or try again." });
  } finally {
    if (uploadedFileName && process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        await ai.files.delete({ name: uploadedFileName });
      } catch (cleanupError) {
        console.warn("Gemini file cleanup failed:", cleanupError.message);
      }
    }
    if (tempPath) {
      try { fs.unlinkSync(tempPath); } catch { }
    }
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
      title: data.title,
      quizId: req.body.quizId || undefined,
      questions: data.questions.map((q) => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        imageUrl: q.imageUrl || "",
        imagePrompt: q.imagePrompt || "",
        timeLimit: q.timeLimit,
        explanation: q.explanation || "",
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

      const options = Array.isArray(answer.options)
        ? answer.options.map((option) => String(option || ""))
        : [];

      return {
        questionText: String(answer.questionText || ""),
        options,
        selectedIndex,
        correctAnswerIndex,
        imageUrl: String(answer.imageUrl || ""),
        explanation: String(answer.explanation || ""),
        isCorrect,
      };
    });

    const result = await Result.create({
      user: req.user.id,
      score,
      points: score,
      totalQuestions: answers.length,
      category: category || "General",
      quizTitle: String(req.body.quizTitle || category || "General Quiz").trim(),
      quizId: req.body.quizId || undefined,
      source: req.body.quizId ? "saved-quiz" : "solo",
      detailsRetained: true,
      breakdown,
    });

    await trimDetailedHistory(req.user.id);

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

// PARTICIPANT HISTORY: solo + multiplayer attempts.
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const [solo, multiplayer] = await Promise.all([
      Result.find({ user: req.user.id })
        .sort({ createdAt: -1, _id: -1 })
        .select("quizId quizTitle score points rank totalQuestions category source detailsRetained createdAt")
        .lean(),
      RoomResult.find({ user: req.user.id })
        .sort({ createdAt: -1, _id: -1 })
        .select("room roomCode participantName score points correctAnswers totalQuestions rank detailsRetained createdAt breakdown")
        .lean(),
    ]);

    const soloItems = solo.map((item) => ({
      ...item,
      kind: "solo",
      historyId: item._id,
      points: item.points ?? item.score ?? 0,
    }));

    const roomItems = multiplayer.map((item) => ({
      ...item,
      kind: "multiplayer",
      historyId: item._id,
      quizTitle: item.roomCode ? `Live Quiz • ${item.roomCode}` : "Live Quiz",
      points: item.score ?? 0,
      score: item.correctAnswers ?? 0,
      category: "Multiplayer",
      source: "multiplayer",
      detailsRetained: Boolean(item.breakdown?.length),
    }));

    const merged = [...soloItems, ...roomItems]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Never expose the room breakdown in the list payload.
    res.json(merged.map(({ breakdown, ...item }) => item));
  } catch (err) {
    console.error("Quiz history error:", err);
    res.status(500).json({ message: "Server error fetching quiz history" });
  }
});

// Detailed multiplayer review.
router.get("/history/room/:id", authMiddleware, async (req, res) => {
  try {
    const result = await RoomResult.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).lean();

    if (!result) return res.status(404).json({ message: "Multiplayer history item not found" });
    if (!result.breakdown?.length) {
      return res.status(410).json({
        message: "Detailed review is not available for this older multiplayer attempt. Score, rank and points are still available.",
        summaryOnly: true,
      });
    }

    res.json({
      ...result,
      kind: "multiplayer",
      quizTitle: `Live Quiz • ${result.roomCode}`,
      points: result.score,
      score: result.correctAnswers,
    });
  } catch (err) {
    console.error("Multiplayer history detail error:", err);
    res.status(400).json({ message: "Invalid multiplayer history ID" });
  }
});

// Detailed solo review is available only while the attempt is inside the newest 7.
router.get("/history/:id", authMiddleware, async (req, res) => {
  try {
    const result = await Result.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).lean();

    if (!result) return res.status(404).json({ message: "History item not found" });
    if (!result.detailsRetained) {
      return res.status(410).json({
        message: "Detailed review expired. Score, points and rank are still available in history.",
        summaryOnly: true,
      });
    }

    res.json({ ...result, kind: "solo" });
  } catch (err) {
    console.error("Quiz history detail error:", err);
    res.status(400).json({ message: "Invalid history ID" });
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
      title: quiz.title,
      quizId: quiz._id,
      questions: quiz.questions.map((q) => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        imageUrl: q.imageUrl || "",
        imagePrompt: q.imagePrompt || "",
        timeLimit: q.timeLimit,
        explanation: q.explanation || "",
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
