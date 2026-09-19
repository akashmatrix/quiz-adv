const express = require("express");
const Room = require("../models/Room");
const Question = require("../models/Question");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Avoid confusing characters like 0/O and 1/I in the room code
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode() {
  let code = "";

  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[
      Math.floor(Math.random() * CODE_CHARS.length)
    ];
  }

  return code;
}

// HOST: Create room + save questions in MongoDB
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: "At least 1 question is required",
      });
    }

    // Validate all questions
    for (const q of questions) {
      if (
        !q.questionText ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        q.options.some(
          (option) =>
            typeof option !== "string" || !option.trim()
        ) ||
        q.correctAnswerIndex === undefined ||
        q.correctAnswerIndex < 0 ||
        q.correctAnswerIndex > 3
      ) {
        return res.status(400).json({
          message:
            "Each question needs text, 4 filled options and a correct answer",
        });
      }

      // Set default time limit
      if (
        !q.timeLimit ||
        q.timeLimit < 10 ||
        q.timeLimit > 30
      ) {
        q.timeLimit = 20;
      }
    }

    // Generate a unique room code
    let roomCode;
    let existing = true;

    while (existing) {
      roomCode = generateRoomCode();
      existing = await Room.findOne({ roomCode });
    }

    // Save questions separately in Question collection
    const savedQuestions = await Question.insertMany(
      questions.map((q) => ({
        category: q.category || "General",
        questionText: q.questionText.trim(),
        options: q.options.map((option) => option.trim()),
        correctAnswerIndex: q.correctAnswerIndex,
        difficulty: q.difficulty || "medium",
      }))
    );

    // Create the live room using the same questions
    const room = await Room.create({
      roomCode,
      host: req.user.id,
      hostName: req.user.name,
      questions,
    });

    res.status(201).json({
      message: "Room created and questions saved successfully",
      roomCode: room.roomCode,
      savedQuestions: savedQuestions.length,
    });
  } catch (err) {
    console.error("Room creation error:", err);

    res.status(500).json({
      message: "Server error creating room",
      error: err.message,
    });
  }
});

// Public: basic room info lookup
router.get("/:roomCode", async (req, res) => {
  try {
    const room = await Room.findOne({
      roomCode: req.params.roomCode.toUpperCase(),
    }).select("roomCode hostName status questions");

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    res.json({
      roomCode: room.roomCode,
      hostName: room.hostName,
      status: room.status,
      totalQuestions: room.questions.length,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;