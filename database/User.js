const { UUID } = require("mongodb");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  firstName: String,
  lastName: String,
  password: String,
  decompositionScore: Number,
  patternScore: Number,
  abstractionScore: Number,
  algorithmScore: Number,
  introScore: Number,
  role: String,
});

const workLearner = mongoose.model("users", userSchema);

module.exports = workLearner;
