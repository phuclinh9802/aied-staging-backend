const { UUID } = require("mongodb");
const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema({
  date: { type: String }, // e.g., "2025-03-23"
  loginTimes: [String], // all login timestamps
  logoutTimes: [String], // all logout timestamps
  pagesVisited: [
    {
      pageName: String,
      timeSpent: Number, 
    },
  ],
  quizzes: [
    {
      type: String, 
      attempts: Number,
      timeSpent: Number, 
      reached80Percent: Boolean,
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
  quizHistory: { type: Map, of: Number, default: {}},
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
  role: String,
  lastActivity: String,
  inactiveDays: Number,
  activityLogs: [ActivityLogSchema],

});

const workLearner = mongoose.model("users", userSchema);
module.exports = workLearner;
