const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: String,
  displayName: String,
  email: String,
  // Add other user properties as needed
});

const User = mongoose.model("User", userSchema);

module.exports = User;
