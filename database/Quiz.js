const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: [
    {
      type: String,
      required: true,
    },
  ],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  rightAnswer: { type: Number, default: 0 },
  wrongAnswer: { type: Number, default: 0 },
});

const quizSchema = new mongoose.Schema({
  quizId: {
    type: Number,
    required: true,
  },
  questions: [questionSchema], // Array of question objects
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  rightAnswer: { type: Number, default: 0 },
  wrongAnswer: { type: Number, default: 0 },
});

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
