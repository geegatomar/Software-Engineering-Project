const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));

// Make sure you create this userDB in mongodb
mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true
});

// The user_type in userSchema indicates if its a recruiter or a job seeker
const userSchema = {
    email: String,
    password: String,
    user_type: String
};
const User = new mongoose.model("User", userSchema);


// Make sure you create this userDB in mongodb
mongoose.connect("mongodb://localhost:27017/seekerDB", {
    useNewUrlParser: true
});
const seekerSchema = {
    name: String,
    email: String,
    experience: String,
    description: String
};
const Seeker = new mongoose.model("Seeker", seekerSchema)

app.get("/", function (req, res) {
    res.render("home")
});

app.get("/register", function (req, res) {
    res.render("register")
});

app.get("/login", function (req, res) {
    res.render("login")
});

app.post("/register", function (req, res) {
    console.log(req.body);
    const newUser = new User({
        email: req.body.username,
        password: req.body.password,
        user_type: req.body.recruiter_or_seeker
    });

    newUser.save(function (err) {
        if (err) {
            console.log("UNABLE TO REGISTER USER")
            console.log(err);
        } else {
            if (newUser.user_type == "seeker") {
                res.render("users/seeker/home", {
                    email: newUser.email
                })
            } else {
                res.render("users/recruiter/home")
            }
        }
    });
});

app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({
        email: username
    }, function (err, foundUser) {
        if (err) {
            console.log("ERROR WHILE LOGIN")
            console.log(err);
        } else {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render("secrets");
                } else {
                    // TODO: Make this also a new webpage
                    res.send("Wrong username or password. Try again");
                }
            } else {
                // TODO: Make this also a new webpage
                res.send("User not found");
            }
        }
    })
});

app.get("/profile", function (req, res) {
    res.render("users/seeker/profile");
});

app.post("/profile", function (req, res) {

});

app.listen(3000, function () {
    console.log("Server listening on port 3000");
});