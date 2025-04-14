const { UUID } = require("mongodb");
const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema({
  date: { type: String }, // e.g., "2025-03-23"
  loginTimes: [String], // all login timestamps
  logoutTimes: [String], // all logout timestamps
  quizHistory: [
    {
      type: { type: String, required: true }, // Quiz type
      attempts: { type: Number, default: 0 }, // Total attempts
      scores: { type: [Number], default: [] }, // List of scores
      timeSpent: { type: [Number], default: [] }, // Time spent on each attempt
      attemptsToReach80: { type: Number, default: 0 }, // Attempts to reach 80%
    },
  ],
});
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  firstName: String,
  lastName: String,
  password: String,
  quizAttempts: { type: Number, default: 0 },
  quizHistory: [
    {
      type: { type: String, required: true }, 
      attempts: { type: Number, default: 0 }, 
      scores: { type: [Number], default: [] }, 
      timeSpent: { type: [Number], default: [] },
      attemptsToReach80: { type: Number, default: 0 }, 
    },
  ],
  decompositionScore: { type: Number, default: -1 },
  patternScore: { type: Number, default: -1 },
  abstractionScore: { type: Number, default: -1 },
  algorithmScore: { type: Number, default: -1 },
  introScore: { type: Number, default: -1 },
  reviewScore: { type: Number, default: -1 },
  emailScore: { type: Number, default: -1 },
  beyondScore: { type: Number, default: -1 },
  pythonOneScore: { type: Number, default: -1 },
  pythonTwoScore: { type: Number, default: -1 },
  pythonThreeScore: { type: Number, default: -1 },
  pythonFiveScore: { type: Number, default: -1 },
  pythonSixScore: { type: Number, default: -1 },
  pythonSevenScore: { type: Number, default: -1 },
  mainframeOneScore: { type: Number, default: -1 },
  mainframeTwoScore: { type: Number, default: -1 },
  mainframeThreeScore: { type: Number, default: -1 },
  mainframeFourScore: { type: Number, default: -1 },
  mainframeFiveScore: { type: Number, default: -1 },
  mainframeSixScore: { type: Number, default: -1 },
  role: String,
  lastActivity: String,
  inactiveDays: Number,
  activityLogs: [ActivityLogSchema],

});
const workLearner = mongoose.model("users", userSchema);
module.exports = workLearner;
