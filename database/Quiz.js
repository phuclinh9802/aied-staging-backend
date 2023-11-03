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
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        return value >= 0 && value < this.options.length;
      },
      message: "Invalid correct answer index",
    },
  },
});

const quizSchema = new mongoose.Schema({
  quizId: {
    type: Number,
    required: true,
  },
  questions: [questionSchema], // Array of question objects
});

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
