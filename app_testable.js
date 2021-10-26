const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const cookieParser = require("cookie-parser");
let sendEmail = require(__dirname + "/email-send.js");
let sendEmailWithoutCalendar = require(__dirname + "/email-send-no-cal.js");
var axios = require('axios');
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cookieParser());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: "myRandomSecretDontChange"
}))

// Make sure you create this userDB in mongodb
mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    //useFindAndModify: false
});

// The user_type in userSchema indicates if its a recruiter or a job seeker
const userSchema = {
    email: String,
    password: String,
    user_type: String,
    organization: String
};
const User = new mongoose.model("User", userSchema);


// Jobs Table for Recruiter
const eachJob = {
    id: String,
    title: String,
    description: String,
    expectations: String
}
const jobsSchema = {
    email: String,
    organization: String,
    jobs: {
        "type": "array",
        "items": {
            "type": eachJob
        }
    }
};
const Jobs = new mongoose.model("Jobs", jobsSchema);

// Seeker's profile table
const seekerSchema = {
    name: String,
    email: String,
    experience: String,
    description: String,
    jobsAppliedTo: {
        "type": "array",
        "items": {
            "type": {
                organization: String,
                id: String,
                status: String
            }
        }
    }
};
const Seeker = new mongoose.model("Seeker", seekerSchema);

// The applicants for each job (for the recruiter's view).
const applicantSchema = {
    jobId: String,
    applicants: {
        "type": "array",
        "items": {
            "type": {
                email: String,
                status: String
            }
        }
    }
}
const Applicant = new mongoose.model("Applicant", applicantSchema);

const eachquestion = {
    question: String,
    op1: String,
    op2: String,
    op3: String,
    op4: String,
    answer: String
}

const codingproblem = {
    problemname: String,
    description: String,
    testcases: String,
    expectedoutput: String
}

const testSchema = {
    jobId: String,
    email: String,
    organization: String,
    questions: {
        "type": "array",
        "items": {
            "type": eachquestion
        }
    },
    applicants: {
        "type": "array",
        "items": {
            "type": {
                appemail: String,
                score: Number,
                language: String,
                input: String,
                codingscore: Number
            }
        }
    },
    problem: codingproblem

}


const Tests = new mongoose.model("Tests", testSchema)

function get_home(req, res) {
    res.send("home");
}

// function post_register(req, res) {
//     console.log(req.body);

//     // If a user with this email already exists
//     User.exists({
//         email: req.body.username
//     }, function (err, foundResult) {
//         if (err) {
//             console.log(err);
//             console.log("ERROR");
//         } else {
//             console.log(foundResult);
//             if (foundResult) {
//                 res.send("User with this username already exists");
//                 // res.render("random_base", {
//                 //     text: "User with this username already exists"
//                 // });
//             } else {
//                 // Else create a new user and add it
//                 const newUser = new User({
//                     email: req.body.username,
//                     password: req.body.password,
//                     user_type: req.body.recruiter_or_seeker,
//                     organization: req.body.organization
//                 });

//                 // Session management, saving the user
//                 req.session.userEmail = req.body.username;
//                 req.session.userType = req.body.recruiter_or_seeker;
//                 req.session.userOrganization = req.body.organization;
//                 req.session.save();

//                 console.log("Saving session ", req.session.userEmail, req.session.userType);

//                 // Upon registering a seeker, save it in the Seeker table
//                 if (req.session.userType == "seeker") {
//                     // Then we need to save it in seekers table also
//                     const newSeeker = new Seeker({
//                         email: req.session.userEmail,
//                         organization: req.body.organization,
//                         name: "unavailable",
//                         experience: "unavailable",
//                         description: "unavailable",
//                         jobsAppliedTo: []
//                     });
//                     newSeeker.save(function (err) {
//                         if (err) {
//                             console.log(err);
//                         } else {
//                             console.log("Saved to seeker table");
//                         }
//                     })
//                 }
//                 // When recruiter registers, we initiate record in their job postings table
//                 else {
//                     const newJobs = new Jobs({
//                         email: req.session.userEmail,
//                         organization: req.session.userOrganization,
//                         jobs: []
//                     });
//                     newJobs.save(function (err) {
//                         if (err) {
//                             console.log(err);
//                         } else {
//                             console.log("Saved recruiter to jobs table");
//                         }
//                     })
//                 }
//                 newUser.save(function (err) {
//                     if (err) {
//                         console.log("UNABLE TO REGISTER USER")
//                         console.log(err);
//                     } else {
//                         // res.redirect("/home");
//                         get_home(req, res);
//                     }
//                 });
//             }
//         }
//     });
// }

module.exports = {
    get_home
};