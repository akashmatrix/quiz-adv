const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const Result = require("../models/Result");
const { generateQuizWithAI } = require("./ai/generateQuiz");

/**
 * Generate a new quiz via AI and persist it in MongoDB
 */
async function generateAndSaveQuiz(params, userId) {
  const {
    subject,
    topic,
    difficulty = "Medium",
    questionCount = 10,
    language = "English",
    questionType = "MCQ",
    timePerQuestion = 30,
    explanations = true,
    customInstructions = "",
    previousQuestions = [],
  } = params;

  if (!subject || !subject.trim()) {
    throw new Error("Subject is required to generate a quiz");
  }

  // 1. Generate quiz via AI provider
  const generated = await generateQuizWithAI({
    subject: subject.trim(),
    topic: (topic || "").trim(),
    difficulty,
    questionCount,
    language,
    questionType,
    timePerQuestion,
    explanations,
    customInstructions,
    previousQuestions,
  });

  // 2. Prepare questions for Quiz model
  const formattedQuestions = generated.questions.map((q) => ({
    questionText: q.questionText,
    options: q.options,
    correctAnswerIndex: q.correctAnswerIndex,
    explanation: q.explanation || "",
  }));

  // 3. Persist Quiz document
  const quiz = await Quiz.create({
    title: generated.title || `${subject} Quiz`,
    description: generated.description || `${difficulty} level quiz on ${subject}`,
    subject: subject.trim(),
    topic: (topic || "").trim(),
    difficulty,
    language,
    questionType,
    questionCount: formattedQuestions.length,
    timePerQuestion: Number(timePerQuestion) || 30,
    showExplanations: Boolean(explanations),
    customInstructions: customInstructions || "",
    questions: formattedQuestions,
    createdBy: userId || undefined,
    isPublic: true,
  });

  // 4. Also register questions in global Question collection for discovery
  try {
    await Question.insertMany(
      formattedQuestions.map((q) => ({
        category: subject.trim(),
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation,
        difficulty: difficulty.toLowerCase(),
      })),
      { ordered: false }
    );
  } catch (err) {
    // Non-fatal if some questions already exist
  }

  return quiz;
}

/**
 * Regenerate a quiz with identical preferences but strictly non-duplicate questions
 */
async function regenerateQuiz(previousQuizId, userId) {
  const previous = await Quiz.findById(previousQuizId);

  if (!previous) {
    throw new Error("Previous quiz not found to regenerate");
  }

  const previousQuestions = previous.questions.map((q) => q.questionText);

  return generateAndSaveQuiz(
    {
      subject: previous.subject,
      topic: previous.topic,
      difficulty: previous.difficulty,
      questionCount: previous.questionCount,
      language: previous.language,
      questionType: previous.questionType,
      timePerQuestion: previous.timePerQuestion,
      explanations: previous.showExplanations,
      customInstructions: previous.customInstructions,
      previousQuestions,
    },
    userId
  );
}

/**
 * Identify a user's weak areas based purely on stored MongoDB results
 */
async function getWeakAreas(userId) {
  const results = await Result.find({ user: userId }).sort({ createdAt: -1 }).limit(100).lean();

  if (!results || results.length === 0) {
    return {
      hasData: false,
      weakAreas: [],
      overallAccuracy: 0,
      totalQuizzes: 0,
    };
  }

  // Aggregate accuracy per subject/topic
  const topicStats = {};
  let totalScore = 0;
  let totalQuestions = 0;

  results.forEach((r) => {
    const key = r.topic ? `${r.subject || r.category} - ${r.topic}` : (r.subject || r.category || "General");
    if (!topicStats[key]) {
      topicStats[key] = {
        subject: r.subject || r.category || "General",
        topic: r.topic || "",
        totalQuestions: 0,
        correctAnswers: 0,
        attempts: 0,
      };
    }

    const qCount = Number(r.totalQuestions) || 0;
    const sCount = Number(r.score) || 0;

    topicStats[key].totalQuestions += qCount;
    topicStats[key].correctAnswers += sCount;
    topicStats[key].attempts += 1;

    totalScore += sCount;
    totalQuestions += qCount;
  });

  const areas = Object.values(topicStats).map((item) => {
    const accuracy = item.totalQuestions > 0 ? Math.round((item.correctAnswers / item.totalQuestions) * 100) : 0;
    return {
      ...item,
      accuracy,
      needsPractice: accuracy < 70,
    };
  });

  // Sort by lowest accuracy first
  areas.sort((a, b) => a.accuracy - b.accuracy);

  const weakAreas = areas.filter((a) => a.needsPractice);

  return {
    hasData: true,
    weakAreas: weakAreas.slice(0, 5),
    allAreas: areas,
    overallAccuracy: totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0,
    totalQuizzes: results.length,
  };
}

/**
 * Generate a personalized quiz focused specifically on the user's weakest area
 */
async function generateWeakAreaQuiz(userId) {
  const { hasData, weakAreas } = await getWeakAreas(userId);

  if (!hasData || weakAreas.length === 0) {
    throw new Error("No weak areas identified yet. Complete a few quizzes first!");
  }

  const target = weakAreas[0];

  return generateAndSaveQuiz(
    {
      subject: target.subject,
      topic: target.topic,
      difficulty: "Medium",
      questionCount: 10,
      language: "English",
      questionType: "MCQ",
      timePerQuestion: 30,
      explanations: true,
      customInstructions: `This is a targeted improvement quiz for a student who scored ${target.accuracy}% previously. Focus on conceptual clarity and common misconceptions.`,
    },
    userId
  );
}

module.exports = {
  generateAndSaveQuiz,
  regenerateQuiz,
  getWeakAreas,
  generateWeakAreaQuiz,
};
