const { UUID } = require("mongodb");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  id: UUID,
  googleId: String,
  displayName: String,
  email: String,
  role: {
    type: String,
    default: "student", // Set a default role if none is provided
  },
  // Add other user properties as needed
  decompositionScore: Number,
  patternScore: Number,
  abstractionScore: Number,
  algorithmScore: Number,
  introScore: Number,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
