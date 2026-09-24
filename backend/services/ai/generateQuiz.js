const aiProvider = require("./aiProvider");

/**
 * Clean raw model output to extract pure JSON
 */
function cleanJsonString(raw) {
  if (!raw) return "";
  let cleaned = raw.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/i, "");
  }

  // Find the first '{' and last '}'
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  return cleaned.trim();
}

/**
 * Validate and normalize quiz data returned by AI
 */
function validateAndNormalizeQuiz(data, requestedCount, questionType) {
  if (!data || typeof data !== "object") {
    throw new Error("AI response is not a valid JSON object");
  }

  const title = (data.title || "AI Generated Quiz").trim();
  const description = (data.description || "").trim();

  let rawQuestions = Array.isArray(data.questions) ? data.questions : [];
  if (rawQuestions.length === 0) {
    throw new Error("AI generated no questions");
  }

  const normalizedQuestions = [];
  const seenQuestionTexts = new Set();

  for (let i = 0; i < rawQuestions.length; i++) {
    const raw = rawQuestions[i];
    const text = (raw.questionText || raw.question || "").trim();

    if (!text || text.length < 5) continue;

    // Check duplicate questions
    const simplifiedText = text.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seenQuestionTexts.has(simplifiedText)) continue;
    seenQuestionTexts.add(simplifiedText);

    // Normalize options
    let options = Array.isArray(raw.options)
      ? raw.options.map((o) => String(o || "").trim()).filter(Boolean)
      : [];

    // True/False handling
    if (questionType === "True/False" && options.length === 0) {
      options = ["True", "False"];
    }

    if (options.length < 2) continue;

    // Remove duplicate options in the same question
    const uniqueOptions = [...new Set(options)];
    if (uniqueOptions.length < 2) continue;

    // Resolve correct answer index
    let correctIdx = -1;

    if (typeof raw.correctAnswerIndex === "number" && raw.correctAnswerIndex >= 0 && raw.correctAnswerIndex < uniqueOptions.length) {
      correctIdx = raw.correctAnswerIndex;
    } else if (raw.correctAnswer) {
      const matchIdx = uniqueOptions.findIndex(
        (opt) => opt.toLowerCase().trim() === String(raw.correctAnswer).toLowerCase().trim()
      );
      if (matchIdx !== -1) {
        correctIdx = matchIdx;
      }
    }

    // Default to 0 if not resolvable
    if (correctIdx === -1) {
      correctIdx = 0;
    }

    const explanation = (raw.explanation || `The correct answer is "${uniqueOptions[correctIdx]}".`).trim();

    normalizedQuestions.push({
      questionText: text,
      options: uniqueOptions,
      correctAnswerIndex: correctIdx,
      correctAnswer: uniqueOptions[correctIdx],
      explanation,
    });
  }

  if (normalizedQuestions.length === 0) {
    throw new Error("Failed to extract valid questions from AI response");
  }

  return {
    title,
    description,
    questions: normalizedQuestions,
  };
}

/**
 * Generate a complete quiz from AI with structured output
 */
async function generateQuizWithAI({
  subject,
  topic,
  difficulty = "Medium",
  questionCount = 10,
  language = "English",
  questionType = "MCQ",
  timePerQuestion = 30,
  explanations = true,
  customInstructions = "",
  previousQuestions = [], // For generating similar/non-duplicate quizzes
}) {
  const count = Math.min(Math.max(Number(questionCount) || 10, 5), 25);

  const systemPrompt = `You are an expert educational AI quiz architect.
Your job is to generate high quality, academically rigorous, and accurate quizzes.
You MUST output strictly valid JSON with no conversational text or preamble.

JSON SCHEMA:
{
  "title": "Concise quiz title",
  "description": "Short 1-line description",
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact matching string from options",
      "explanation": "Clear educational explanation why this answer is correct"
    }
  ]
}

CRITICAL RULES:
1. Return EXACTLY ${count} questions.
2. For MCQ: Exactly 4 distinct, plausible options.
3. For True/False: Exactly 2 options: ["True", "False"].
4. For Mixed: A balanced mix of MCQ and True/False questions.
5. "correctAnswer" MUST be an exact string that appears in the "options" list.
6. Question language must be strictly: ${language}.
7. Difficulty level must be: ${difficulty}.
8. Ensure questions are accurate with zero ambiguity or answer leakage.
9. Every question MUST include a detailed, helpful educational explanation.
${previousQuestions.length > 0 ? `10. DO NOT repeat or duplicate any of these previously used questions: ${JSON.stringify(previousQuestions.slice(0, 20))}` : ""}`;

  const userPrompt = `Generate a ${difficulty} quiz on:
Subject: ${subject}
${topic ? `Topic/Specifics: ${topic}` : ""}
Language: ${language}
Question Type: ${questionType}
Number of questions: ${count}
${customInstructions ? `Custom requirements: ${customInstructions}` : ""}

Return STRICT JSON according to the schema now.`;

  // Attempt 1
  let rawResponse;
  try {
    rawResponse = await aiProvider.generateCompletion(systemPrompt, userPrompt);
    const cleaned = cleanJsonString(rawResponse);
    const parsed = JSON.parse(cleaned);
    return validateAndNormalizeQuiz(parsed, count, questionType);
  } catch (err1) {
    console.warn("First AI generation attempt failed, retrying...", err1.message);

    // Attempt 2 (Retry with simplified prompt)
    try {
      const retryPrompt = `${userPrompt}\n\nCRITICAL: Respond ONLY with valid JSON. Do not include markdown fences or comments.`;
      const retryRaw = await aiProvider.generateCompletion(systemPrompt, retryPrompt);
      const cleaned = cleanJsonString(retryRaw);
      const parsed = JSON.parse(cleaned);
      return validateAndNormalizeQuiz(parsed, count, questionType);
    } catch (err2) {
      console.error("AI quiz generation retry failed:", err2.message);
      throw new Error(`AI generation failed: ${err2.message || err1.message}`);
    }
  }
}

module.exports = {
  generateQuizWithAI,
  cleanJsonString,
  validateAndNormalizeQuiz,
};
