const express = require("express");
const Room = require("../models/Room");
const Question = require("../models/Question");
const RoomResult = require("../models/RoomResult");
const Result = require("../models/Result");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode() {
  let code = "";

  for (let i = 0; i < 6; i++) {
    code +=
      CODE_CHARS[
      Math.floor(Math.random() * CODE_CHARS.length)
      ];
  }

  return code;
}

/*
====================================================
HOST: CREATE ROOM + SAVE QUESTIONS
====================================================
*/
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: "At least 1 question is required",
      });
    }

    // Validate questions
    for (const q of questions) {
      if (
        !q.questionText ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        q.options.some(
          (option) =>
            typeof option !== "string" ||
            !option.trim()
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

      // Default time limit
      if (
        !q.timeLimit ||
        q.timeLimit < 10 ||
        q.timeLimit > 30
      ) {
        q.timeLimit = 20;
      }
    }

    // Generate unique room code
    let roomCode;
    let existing = true;

    while (existing) {
      roomCode = generateRoomCode();

      existing = await Room.findOne({
        roomCode,
      });
    }

    // Save questions permanently
    const savedQuestions = await Question.insertMany(
      questions.map((q) => ({
        category: q.category || "General",
        questionText: q.questionText.trim(),
        options: q.options.map((option) =>
          option.trim()
        ),
        correctAnswerIndex: q.correctAnswerIndex,
        difficulty: q.difficulty || "medium",
      }))
    );

    // Create room
    const room = await Room.create({
      roomCode,
      host: req.user.id,
      hostName: req.user.name,
      questions,
    });

    console.log(
      "ROOM CREATED:",
      room.roomCode
    );

    console.log(
      "QUESTIONS SAVED IN QUESTION COLLECTION:",
      savedQuestions.length
    );

    res.status(201).json({
      message:
        "Room created and questions saved successfully",

      roomCode: room.roomCode,

      savedQuestions:
        savedQuestions.length,
    });
  } catch (err) {
    console.error(
      "Room creation error:",
      err
    );

    res.status(500).json({
      message:
        "Server error creating room",

      error: err.message,
    });
  }
});

/*
====================================================
LOGGED-IN USER: ALL QUIZ RESULTS
====================================================

Returns:
- Live quiz results
- Solo/practice results

Used by Dashboard and personal result history.
====================================================
*/
router.get(
  "/my-results",
  authMiddleware,
  async (req, res) => {
    try {
      /*
      --------------------------------------------
      LIVE QUIZ RESULTS
      --------------------------------------------
      */
      const liveResults =
        await RoomResult.find({
          user: req.user.id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(50)
          .lean();

      /*
      --------------------------------------------
      SOLO QUIZ RESULTS
      --------------------------------------------
      */
      const soloResults =
        await Result.find({
          user: req.user.id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(50)
          .lean();

      /*
      --------------------------------------------
      FORMAT LIVE RESULTS
      --------------------------------------------
      */
      const formattedLiveResults =
        liveResults.map((result) => ({
          _id: result._id,

          type: "live",

          roomCode:
            result.roomCode,

          participantName:
            result.participantName,

          score:
            result.score,

          rank:
            result.rank ?? null,

          questionsAnswered:
            result.totalQuestions,

          correctAnswers:
            result.correctAnswers,

          accuracy:
            result.totalQuestions > 0
              ? Math.round(
                (result.correctAnswers /
                  result.totalQuestions) *
                100
              )
              : 0,

          category: "Live Quiz",

          createdAt:
            result.createdAt,
        }));

      /*
      --------------------------------------------
      FORMAT SOLO RESULTS
      --------------------------------------------
      */
      const formattedSoloResults =
        soloResults.map((result) => ({
          _id: result._id,

          type: "solo",

          roomCode: null,

          participantName: null,

          score:
            result.score,

          rank: null,

          questionsAnswered:
            result.totalQuestions,

          correctAnswers:
            result.score,

          accuracy:
            result.totalQuestions > 0
              ? Math.round(
                (result.score /
                  result.totalQuestions) *
                100
              )
              : 0,

          category:
            result.category ||
            "Practice Quiz",

          createdAt:
            result.createdAt,
        }));

      /*
      --------------------------------------------
      COMBINE RESULTS
      --------------------------------------------
      */
      const combinedResults = [
        ...formattedLiveResults,
        ...formattedSoloResults,
      ]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
        .slice(0, 100);

      res.json(combinedResults);
    } catch (err) {
      console.error(
        "Error fetching user results:",
        err
      );

      res.status(500).json({
        message:
          "Server error fetching your results",
      });
    }
  }
);

/*
====================================================
GLOBAL LIVE QUIZ LEADERBOARD
====================================================

Shows saved live quiz results of all participants.
====================================================
*/
router.get(
  "/leaderboard",
  authMiddleware,
  async (req, res) => {
    try {
      const results =
        await RoomResult.find()
          .populate(
            "user",
            "name email"
          )
          .sort({
            score: -1,
            createdAt: 1,
          })
          .limit(100)
          .lean();

      const leaderboard =
        results.map(
          (result, index) => ({
            rank: index + 1,

            participantName:
              result.participantName,

            userName:
              result.user?.name ||
              result.participantName,

            roomCode:
              result.roomCode,

            score:
              result.score,

            correctAnswers:
              result.correctAnswers,

            totalQuestions:
              result.totalQuestions,

            accuracy:
              result.totalQuestions > 0
                ? Math.round(
                  (result.correctAnswers /
                    result.totalQuestions) *
                  100
                )
                : 0,

            createdAt:
              result.createdAt,
          })
        );

      res.json(leaderboard);
    } catch (err) {
      console.error(
        "Global leaderboard error:",
        err
      );

      res.status(500).json({
        message:
          "Server error fetching global leaderboard",
      });
    }
  }
);

/*
====================================================
PUBLIC: BASIC ROOM INFO
====================================================
*/
router.get(
  "/:roomCode",
  async (req, res) => {
    try {
      const room =
        await Room.findOne({
          roomCode:
            req.params.roomCode.toUpperCase(),
        }).select(
          "roomCode hostName status questions"
        );

      if (!room) {
        return res.status(404).json({
          message:
            "Room not found",
        });
      }

      res.json({
        roomCode:
          room.roomCode,

        hostName:
          room.hostName,

        status:
          room.status,

        totalQuestions:
          room.questions.length,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  }
);

module.exports = router;