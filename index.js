const express = require("express");
const passport = require("passport");
const session = require("express-session");
var bodyParser = require("body-parser");
const LocalStrategy = require("passport-local").Strategy;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require("cors");
const User = require("./database/User");
const Output = require("./database/Output");
const Quiz = require("./database/Quiz");
const mongoose = require("mongoose");
const { createProxyMiddleware } = require("http-proxy-middleware");
const userRoutes = require("./routes/userRoutes");
const isStrongPassword = require("./middleware/middleware");
const isValidEmail = require("./middleware/validEmail");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_DB_DATABASE_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => console.log("Connected Successfully"))
  .catch((err) => {
    console.error(err);
  });

const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();
const PORT = process.env.PORT || 3001;

// Replace these with your Google OAuth credentials
// const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// const CALLBACK_URL =
//   "https://aied-staging-backend.vercel.app/auth/google/callback";

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: GOOGLE_CLIENT_ID,
//       clientSecret: GOOGLE_CLIENT_SECRET,
//       callbackURL: CALLBACK_URL,
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       // Here, you can save user data to your database or perform other actions
//       // In this example, we return the user profile as is

//       try {
//         // Check if the user already exists in the database
//         const existingUser = await User.findOne({ googleId: profile.id });

//         if (existingUser) {
//           // User already exists, update their profile
//           existingUser.displayName = profile.displayName;
//           existingUser.email = profile.emails[0].value;
//           await existingUser.save();
//           return done(null, existingUser);
//         } else {
//           // Create a new user in the database
//           const newUser = new User({
//             googleId: profile.id,
//             displayName: profile.displayName,
//             email: profile.emails[0].value,
//             decompositionScore: -1,
//             patternScore: -1,
//             abstractionScore: -1,
//             algorithmScore: -1,
//             introScore: -1,
//             role: "",
//           });
//           await newUser.save();
//           return done(null, newUser);
//         }
//       } catch (err) {
//         return done(err, null);
//       }
//     }
//   )
// );

const secret = process.env.NODE_JS_SECRET_KEY;

// Initialize passport and session
app.use(
  session({
    secret: secret, // Change this to a secure random string
    resave: false,
    saveUninitialized: true,
  })
);
console.log(process.env.REACT_APP_URL);
app.use(
  cors({
    origin: process.env.REACT_APP_URL,
    credentials: true,
  })
);

// app.use("/auth/google", cors());
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));

passport.use(
  new LocalStrategy(async (username, password, done) => {
    const user = await User.findOne({ username: username });

    if (!user) {
      return done(null, false, { message: "Incorrect username." });
    }
    console.log("Found User" + user.password);
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) throw err;
      console.log(result);
      if (result) {
        console.log(user);
        return done(null, user);
      } else {
        console.log("incorrect");
        return done(null, false, { message: "Incorrect password." });
      }
    });
  })
);

passport.serializeUser((user, done) => {
  console.log(user);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  console.log(id);
  const user = User.findById({ _id: id });
  console.log("----", user, "-----");
  done(null, user);
});

const appProxy = createProxyMiddleware({
  target: "https://stage.jdoodle.com",
  changeOrigin: true,
});

app.use(
  "/execute",
  appProxy // Specify the path you want to proxy
);

// Serialize and deserialize the user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => {
    done(null, user);
  });
});

// Auth route
// app.get(
//   "/auth/google",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );

// app.get(
//   "/auth/google/callback",
//   passport.authenticate("google", { failureRedirect: "/login" }),
//   (req, res) => {
//     // Successful authentication, redirect to dashboard
//     const userData = JSON.stringify(req.user.displayName);
//     console.log(req.user);
//     res.redirect(
//       `${process.env.REACT_APP_URL}/dashboard?user=${encodeURIComponent(
//         userData
//       )}`
//     );
//   }
// );

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

app.post("/login", passport.authenticate("local"), (req, res) => {
  const { _id, firstName, lastName, username, role } = req.user;

  const token = jwt.sign(
    { userId: _id, firstName, lastName, username },
    secret,
    {
      expiresIn: "1h",
    }
  );
  console.log("req:", req.isAuthenticated());
  res.json({ token, user: { firstName, lastName, username, role } });
});

app.post("/register", async (req, res) => {
  const {
    firstName,
    lastName,
    username,
    email,
    password,
    confirmPassword,
    role,
  } = req.body;
  console.log(firstName, lastName, username, password, confirmPassword, role);
  try {
    // Check if the username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken." });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already taken." });
    }

    if (username.length < 8) {
      return res
        .status(400)
        .json({ message: "The username needs to be 8 characters and more." });
    }

    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          'The password needs to be 8 characters and more, contains at least a number, and a special character (!@#$%^&*(),.?":{}|<>)',
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    if (firstName.length < 1 && lastName.length < 1) {
      return res
        .status(400)
        .json({ message: "Please enter your first name or last name." });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user and save to MongoDB
    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      role,
      decompositionScore: -1,
      patternScore: -1,
      abstractionScore: -1,
      algorithmScore: -1,
      introScore: -1,
      emailScore: -1,
      beyondScore: -1,
    });
    await newUser.save();

    res.json({ message: "Registration successful." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
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
