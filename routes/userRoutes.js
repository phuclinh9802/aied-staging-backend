const express = require("express");
const User = require("../database/User");
const passport = require("passport");
var parser = require("body-parser");
var urlencodedParser = parser.urlencoded({ extended: false });
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    console.log(req.user);
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:userId", async (req, res) => {
  console.log("userId: ", req.params.userId);
  try {
    const user = await User.findById(req.params.userId);
    console.log(user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/quiz", async (req, res) => {
  const { quizScore, type } = req.body;
  let userId = "";
  console.log("Quiz for ", type, req.isAuthenticated());
  console.log();
  if (req.isAuthenticated()) {
    userId = req.user._conditions._id._id; // Assuming you have user authentication middleware setting req.user.id
  }
  try {
    let user = "";
    if (type == "decomposition") {
      user = await User.findByIdAndUpdate(userId, {
        decompositionScore: quizScore.decompositionScore,
      });
    } else if (type === "pattern-recognition") {
      user = await User.findByIdAndUpdate(userId, {
        patternScore: quizScore.patternScore,
      });
    } else if (type === "abstraction") {
      user = await User.findByIdAndUpdate(userId, {
        abstractionScore: quizScore.abstractionScore,
      });
    } else if (type === "algorithms") {
      user = await User.findByIdAndUpdate(userId, {
        algorithmScore: quizScore.algorithmScore,
      });
    } else if (type === "intro") {
      user = await User.findByIdAndUpdate(userId, {
        introScore: quizScore.introScore,
      });
    } else if (type === "email") {
      user = await User.findByIdAndUpdate(userId, {
        emailScore: quizScore.emailScore,
      });
    } else if (type === "beyond") {
      user = await User.findByIdAndUpdate(userId, {
        beyondScore: quizScore.beyondScore,
      });
    }
    console.log("-----user------");
    res.json(user);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
