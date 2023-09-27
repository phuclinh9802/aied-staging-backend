const express = require("express");
const passport = require("passport");
const session = require("express-session");
var bodyParser = require("body-parser");
const cors = require("cors");
const User = require("./database/database");
const mongoose = require("mongoose");
const { createProxyMiddleware } = require("http-proxy-middleware");

var jsonParser = bodyParser.json();

const db =
  "mongodb+srv://phuclinh9802:Linhphuc9802@cluster0.nb9ezkq.mongodb.net/?retryWrites=true&w=majority";
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
const CALLBACK_URL = "/auth/google/callback";

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
app.use(cors());

const appProxy = createProxyMiddleware({
  target: "https://stage.jdoodle.com",
  // headers: {
  //   accept: "application/json",
  //   method: "POST",
  // },
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

// app.post("/execute", jsonParser, (req, res) => {
//   const requestData = req.body;
//   console.log("Received data:", requestData);

//   // Perform any necessary operations with the data here

//   res.status(200).json({ message: "Data received successfully" });
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
