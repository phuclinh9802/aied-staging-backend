const express = require("express");
const User = require("../database/User");

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

router.put("/update-role", async (req, res) => {
  const { newRole } = req.body;
  let userId = "";
  if (req.user) {
    userId = req.user["_id"]; // Assuming you have user authentication middleware setting req.user.id
    console.log(req.user);
    console.log("userid: " + userId);
    console.log("role: " + newRole);
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
