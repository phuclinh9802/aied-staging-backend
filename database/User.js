const { UUID } = require("mongodb");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  firstName: String,
  lastName: String,
  password: String,
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
  role: String,
});

const workLearner = mongoose.model("users", userSchema);

module.exports = workLearner;
