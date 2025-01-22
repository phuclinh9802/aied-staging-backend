const express = require("express");
const User = require("../database/User");
const passport = require("passport");
var parser = require("body-parser");
const { now } = require("mongoose");
var moment = require("moment-timezone");
var urlencodedParser = parser.urlencoded({ extended: false });
const router = express.Router();

router.get("/", async (req, res) => {
  try {
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
  console.log("req.body", req.body);
  const { quizScore, type } = req.body;
  let userId = req.body.user_id;
  let dateNow = moment(Date.now())
    .tz("America/Chicago")
    .format("YYYY-MM-DD HH:mm:ss");
  console.log(dateNow);
  console.log("Quiz for ", type, req.isAuthenticated());
  console.log();
  try {
    let user = "";
    if (type == "decomposition") {
      if (quizScore.decompositionScore > 0) {
        user = await User.findByIdAndUpdate(userId, {
          $set: {
            decompositionScore: quizScore.decompositionScore,
            lastActivity: dateNow,
          },
        });
      }
    } else if (type === "pattern-recognition") {
      if (quizScore.patternScore > 0) {
        user = await User.findByIdAndUpdate(userId, {
          $set: {
            patternScore: quizScore.patternScore,
            lastActivity: dateNow,
          },
        });
      }
    } else if (type === "abstraction") {
      if (quizScore.abstractionScore > 0) {
        user = await User.findByIdAndUpdate(userId, {
          $set: {
            abstractionScore: quizScore.abstractionScore,
            lastActivity: dateNow,
          },
        });
      }
    } else if (type === "algorithms") {
      if (quizScore.algorithmScore > 0) {
        user = await User.findByIdAndUpdate(userId, {
          $set: {
            algorithmScore: quizScore.algorithmScore,
            lastActivity: dateNow,
          },
        });
      }
    } else if (type === "intro") {
      if (quizScore.introScore > 0) {
        user = await User.findByIdAndUpdate(userId, {
          $set: {
            introScore: quizScore.introScore,
            lastActivity: dateNow,
          },
        });
      }
    } else if (type === "review") {
      if (quizScore.reviewScore > 0) {
        user = await User.findByIdAndUpdate(userId, {
          $set: {
            reviewScore: quizScore.reviewScore,
            lastActivity: dateNow,
          },
        });
      }
    } else if (type === "email") {
      if (quizScore.emailScore > 0) {
        user = await User.findByIdAndUpdate(userId, {
          emailScore: quizScore.emailScore,
        });
      }
    } else if (type === "beyond") {
      if (quizScore.beyondScore > 0) {
        user = await User.findByIdAndUpdate(userId, {
          beyondScore: quizScore.beyondScore,
        });
      }
    } else if (type === "python1") {
      if (quizScore.pythonOneScore > 0) {
        console.log("yes");
        user = await User.findByIdAndUpdate(userId, {
          $set: {
            pythonOneScore: quizScore.pythonOneScore,
            lastActivity: dateNow,
          },
        });
      }
    } else if (type === "python2") {
      if (quizScore.pythonTwoScore > 0) {
        console.log("lesson 2");
        user = await User.findByIdAndUpdate(userId, {
          $set: {
            pythonTwoScore: quizScore.pythonTwoScore,
            lastActivity: dateNow,
          },
        });
      }
    } else if (type === "python3") {
      if (quizScore.pythonThreeScore > 0) {
        console.log("lesson 3");
        user = await User.findByIdAndUpdate(userId, {
          $set: {
            pythonThreeScore: quizScore.pythonThreeScore,
            lastActivity: dateNow,
          },
        });
      }
    } else if (type === "python5") {
      if (quizScore.pythonFiveScore > 0) {
        console.log("lesson 5");
        user = await User.findByIdAndUpdate(userId, {
          $set: {
            pythonFiveScore: quizScore.pythonFiveScore,
            lastActivity: dateNow,
          },
        });
      }
    } else if (type === "python6") {
      if (quizScore.pythonSixScore > 0) {
        console.log("lesson 6");
        user = await User.findByIdAndUpdate(userId, {
          $set: {
            pythonSixScore: quizScore.pythonSixScore,
            lastActivity: dateNow,
          },
        });
      }
    } else if (type === "python7") {
      if (quizScore.pythonSevenScore > 0) {
        console.log("lesson 7");
        user = await User.findByIdAndUpdate(userId, {
          $set: {
            pythonSevenScore: quizScore.pythonSevenScore,
            lastActivity: dateNow,
          },
        });
      }
    }
    console.log("-----user------");
    res.json("quizScore:", quizScore, "type: ", type);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
