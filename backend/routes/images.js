const express = require("express");
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/auth");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function bucket() {
  if (!mongoose.connection.db) throw new Error("Database is not ready");
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "quizImages" });
}

function publicImageUrl(req, id) {
  return `${req.protocol}://${req.get("host")}/api/images/${id}`;
}

function parseDataUrl(value) {
  const match = String(value || "").match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) throw new Error("Invalid image data");
  return { mimeType: match[1].toLowerCase(), buffer: Buffer.from(match[2].replace(/\s/g, ""), "base64") };
}

function uploadBuffer(buffer, filename, mimeType, metadata = {}) {
  return new Promise((resolve, reject) => {
    const grid = bucket();
    const upload = grid.openUploadStream(filename, {
      contentType: mimeType,
      metadata: { ...metadata, app: "quiz-adv" },
    });
    upload.on("error", reject);
    upload.on("finish", () => resolve(upload.id));
    upload.end(buffer);
  });
}

// Upload a user-selected question image.
router.post("/upload", authMiddleware, async (req, res) => {
  try {
    const { fileName, fileData } = req.body;
    const parsed = parseDataUrl(fileData);
    if (!ALLOWED_MIME.has(parsed.mimeType)) return res.status(400).json({ message: "Only JPG, PNG and WEBP images are supported." });
    if (!parsed.buffer.length) return res.status(400).json({ message: "Image is empty." });
    if (parsed.buffer.length > MAX_IMAGE_BYTES) return res.status(400).json({ message: "Image size must be 5 MB or less." });

    const safeName = String(fileName || "question-image").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const id = await uploadBuffer(parsed.buffer, `${Date.now()}-${safeName}`, parsed.mimeType, { ownerId: String(req.user.id), source: "manual-upload" });
    res.status(201).json({ imageUrl: publicImageUrl(req, id), imageId: String(id) });
  } catch (err) {
    console.error("Question image upload error:", err);
    res.status(400).json({ message: err.message || "Could not upload image." });
  }
});

