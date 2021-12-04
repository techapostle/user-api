const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const passportJWT = require("passport-jwt");
const dotenv = require("dotenv");

dotenv.config();

const userService = require("./user-service.js");

const app = express();

const HTTP_PORT = process.env.PORT || 8080;

// JSON Web Token Setup
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

// Configure its options
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");

// IMPORTANT - this secret should be a long, unguessable string
// (ideally stored in a "protected storage" area on the web server).
// We suggest that you generate a random 50-character string
// using the following online tool:
// https://lastpass.com/generatepassword.php

jwtOptions.secretOrKey = process.env.JWT_SECRET;

var strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
  console.log("payload received", jwt_payload);

  if (jwt_payload) {
    // The following will ensure that all routes using
    // passport.authenticate have a req.user._id, req.user.userName, req.user.fullName & req.user.role values
    // that matches the request payload data
    next(null, {
      _id: jwt_payload._id,
      userName: jwt_payload.userName,
    });
  } else {
    next(null, false);
  }
});

// tell passport to use our "strategy"
passport.use(strategy);

// add passport as application-level middleware
app.use(passport.initialize());

// express and cors middleware
app.use(express.json());
app.use(cors());

/* TODO Add Your Routes Here */

// Register
app.post("/api/user/register", (req, res) => {
  userService
    .registerUser(req.user)
    .then(() => {
      res.json({ message: "Registration successful" });
    })
    .catch((err) => {
      res.status(422).json({ message: err });
    });
});

// Login
app.post("/api/user/login", (req, res) => {
  userService
    .checkUser(req.user)
    .then((user) => {
      // TODO: Generate payload
      var payload = {
        _id: msg._id,
        userName: msg.userName,
      };
      var token = jwt.sign(payload, jwtOptions.secretOrKey);
      res.json({ message: "Login successful", token: token });
    })
    .catch((err) => {
      res.status(422).json({ message: err });
    });
});

// Get Favourites
app.get(
  "/api/user/favourites",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .getFavourites(req.user._id)
      .then((data) => {
        res.send.json({ data: data });
      })
      .catch((err) => {
        res.status(422).json({ message: err });
      });
  }
);

// Add Favourite
app.put(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .addFavourite(req.user._id, req.params.id)
      .then((data) => {
        res.send.json({ data: data });
      })
      .catch((err) => {
        res.status(422).json({ message: err });
      });
  }
);

// Remove Favourite
app.delete(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .removeFavourite(req.user._id, req.params.id)
      .then((data) => {
        res.send.json({ data: data });
      })
      .catch((err) => {
        res.status(422).json({ message: err });
      });
  }
);

userService
  .connect()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("API listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
  });
