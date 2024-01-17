const express = require("express");
const passport = require("passport");
const session = require("express-session");
var bodyParser = require("body-parser");
const cors = require("cors");
const User = require("./database/User");
const Output = require("./database/Output");
const Quiz = require("./database/Quiz");
const mongoose = require("mongoose");
const { createProxyMiddleware } = require("http-proxy-middleware");
const userRoutes = require("./routes/userRoutes");

var jsonParser = bodyParser.json();

const db = process.env.MONGO_DB_DATABASE_URL;
mongoose
  .connect(db, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => console.log("Connected Successfully"))
  .catch((err) => {
    console.error(err);
  });

require("dotenv").config();
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();
const PORT = process.env.PORT || 3001;

// Replace these with your Google OAuth credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL =
  "https://aied-staging-backend.vercel.app/auth/google/callback";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      // Here, you can save user data to your database or perform other actions
      // In this example, we return the user profile as is

      try {
        // Check if the user already exists in the database
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          // User already exists, update their profile
          existingUser.displayName = profile.displayName;
          existingUser.email = profile.emails[0].value;
          await existingUser.save();
          return done(null, existingUser);
        } else {
          // Create a new user in the database
          const newUser = new User({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0].value,
            decompositionScore: -1,
            patternScore: -1,
            abstractionScore: -1,
            algorithmScore: -1,
            introScore: -1,
          });
          await newUser.save();
          return done(null, newUser);
        }
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

const secret = process.env.NODE_JS_SECRET_KEY;

// Initialize passport and session
app.use(
  session({
    secret: secret, // Change this to a secure random string
    resave: false,
    saveUninitialized: true,
  })
);

app.use("/auth/google", cors());
app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: "https://aied-staging-v2.vercel.app",
  })
);

const appProxy = createProxyMiddleware({
  target: "https://stage.jdoodle.com",
  changeOrigin: true,
});

app.use(
  "/execute",
  appProxy // Specify the path you want to proxy
);

// Serialize and deserialize the user
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Auth route
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, redirect to dashboard
    const userData = JSON.stringify(req.user.displayName);
    console.log(req.user);
    res.redirect(
      `${process.env.REACT_APP_URL}/dashboard?user=${encodeURIComponent(
        userData
      )}`
    );
  }
);

app.use(express.json()); // Parse JSON data
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

app.post("/save-output", async (req, res) => {
  try {
    const { output } = req.body;
    console.log(output);
    const newOutput = new Output({
      code: output,
    });
    await newOutput.save();
    res.status(200).json({ message: "Output saved to MongoDB successfully" });
  } catch (error) {
    console.error("Error saving output:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { displayName, email, role } = req.body;
    const user = new User({ displayName, email, role });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use("/api/users", userRoutes);

app.get("/dashboard", (req, res) => {
  // Check if the user is authenticated
  console.log(req.user + " ----");
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.get("/api/questions", async (req, res) => {
  try {
    // Fetch quiz questions from MongoDB
    const questions = await Quiz.find();
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
