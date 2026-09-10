// Run with: npm run seed
// Adds sample quiz questions to your MongoDB database

require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("./models/Question");

const sampleQuestions = [
  {
    category: "General Knowledge",
    questionText: "What is the capital of India?",
    options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
    correctAnswerIndex: 1,
    difficulty: "easy",
  },
  {
    category: "General Knowledge",
    questionText: "Who wrote the Indian National Anthem?",
    options: ["Rabindranath Tagore", "Bankim Chandra", "Sarojini Naidu", "Muhammad Iqbal"],
    correctAnswerIndex: 0,
    difficulty: "medium",
  },
  {
    category: "Science",
    questionText: "What is the chemical symbol for Gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctAnswerIndex: 2,
    difficulty: "easy",
  },
  {
    category: "Science",
    questionText: "Which gas do plants absorb from the atmosphere for photosynthesis?",
    options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
    correctAnswerIndex: 1,
    difficulty: "easy",
  },
  {
    category: "Computer Science",
    questionText: "Which data structure uses LIFO (Last In First Out)?",
    options: ["Queue", "Stack", "Array", "Linked List"],
    correctAnswerIndex: 1,
    difficulty: "medium",
  },
  {
    category: "Computer Science",
    questionText: "What does 'COA' typically stand for in engineering courses?",
    options: [
      "Computer Organization and Architecture",
      "Code of Algorithms",
      "Central Object Access",
      "Compiler Optimization Analysis",
    ],
    correctAnswerIndex: 0,
    difficulty: "easy",
  },
  {
    category: "Computer Science",
    questionText: "Which of these is NOT a Java access modifier?",
    options: ["public", "private", "protected", "internal"],
    correctAnswerIndex: 3,
    difficulty: "medium",
  },
  {
    category: "Mathematics",
    questionText: "What is the value of pi (approx)?",
    options: ["3.14", "2.71", "1.61", "1.41"],
    correctAnswerIndex: 0,
    difficulty: "easy",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    await Question.deleteMany({});
    await Question.insertMany(sampleQuestions);

    console.log(`Seeded ${sampleQuestions.length} questions successfully!`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err.message);
    process.exit(1);
  }
}

seed();
