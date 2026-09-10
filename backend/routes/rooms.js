const express = require("express");
const Room = require("../models/Room");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Avoid confusing characters like 0/O and 1/I in the room code
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

// HOST: create a room with custom questions (login required)
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "At least 1 question is required" });
    }

    for (const q of questions) {
      if (
        !q.questionText ||
        !q.options ||
        q.options.length !== 4 ||
        q.options.some((o) => !o || !o.trim()) ||
        q.correctAnswerIndex === undefined ||
        q.correctAnswerIndex < 0 ||
        q.correctAnswerIndex > 3
      ) {
        return res
          .status(400)
          .json({ message: "Each question needs text, 4 filled options and a correct answer" });
      }
      // Clamp time limit to the allowed 10-30 second range
      if (!q.timeLimit || q.timeLimit < 10 || q.timeLimit > 30) {
        q.timeLimit = 20;
      }
    }

    // Generate a unique room code (retry on the rare collision)
    let roomCode;
    let existing = true;
    while (existing) {
      roomCode = generateRoomCode();
      existing = await Room.findOne({ roomCode });
    }

    const room = await Room.create({
      roomCode,
      host: req.user.id,
      hostName: req.user.name,
      questions,
    });

    res.status(201).json({ roomCode: room.roomCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error creating room" });
  }
});

// Public: basic room info lookup (used to validate a room code before joining, optional)
router.get("/:roomCode", async (req, res) => {
  try {
    const room = await Room.findOne({
      roomCode: req.params.roomCode.toUpperCase(),
    }).select("roomCode hostName status questions");

    if (!room) return res.status(404).json({ message: "Room not found" });

    res.json({
      roomCode: room.roomCode,
      hostName: room.hostName,
      status: room.status,
      totalQuestions: room.questions.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
