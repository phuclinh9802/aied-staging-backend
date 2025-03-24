const express = require("express");
const User = require("../database/User");
const passport = require("passport");
var parser = require("body-parser");
const { now } = require("mongoose");
var moment = require("moment-timezone");
var urlencodedParser = parser.urlencoded({ extended: false });
const router = express.Router();
const cors = require("cors");

router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.get("/activity/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId || userId === "undefined") {
    console.error("Invalid or missing userId:", userId);
    return res.status(400).json({ message: "Invalid or missing user ID" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.activityLogs || []);
  } catch (err) {
    console.error("Error fetching user activity:", err);
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

router.post("/activity/login", async (req, res) => {
  const { user_id } = req.body;
  const currentDate = moment().tz("America/Chicago").format("YYYY-MM-DD");
  const currentTime = moment().tz("America/Chicago").format("HH:mm:ss");

  try {
    const user = await User.findById(user_id);

    let activityLog = user.activityLogs.find(log => log.date === currentDate);
    if (!activityLog) {
      activityLog = { date: currentDate, loginTimes: [], logoutTimes: [], pagesVisited: [], quizzes: [] };
      user.activityLogs.push(activityLog);
    }

    activityLog.loginTimes.push(currentTime);
    await user.save();

    res.json({ message: "Login time recorded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/activity/logout", async (req, res) => {
  const { user_id } = req.body;
  const currentDate = moment().tz("America/Chicago").format("YYYY-MM-DD");
  const currentTime = moment().tz("America/Chicago").format("HH:mm:ss");

  try {
    const user = await User.findById(user_id);

    let activityLog = user.activityLogs.find(log => log.date === currentDate);
    if (!activityLog) {
      activityLog = { date: currentDate, loginTimes: [], logoutTimes: [], pagesVisited: [], quizzes: [] };
      user.activityLogs.push(activityLog);
    }

    activityLog.logoutTimes.push(currentTime);
    await user.save();

    res.json({ message: "Logout time recorded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/activity/page", async (req, res) => {
  const { user_id, pageName, timeSpent } = req.body;
  const currentDate = moment().tz("America/Chicago").format("YYYY-MM-DD");

  try {
    const user = await User.findById(user_id);
    let activityLog = user.activityLogs.find(log => log.date === currentDate);
    if (!activityLog) {
      activityLog = { date: currentDate, loginTimes: [], logoutTimes: [], pagesVisited: [], quizzes: [] };
      user.activityLogs.push(activityLog);
    }

    activityLog.pagesVisited.push({ pageName, timeSpent });
    await user.save();

    res.json({ message: "Page visit recorded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/activity/quiz", async (req, res) => {
  const { user_id, type, score, timeSpent } = req.body;
  const currentDate = moment().tz("America/Chicago").format("YYYY-MM-DD");

  try {
    const user = await User.findById(user_id);
    let activityLog = user.activityLogs.find(log => log.date === currentDate);
    if (!activityLog) {
      activityLog = { date: currentDate, loginTimes: [], logoutTimes: [], pagesVisited: [], quizzes: [] };
      user.activityLogs.push(activityLog);
    }

    let quiz = activityLog.quizzes.find(q => q.type === type);
    if (!quiz) {
      quiz = { type, attempts: 0, timeSpent: 0, reached80Percent: false };
      activityLog.quizzes.push(quiz);
    }

    quiz.attempts += 1;
    quiz.timeSpent += timeSpent;
    if (score >= 80) quiz.reached80Percent = true;

    await user.save();
    res.json({ message: "Quiz attempt recorded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.put("/quiz", async (req, res) => {
  console.log("req.body", req.body);
  const { quizScore, type } = req.body;
  let userId = req.body.user_id.trim();
  let dateNow = moment(Date.now())
    .tz("America/Chicago")
    .format("YYYY-MM-DD HH:mm:ss");
  console.log(dateNow);
  console.log("Quiz for ", type, req.isAuthenticated());
  console.log();
  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
  }
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
    } else if (type === "mainframe1") {
      if (quizScore.mainframeOneScore > 0) {
        console.log("lesson 8");
        user = await User.findByIdAndUpdate(userId, {
          $set: {
            mainframeOneScore: quizScore.mainframeOneScore,
            lastActivity: dateNow,
          },
        });
      }
    }
    let updateField = {};

    if (type === "decomposition" && quizScore.decompositionScore > 0) {
      updateField.decompositionScore = quizScore.decompositionScore;
    } else if (type === "pattern-recognition" && quizScore.patternScore > 0) {
      updateField.patternScore = quizScore.patternScore;
    } else if (type === "abstraction" && quizScore.abstractionScore > 0) {
      updateField.abstractionScore = quizScore.abstractionScore;
    } else if (type === "algorithms" && quizScore.algorithmScore > 0) {
      updateField.algorithmScore = quizScore.algorithmScore;
    } else if (type === "intro" && quizScore.introScore > 0) {
      updateField.introScore = quizScore.introScore;
    } else if (type === "review" && quizScore.reviewScore > 0) {
      updateField.reviewScore = quizScore.reviewScore;
    } else if (type === "email" && quizScore.emailScore > 0) {
      updateField.emailScore = quizScore.emailScore;
    } else if (type === "beyond" && quizScore.beyondScore > 0) {
      updateField.beyondScore = quizScore.beyondScore;
    } else if (type === "python1" && quizScore.pythonOneScore > 0) {
      updateField.pythonOneScore = quizScore.pythonOneScore;
    } else if (type === "python2" && quizScore.pythonTwoScore > 0) {
      updateField.pythonTwoScore = quizScore.pythonTwoScore;
    } else if (type === "python3" && quizScore.pythonThreeScore > 0) {
      updateField.pythonThreeScore = quizScore.pythonThreeScore;
    } else if (type === "python5" && quizScore.pythonFiveScore > 0) {
      updateField.pythonFiveScore = quizScore.pythonFiveScore;
    } else if (type === "python6" && quizScore.pythonSixScore > 0) {
      updateField.pythonSixScore = quizScore.pythonSixScore;
    } else if (type === "python7" && quizScore.pythonSevenScore > 0) {
      updateField.pythonSevenScore = quizScore.pythonSevenScore;
    } else if (type === "mainframe1" && quizScore.mainframeOneScore > 0) {
      updateField.mainframeOneScore = quizScore.mainframeOneScore;
    }

    if (Object.keys(updateField).length > 0) {
      //  Increment quizAttempts count
      await User.findByIdAndUpdate(userId, {
        $set: updateField,
        $inc: { 
            quizAttempts: 1, //  Total quiz attempts
            [`quizHistory.${type}`]: 1 //  Individual quiz attempts
        },
        lastActivity: dateNow
    });
    }
    console.log("-----user------");
    res.json("quizScore:", quizScore, "type: ", type);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// new api to hide the user by changing the user role from student to hidden


// router.put("/:id/hide", async (req, res) => {
//   console.log("userId to hide ", req.params.id);

//   try {
//     // Use findByIdAndUpdate to directly update the role
//     const user = await User.findByIdAndUpdate(
//       mongoose.Types.ObjectId(req.params.id), // Convert id to ObjectId
//       { $set: { role: "Offline" } }, // Update the role
//       { new: true } // Return the updated document
//     );

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({ message: "User role updated to 'Offline'", user });
//   } catch (error) {
//     res.status(500).json({ message: "Error updating user role", error });
//   }
// });


router.put("/hide", async (req, res) => {
  console.log("req.body", req.body);

  const { user_id } = req.body; // Extract user ID from request body
  console.log("Setting user to Offline");

  try {
    // Find user by ID and update their role to 'Offline'
    const user = await User.findByIdAndUpdate(
      //'65b02fb106981a9d9d9c6ea0', // User ID from request body
      user_id,
      {
        $set: {
          role: "Offline" // Set role to Offline
          
        },
      },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User updated successfully", user);
    res.status(200).json({
      message: "User hidden successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = router;
