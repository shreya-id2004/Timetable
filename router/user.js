const express = require("express");
const router = express.Router();
const User = require("../models/user.js");

const passport = require('passport');
const LocalStrategy = require('passport-local');


router.get("/login", (req, res) => {
    res.render("../views/login.ejs");
})

// Render signup page
router.get("/signup", (req, res) => {
    res.render("../views/signup.ejs"); // Create a signup.ejs file similarly
});

// Handle login logic
router.post("/login", passport.authenticate("local", {
    successRedirect: "/home", // Replace with the route to redirect after successful login
    failureRedirect: "/login", // Redirect back to login page on failure
    failureFlash: true // Enable flash messages for better UX (optional)
}));


router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const newUser = new User({ username, email });
        await User.register(newUser, password); // Automatically hashes the password
        req.flash('success', 'Signup successful! You can now log in.');
        res.redirect('/login');
    } catch (error) {
        req.flash('error', 'Error signing up. Please try again.');
        res.redirect('/signup');
    }
});


router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) {
            return next(err); // Handle errors during logout
        }
        res.redirect('/login'); // Redirect to login page after logging out
    });
});

// Handle logout
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login'); // Redirect to login if not authenticated
  }
  
  router.get('/home', isLoggedIn, (req, res) => {
    res.render('../views/home.ejs', { user: req.user });
  });
  

module.exports = router;