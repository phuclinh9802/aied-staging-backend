const express = require("express");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");

require("dotenv").config();
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();
const PORT = process.env.PORT || 3001;

// Replace these with your Google OAuth credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = "/auth/google/callback";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      // Here, you can save user data to your database or perform other actions
      // In this example, we return the user profile as is
      return done(null, profile);
    }
  )
);

// Initialize passport and session
app.use(
  session({
    secret: "secretkey", // Change this to a secure random string
    resave: false,
    saveUninitialized: true,
  })
);
app.use("/auth/google", cors());
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

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
      `http://localhost:3000/dashboard?user=${encodeURIComponent(userData)}`
    );
  }
);

app.get("/dashboard", (req, res) => {
  // Check if the user is authenticated
  console.log(req.user + " ----");
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