// Generate a focused visual prompt from the quiz question before image generation.
router.post("/prompt", authMiddleware, async (req, res) => {
  try {
    const questionText = String(req.body.questionText || "").trim();
    const options = Array.isArray(req.body.options)
      ? req.body.options.map((x) => String(x || "").trim()).filter(Boolean)
      : [];
    const correctAnswerIndex = Number.isInteger(req.body.correctAnswerIndex)
      ? req.body.correctAnswerIndex
      : null;
    const context = String(req.body.context || "").trim();

    if (!questionText) {
      return res.status(400).json({ message: "Question text is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "AI prompt service is not configured. Add GEMINI_API_KEY to backend .env.",
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const correctAnswer =
      correctAnswerIndex !== null && options[correctAnswerIndex]
        ? options[correctAnswerIndex]
        : "Not provided";

    const instruction = `You are an expert educational visual-designer creating a prompt for an image-generation model.

Analyze the quiz question deeply and write ONE precise image-generation prompt for the most relevant visual.
The visual must accurately represent the concept being tested, not merely decorate the question.

Rules:
- Identify the key concept, object, process, structure, relationship, formula, scene, or diagram needed to understand the question.
- If the question is about a technical concept, prefer a technically accurate educational diagram/illustration.
- If it is about science, geography, history, biology, physics, chemistry, etc., depict the specific subject accurately.
- If a chart, circuit, graph, molecule, code concept, algorithm, architecture, anatomy, map, or mathematical object is relevant, explicitly describe its important visual elements.
- Use the correct answer internally to improve factual accuracy, but NEVER write the correct answer as text in the image and do not make the image an obvious answer-reveal.
- Do not include question text, answer choices, captions, labels, watermarks, logos, or decorative unrelated elements unless a label is essential to a technically correct diagram.
- Use a clean college textbook / modern educational infographic style.
- Prefer a 16:9 composition with the important subject centered and clearly visible.
- Return ONLY the final image prompt, with no preface, bullets, quotation marks, or explanation.

Question: ${questionText}
Options: ${options.join(" | ") || "None"}
Correct answer (internal reference only): ${correctAnswer}
Context: ${context || "General educational quiz"}`;

    const response = await ai.models.generateContent({
      model,
      contents: instruction,
    });

    const prompt = String(response.text || "")
      .trim()
      .replace(/^```(?:text)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    if (!prompt) {
      return res.status(502).json({
        message: "AI could not create a useful image prompt. Please try again.",
      });
    }

    return res.json({ prompt, provider: "gemini", model });
  } catch (err) {
    console.error("AI image prompt generation error:", err);
    return res.status(502).json({
      message: "Could not create an AI image prompt. Please try again.",
    });
  }
});

// Generate an image for a specific question and persist it in GridFS.
// Uses Hugging Face Inference Providers instead of Gemini image generation.
router.post("/generate", authMiddleware, async (req, res) => {
  try {
    const questionText = String(req.body.questionText || "").trim();
    const options = Array.isArray(req.body.options)
      ? req.body.options.map((x) => String(x || "").trim()).filter(Boolean)
      : [];
    const context = String(req.body.context || "").trim();
    const customPrompt = String(req.body.prompt || "").trim();

    if (!questionText && !customPrompt) {
      return res.status(400).json({ message: "Question text or image prompt is required." });
    }

    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      return res.status(500).json({
        message: "AI image service is not configured. Add HF_TOKEN to backend .env.",
      });
    }

    const model = process.env.HF_IMAGE_MODEL || "stabilityai/stable-diffusion-3-medium-diffusers";
    const provider = process.env.HF_IMAGE_PROVIDER || "hf-inference";
    const prompt = customPrompt || `Create a clean educational quiz illustration for this question. Accurately represent the key concept being tested, without revealing the correct answer through text. Do not add answer choices, captions, watermarks, logos, or unrelated text. Prefer a technically accurate college textbook/infographic style.\n\nQuestion: ${questionText}\nOptions: ${options.join(" | ")}\nContext: ${context || "General educational quiz"}`;

    const endpoint = `https://router.huggingface.co/${provider}/models/${encodeURIComponent(model)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          width: 1024,
          height: 576,
        },
      }),
    });

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Hugging Face image generation error:", response.status, errorText);

      if (response.status === 401 || response.status === 403) {
        return res.status(502).json({
          message: "Hugging Face authentication failed. Check HF_TOKEN and its Inference Providers permission.",
        });
      }
      if (response.status === 402) {
        return res.status(502).json({
          message: "Hugging Face free credits are exhausted. Please wait for the next credit period or add provider credits.",
        });
      }
      if (response.status === 429) {
        return res.status(429).json({
          message: "Hugging Face image generation is temporarily rate-limited. Please try again later.",
        });
      }
      return res.status(502).json({ message: "Free AI image generation failed. Please try again." });
    }

    if (!contentType.startsWith("image/")) {
      const unexpected = await response.text();
      console.error("Unexpected Hugging Face image response:", unexpected.slice(0, 1000));
      return res.status(502).json({ message: "AI provider did not return an image." });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
      return res.status(502).json({ message: "Generated image is invalid or too large." });
    }

    const mimeType = ALLOWED_MIME.has(contentType) ? contentType : "image/png";
    const extension = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/webp" ? "webp" : "png";
    const id = await uploadBuffer(
      buffer,
      `hf-ai-question-${Date.now()}.${extension}`,
      mimeType,
      { ownerId: String(req.user.id), source: "ai-generated", provider: "huggingface", model }
    );

    res.status(201).json({
      imageUrl: publicImageUrl(req, id),
      imageId: String(id),
      source: "ai",
      provider: "huggingface",
      model,
    });
  } catch (err) {
    console.error("AI question image generation error:", err);
    res.status(502).json({ message: "AI image generation failed. Please try again." });
  }
});

// Public image stream; the URL itself is the stored image reference.
router.get("/:id", async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const files = await bucket().find({ _id: id }).toArray();
    if (!files.length) return res.status(404).send("Image not found");
    const file = files[0];
    res.set("Content-Type", file.contentType || "image/png");
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    bucket().openDownloadStream(id).on("error", () => res.status(404).end()).pipe(res);
  } catch {
    res.status(400).send("Invalid image id");
  }
});

module.exports = router;
