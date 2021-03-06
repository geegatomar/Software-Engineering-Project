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
// Require log4js
const log4js = require("log4js");
const encrypt = require("mongoose-encryption");

// Create the logger
const logger = log4js.getLogger();
logger.level = "info";

// For debugging purposes only
// var util = require('util');
// var encoder = new util.TextEncoder('utf-8');
const util = require('util');
const TextEncoder = new util.TextEncoder();

const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const sessionId = uuid.v4();
// const port = 3000;

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

const path = require("path");
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(cookieParser());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: "myRandomSecretDontChange"
}))

// Make sure you create this userDB in mongodb
mongoose.connect("mongodb+srv://admin-shivangi:seproject@cluster0.sghya.mongodb.net/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    //useFindAndModify: false
});

// The user_type in userSchema indicates if its a recruiter or a job seeker
// const userSchema = {
//     email: String,
//     password: String,
//     user_type: String,
//     organization: String
// };
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    user_type: String,
    organization: String
});

// Adding encryption to the project, for authentication.
const secret = "ThisIsOurSecretForEncryptingPasswords_DontChangeThis."
userSchema.plugin(encrypt, {
    secret: secret,
    encryptedFields: ["password"]
})

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
    statustest: String,
    statuscodingtest: String,
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
                codingscore: Number,
                mcqteststat: String,
                codingteststat: String
            }
        }
    },
    problem: codingproblem

}


const Tests = new mongoose.model("Tests", testSchema)

app.get("/", function(req, res) {
    logger.info("On route /");
    res.render("home")
});

app.get("/register", function(req, res) {
    logger.info("On route /register");
    res.render("register")
});

app.get("/login", function(req, res) {
    logger.info("On route /login");
    res.render("login")
});

// app.post("/register", function (req, res) {

// });
app.use(function(req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.post('/send-msg', (req, res) => {
    logger.info("On route /send-msg")
    runSample(req.body.MSG).then(data => {
        res.send({
            Reply: data
        })
    })
})


/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */
async function runSample(msg, projectId = 'rsuite-bot-ayug') {
    // A unique identifier for the given session

    console.log("Inside runSample");
    // Create a new session
    const sessionClient = new dialogflow.SessionsClient({
        keyFilename: __dirname + "/rsuite-bot-ayug-b786f924dfec.json"
    });
    const sessionPath = sessionClient.projectAgentSessionPath(
        projectId,
        sessionId
    );

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                // The query to send to the dialogflow agent
                text: msg,
                // The language used by the client (en-US)
                languageCode: 'en-US',
            },
        },
    };

    // Send request and log result
    const responses = await sessionClient.detectIntent(request);
    console.log('Detected intent');
    const result = responses[0].queryResult;
    console.log(`  Query: ${result.queryText}`);
    console.log(`  Response: ${result.fulfillmentText}`);
    if (result.intent) {
        console.log(`  Intent: ${result.intent.displayName}`);
    } else {
        console.log('  No intent matched.');
    }
    return result.fulfillmentText;
}




app.get("/chatbot", function(req, res) {
    logger.info("On route /chatbot")
        //res.sendFile(path.join(__dirname + '/views/botui/index.html'));
    res.render('index')
});


// app.get("/", function (req, res) {
//     res.render("home")
// });

// app.get("/register", function (req, res) {
//     res.render("register")
// });

// app.get("/login", function (req, res) {
//     res.render("login")
// });

app.post("/register", function(req, res) {
    logger.info("On post route /register")
    console.log(req.body);
    // If a user with this email already exists
    User.exists({
        email: req.body.username
    }, function(err, foundResult) {
        if (err) {
            console.log(err);
        } else {
            if (foundResult) {
                // res.send("User with this username already exists");
                // TODO: Send user to register page after giving this alert.
                res.render("random_base", {
                    text: "User with this username already exists"
                });
            } else {
                // Else create a new user and add it
                const newUser = new User({
                    email: req.body.username,
                    password: req.body.password,
                    user_type: req.body.recruiter_or_seeker,
                    organization: req.body.organization
                });

                // Session management, saving the user
                req.session.userEmail = req.body.username;
                req.session.userType = req.body.recruiter_or_seeker;
                req.session.userOrganization = req.body.organization;
                req.session.save();

                logger.info("Saving session ", req.session.userEmail, req.session.userType);
                console.log("Saving session ", req.session.userEmail, req.session.userType);

                // Upon registering a seeker, save it in the Seeker table
                if (req.session.userType == "seeker") {
                    // Then we need to save it in seekers table also
                    const newSeeker = new Seeker({
                        email: req.session.userEmail,
                        organization: req.body.organization,
                        name: "unavailable",
                        experience: "unavailable",
                        description: "unavailable",
                        jobsAppliedTo: []
                    });
                    newSeeker.save(function(err) {
                        if (err) {
                            logger.error(err);
                            console.log(err);
                        } else {
                            logger.info("Saved to seeker table")
                            console.log("Saved to seeker table");
                        }
                    })
                }
                // When recruiter registers, we initiate record in their job postings table
                else {
                    const newJobs = new Jobs({
                        email: req.session.userEmail,
                        organization: req.session.userOrganization,
                        jobs: []
                    });
                    newJobs.save(function(err) {
                        if (err) {
                            logger.error(err);
                            console.log(err);
                        } else {
                            logger.info("Saved recruiter to jobs table");
                            console.log("Saved recruiter to jobs table");
                        }
                    })
                }
                newUser.save(function(err) {
                    if (err) {
                        logger.error(err);
                        console.log("UNABLE TO REGISTER USER")
                        console.log(err);
                    } else {
                        res.redirect("/home");
                    }
                });
            }
        }
    });
});

app.post("/login", function(req, res) {
    logger.info("On post route /login");
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({
        email: username
    }, function(err, foundUser) {
        if (err) {
            logger.error(err);
            console.log("ERROR WHILE LOGIN")
            console.log(err);
        } else {
            if (foundUser) {
                if (foundUser.password === password) {
                    // Also extract the type of user (seeker or recruiter) from DB and keep in sessions.
                    req.session.userEmail = foundUser.email;
                    req.session.userType = foundUser.user_type;
                    req.session.userOrganization = foundUser.organization;
                    req.session.save();
                    console.log("Saving session ", req.session.userEmail, req.session.userType);
                    logger.info("Saving session ", req.session.userEmail, req.session.userType);
                    res.redirect("/home");
                } else {
                    // TODO: Make this also a new webpage, or just handle with frontend and rerender this page
                    // res.send("Wrong username or password. Try again");
                    res.render("random_base", {
                        text: "Wrong username or password. Try again"
                    });
                }
            } else {
                // TODO: Make this also a new webpage, or just handle with frontend and rerender this page
                // res.send("User not found");
                res.render("random_base", {
                    text: "User not found. Please Register first."
                });
            }
        }
    })
});

// This is the home page of either recruiter or seeker, depending on whose session has been logged in
app.get("/home", function(req, res) {
    logger.info("On route /home");
    console.log(req.session);
    if (!('userEmail' in req.session)) {
        // Then the user is logged out, so redirect them to sign in page
        res.redirect("/login");
    } else {
        console.log(req.session);
        if (req.session.userType == "seeker") {
            res.render("users/seeker/home", {
                organization: req.session.userOrganization
            });
        } else {
            res.render("users/recruiter/home", {
                organization: req.session.userOrganization
            });
        }
    }
})

// To view my profile
app.get("/profile", function(req, res) {
    // We first fetch the required information from the DB
    logger.info("On route /profile");
    const userEmail = req.session.userEmail;
    Seeker.findOne({
        email: userEmail
    }, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            res.render("users/seeker/profile_view", {
                email: foundUser.email,
                organization: foundUser.organization,
                name: foundUser.name,
                experience: foundUser.experience,
                description: foundUser.description
            });
        }
    });

});

// To edit my profile

app.get("/profile_edit", function(req, res) {
    logger.info("On route /profile_edit");

    // We first fetch the required information from the DB
    const userEmail = req.session.userEmail;
    Seeker.findOne({
        email: userEmail
    }, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            res.render("users/seeker/profile_update", {
                email: foundUser.email,
                organization: foundUser.organization,
                name: foundUser.name,
                experience: foundUser.experience,
                description: foundUser.description
            });
        }
    });
});

// The route for after you submit the form for editting profile

app.post("/profile_edit", async function(req, res) {

    logger.info("On post route /profile_edit");
    console.log(req.body);
    const userEmail = req.session.userEmail;

    await Seeker.findOneAndUpdate({
        email: userEmail
    }, {
        name: req.body.name,
        experience: req.body.experience,
        description: req.body.description
    });
    res.redirect("/profile");
});

// For seeker

app.get("/view_all_jobs", async function(req, res) {
    logger.info("On route /view_all_jobs");
    allJobsOfCompany = await Jobs.find();
    console.log(allJobsOfCompany);
    res.render("users/seeker/view_all_jobs", {
        allJobsOfCompany: allJobsOfCompany
    });
});


app.post("/view_job/:jobId", function(req, res) {
    logger.info("On post route /view_job/:jobId");
    const jobId = req.params.jobId;
    console.log(req.params.jobId);
    console.log(req.body.organization);
    console.log(req.body.email);
    Jobs.findOne({
        email: req.body.email
    }, function(err, foundJobs) {
        if (err) {
            console.log(err);
        } else {
            console.log(foundJobs);
            var matchedJob;
            foundJobs.jobs.forEach((job) => {
                if (job.id == jobId) {
                    res.render("view_each_job", {
                        job: job,
                        organization: req.body.organization,
                        email: req.body.email
                    });
                }
            });

        }
    });
    // res.send("Building");
});


app.post("/apply_for_job/:jobId", async function(req, res) {
    logger.info("On post route /apply_for_job/:jobId");

    console.log(req.params.jobId);
    console.log(req.body);
    const applicant = req.session.userEmail;


    // Find the user and check if they have already applied to this job or not.
    const foundSeeker1 = await Seeker.findOne({
        email: applicant
    }).catch((err) => {
        console.error(err);
    });
    let alreadyApplied = 0;
    console.log(foundSeeker1);

    foundSeeker1.jobsAppliedTo.forEach(function (job) {
        if (job.id == req.params.jobId) {
            console.log("Already applied");
            // Setting the flag to 1
            alreadyApplied = 1;
            // res.send("Already applied");
        }
    });

    if (alreadyApplied) {
        res.render("random_base", {
            text: "You have already applied to this job."
        });
    } else {
        // Find the user and update the jobs they applied to
        const foundSeeker = await Seeker.findOneAndUpdate({
            email: applicant
        }, {
            $push: {
                jobsAppliedTo: {
                    "organization": req.body.organization,
                    "id": req.params.jobId,
                    "status": "Applied"
                }
            }
        });
        console.log(foundSeeker);

        console.log("Pushing on ", applicant);
        const updatedApplicant = await Applicant.findOneAndUpdate({
            jobId: req.params.jobId
        }, {
            $push: {
                applicants: {
                    "email": applicant,
                    "status": "Applied"
                }
            }
        });

        const apps = {
            "appemail": req.session.userEmail,
            "score": null,
            "language": null,
            "input": null,
            "codingscore": null,
            "mcqteststat": "nottaken",
            "codingteststat": "nottaken"
        }
        const updatedtest = await Tests.findOneAndUpdate({
                jobId: req.params.jobId
            }, {
                $push: {
                    applicants: apps
                }
            }

        );
        console.log(updatedApplicant);
        // res.send("Your application has been successfully submitted. Thank you for applying!");
        res.render("random_base", {
            text: "Your application has been successfully submitted. Thank you for applying!"
        });
    }

});


app.get("/view_my_applied_jobs", async function(req, res) {
    logger.info("On route /view_my_applied_jobs");
    const email = req.session.userEmail;
    const foundSeeker = await Seeker.findOne({
        email: email
    });
    console.log(foundSeeker);
    res.render("users/seeker/view_my_applied_jobs", {
        jobs: foundSeeker.jobsAppliedTo
    });
});

app.post("/view_test/:jobId", function(req, res) {

    logger.info("On post route /view_test/:jobId");
    const jobId = req.params.jobId;
    Tests.findOne({
        jobId: jobId
    }, function(err, foundtest) {
        if (err) {
            console.log(err);
        }
        console.log(jobId);
        if (foundtest.statustest == "notset") {
            res.render("random_base", {
                text: "The test has not yet been created please wait"
            });
        } else {
            let ch = 0;
            for (let i = 0; i < foundtest.applicants.length; i++) {
                if (foundtest.applicants[i].appemail == req.session.userEmail) {
                    if (foundtest.applicants[i].mcqteststat == 'taken') {
                        ch = 1;
                    }
                }
            }
            console.log(ch);
            if (ch == 1) {
                res.render("random_base", {
                    text: "You have aldready taken the test!!"
                });
            } else {
                res.render("users/seeker/view_test", {
                    jobId: jobId,
                    questions: foundtest.questions
                });
            }
        }

    });
});


app.post("/give_test/:jobId", async function(req, res) {

    logger.info("On post route /give_test/:jobId");
    count = 0;
    const foundtest = await Tests.findOne({
        jobId: req.params.jobId
    });
    const jobId = req.params.jobId;
    const ans = req.body;
    const akey = Object.keys(ans);
    const avalue = Object.values(ans);
    i = 0;
    foundtest.questions.forEach((ques) => {
        console.log(i);
        if (ques.answer == avalue[i]) {
            count = count + 1;
            console.log("Found match");
        }
        i = i + 1;
    });
    console.log("See count");
    console.log(count);


    console.log("hey for update");

    const updatescore = await Tests.findOneAndUpdate({
        jobId: jobId,
        "applicants.appemail": req.session.userEmail
    }, {
        $set: {
            "applicants.$.score": count
        }
    });
    const up = await Tests.findOneAndUpdate({
        jobId: jobId,
        "applicants.appemail": req.session.userEmail
    }, {
        "applicants.$.mcqteststat": "taken"
    });
    console.log(updatescore);
    // res.send("You have sucessfully completed and submitted your test!!");
    res.render("random_base", {
        text: "You have sucessfully completed and submitted your test!!"
    });
});


app.post("/view_codingtest/:jobId", function(req, res) {

    logger.info("On post route /view_codingtest/:jobId");
    const jobId = req.params.jobId;
    Tests.findOne({
        jobId: jobId
    }, function(err, foundtest) {
        if (err) {
            console.log(err);
        }
        console.log("++++++++++++++++++++++", foundtest);
        console.log("================ ", foundtest.problem.problemname);
        // if (foundtest.problem.problemname == "Needstobeset") {
        //     res.render("random_base", {
        //         text: "This test has not been created yet."
        //     });
        // }
        if (foundtest.statuscodingtest == "notset") {
            res.render("random_base", {
                text: "Please wait the test has not been created yet"
            });
        } else {
            let ch = 0;
            for (let i = 0; i < foundtest.applicants.length; i++) {
                if (foundtest.applicants[i].appemail == req.session.userEmail) {
                    if (foundtest.applicants[i].codingteststat == "taken") {
                        ch = 1;
                    }
                }
            }
            console.log(ch);
            if (ch == 1) {
                res.render("random_base", {
                    text: "You have aldready taken the test!!"
                });
            } else {
                res.render("users/seeker/coding", {
                    jobId: jobId,
                    username: req.session.userEmail,
                    probname: foundtest.problem.problemname,
                    description: foundtest.problem.description
                });

            }
        }
    });
});


app.post("/getlanguage/:jobId", async function(req, res) {

    logger.info("On post route /getlanguage/:jobId");
    const jobId = req.params.jobId;
    console.log(req.body);

    const updatescore = await Tests.findOne({
        jobId: jobId,
    });

    console.log(updatescore);
    const language = req.body.languages;
    const inputcode = req.body.inputs;
    const inputcases = updatescore.problem.testcases;
    const up = await Tests.findOneAndUpdate({
        jobId: jobId,
        "applicants.appemail": req.session.userEmail
    }, {
        "applicants.$.codingteststat": "taken"
    });
    console.log("showing up");
    console.log(up);
    let data = {
        "code": inputcode,
        "language": language,
        "input": inputcases
    }
    console.log(data);
    let config = {
        method: 'post',
        url: 'https://codexweb.netlify.app/.netlify/functions/enforceCode',
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };
    const response = await axios(config)
    console.log(response.data);
    const op = response.data
        // axios(config)
        //     .then(function(response) {
        //         console.log(response.data);
        //         console.log("hey1");
        //         op = response.data;
        //     })
        //     .catch(function(error) {
        //         console.log(error);
        //     });
    console.log("seeop");
    console.log(op);
    let sc = 0;
    console.log(op.output);
    console.log(updatescore.problem.expectedoutput);
    if (op.output === updatescore.problem.expectedoutput) {
        console.log("heyy");
        sc = 10;
    } else {
        sc = 0;
    }
    console.log("see score");
    console.log(sc);
    const us = await Tests.findOneAndUpdate({
        jobId: jobId,
        "applicants.appemail": req.session.userEmail
    }, {
        $set: {
            "applicants.$.codingscore": sc
        }
    });

    // res.send("Thank you for taking the test your test has been successfully submitted");
    res.render("random_base", {
        text: "Thank you for taking the test your test has been successfully submitted"
    });
});



// For recruiter

app.get("/create_job", function(req, res) {
    logger.info("On route /create_job");
    res.render("users/recruiter/create_job");
});


app.post("/create_job", async function(req, res) {

    logger.info("On post route /create_job");
    // Create job and add it to the DB
    console.log(req.body);

    // Generating a new id everytime
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);

    const job = {
        "id": id,
        "title": req.body.title,
        "description": req.body.description,
        "expectations": req.body.expectations
    }

    // Also make the entry in the Applicants table
    const newApplicant = new Applicant({
        jobId: id,
        applicants: []
    });
    await newApplicant.save();

    const prob = {
            "problemname": "Needstobeset",
            "description": "Needstobeset",
            "testcases": "Needstobeset",
            "expectedoutput": "Needstobeset"
        }
        //when a new job is created add it's entry to the test table
    const newtest = new Tests({
        jobId: id,
        email: req.session.userEmail,
        organization: req.session.userOrganization,
        statustest: "notset",
        statuscodingtest: "notset",
        questions: [],
        applicants: [],
        problem: prob
    });
    await newtest.save();

    Jobs.findOneAndUpdate({
        email: req.session.userEmail
    }, {
        $push: {
            jobs: job
        }
    }, function(err, foundJobs) {
        if (err) {
            console.log(err);
        } else {
            console.log(foundJobs);
            res.redirect("/view_my_postings");
        }
    });
});


app.get("/view_my_postings", function(req, res) {
    logger.info("On route /view_my_postings");

    Jobs.findOne({
        email: req.session.userEmail
    }, function(err, updatedJobs) {
        if (err) {
            console.log(err);
        }
        console.log(req.session.userEmail);
        console.log(updatedJobs);
        res.render("users/recruiter/view_my_job_postings", {
            jobs: updatedJobs.jobs
        });
    });
});

app.post("/search_for_recruiter", function(req, res) {

    logger.info("On post route /search_for_recruiter");
    console.log(req.body);
    Jobs.findOne({
        email: req.session.userEmail
    }, function(err, foundJobs) {
        matchedJobs = [];
        foundJobs.jobs.forEach((job) => {
            if (job.title == req.body.search) {
                matchedJobs.push(job);
            }
        });
        res.render("users/recruiter/view_my_job_postings", {
            jobs: matchedJobs
        });
    });
});



app.post("/search_for_seeker", async function(req, res) {
    logger.info("On post route /search_for_seeker");
    console.log(req.body);
    foundJobs = await Jobs.find();
    console.log(foundJobs);
    final = []

    foundJobs.forEach((jobs) => {
        const matchedJobs = new Jobs({
            email: jobs.email,
            organization: jobs.organization,
            jobs: []
        });
        jobs.jobs.forEach((job) => {
            if (job.title == req.body.search) {
                matchedJobs.jobs.push(job);
            }
        });
        final.push(matchedJobs);
    });
    console.log("yessss");
    console.log(final);
    res.render("users/seeker/view_all_jobs", {
        allJobsOfCompany: final
    });

});


app.post("/view_applicants/:jobId", async function(req, res) {

    logger.info("On post route /view_applicants/:jobId");
    console.log(req.params.jobId);
    const jobId = req.params.jobId;

    Applicant.findOne({
        jobId: jobId
    }, function(err, foundApplicant) {
        if (err) {
            console.log(err);
        } else {
            console.log(foundApplicant.applicants);
            res.render("users/recruiter/view_applicants", {
                applicants: foundApplicant.applicants,
                jobId: jobId
            });
        }
    })
});


app.post("/test_create/:jobId", function(req, res) {

    logger.info("On post route /test_create/:jobId");
    const jobId = req.params.jobId;
    Tests.findOne({
        jobId: jobId
    }, function(err, foundtest) {
        if (err) {
            console.log(err);
        } else {
            console.log();
            res.render("users/recruiter/create_test", {
                questions: foundtest.questions,
                jobId: jobId
            });
        }
    })
});

app.post("/codingtest_create/:jobId", function(req, res) {

    logger.info("On post route /codingtest_create/:jobId");
    const jobId = req.params.jobId;
    res.render("users/recruiter/create_codingtest", {
        jobId: jobId
    });
});


app.post("/create_codingtest/:jobId", async function(req, res) {
    logger.info("On post route /create_codingtest/:jobId");
    const jobId = req.params.jobId;
    console.log("hey2");
    const prob = {
        "problemname": req.body.name,
        "description": req.body.description,
        "testcases": req.body.testcases,
        "expectedoutput": req.body.expectedoutput
    }
    console.log("hey1");
    const foundtest = await Tests.findOneAndUpdate({
        jobId: jobId
    }, {
        problem: prob,
        statuscodingtest: "set"
    });
    console.log(prob);
    console.log(foundtest);
    // res.send("Successfully added the problem");
    res.render("random_base", {
        text: "Successfully added the problem"
    });
});


app.post("/add_question/:jobId", function(req, res) {
    logger.info("On post route /add_question/:jobId");
    const jobId = req.params.jobId;
    console.log(jobId);

    res.render("users/recruiter/add_question", {
        jobId: jobId
    });

});

app.post("/question_add/:jobId", async function(req, res) {
    logger.info("On post route /question_add/:jobId");
    console.log(req.body);
    const jobId = req.params.jobId;
    const ques = {
        "question": req.body.question,
        "op1": req.body.op1,
        "op2": req.body.op2,
        "op3": req.body.op3,
        "op4": req.body.op4,
        "answer": req.body.answer
    }
    console.log(req.body.answer)
    const ft = await Tests.findOneAndUpdate({
        jobId: jobId
    }, {
        $push: {
            questions: ques
        }
    });

    const foundtests = await Tests.findOneAndUpdate({
        jobId: jobId
    }, {
        statustest: "set"
    });
    console.log(foundtests);
    res.render("users/recruiter/create_test", {
        jobId: jobId,
        questions: foundtests.questions
    });
});


app.post("/view_score/:jobId/:mailid", function(req, res) {
    logger.info("On post route /view_score/:jobId/:mailid");
    console.log("hey");
    const jobId = req.params.jobId;
    const mailid = req.params.mailid;
    Tests.findOne({
        jobId: jobId
    }, function(err, foundtest) {
        if (err) {
            console.log(err);
        } else {
            console.log();
            foundtest.applicants.forEach((applicant) => {
                if (mailid == applicant.appemail) {
                    score = applicant.score;
                    codingscore = applicant.codingscore;
                }
            });
            res.render("users/recruiter/view_score", {
                score: score,
                codingscore: codingscore
            });
        }
    })


});



app.post("/reject_applicant/:jobId", async function(req, res) {
    logger.info("On post route /reject_applicant/:jobId");
    console.log(req.body);
    console.log(req.params.jobId);
    const jobId = req.params.jobId;
    const applicantsEmail = req.body.applicant;
    const updatestat = await Seeker.findOneAndUpdate({
        email: applicantsEmail,
        "jobsAppliedTo.id": jobId
    }, {
        $set: {
            "jobsAppliedTo.$.status": "Rejected"
        }
    });
    const updateapp = await Applicant.findOneAndUpdate({
        jobId: jobId,
        "applicants.email": applicantsEmail
    }, {
        $set: {
            "applicants.$.status": "Rejected"
        }
    });
    res.render("users/recruiter/reject_feedback", {
        jobId: req.params.jobId,
        applicant: req.body.applicant
    });
});


app.post("/rejection_feedback/:jobId", function(req, res) {
    logger.info("On post route /rejection_feedback/:jobId");
    console.log(req.body.applicant);
    console.log(req.params.jobId);

    var org = req.session.userOrganization;
    console.log("----------------------- ", req.body);
    const applicantsEmail = req.body.applicant;
    const feedback = req.body.feedback;

    const text = `Dear Candidate,\nWe are very sorry to inform you about the rejection of your application with the organization ${org}. \n\nThe feedback as received from your recruiter is as follows: \n${feedback} \n\n\nContinue surfing jobs on R-Suite, we are sure you will definitely land your dream job!`;
    const subject = `Update on your job application to ${org}`;
    sendEmailWithoutCalendar(applicantsEmail, text, subject);

    // res.send("Rejection mail has been sent");
    res.render("random_base", {
        text: "Rejection mail has been sent"
    });
});


app.post("/select_applicant/:jobId", async function(req, res) {
    logger.info("On post route /select_applicant/:jobId");
    const jobId = req.params.jobId;
    console.log(req.body);
    console.log(req.params.jobId);
    var org = req.session.userOrganization;
    const applicantsEmail = req.body.applicant;
    //Send email
    const updatestat = await Seeker.findOneAndUpdate({
        email: applicantsEmail,
        "jobsAppliedTo.id": jobId
    }, {
        $set: {
            "jobsAppliedTo.$.status": "Selected"
        }
    });
    const updateapp = await Applicant.findOneAndUpdate({
        jobId: jobId,
        "applicants.email": applicantsEmail
    }, {
        $set: {
            "applicants.$.status": "Selected"
        }
    });
    const text = `Dear Candidate,\nCongratulations on your selection with the organization ${org}. The HRs from ${org} will be reaching out to you for further steps. Thanks for choosing R-Suite!`;
    const subject = "Congratulations! You have been selected!";
    sendEmailWithoutCalendar(applicantsEmail, text, subject);

    // res.send("Selection mail has been sent");
    res.render("random_base", {
        text: "Selection mail has been sent"
    });
});


app.post("/proceed_next_stage/:jobId", function(req, res) {
    logger.info("On post route /proceed_next_stage/:jobId");
    console.log(req.body);
    console.log(req.params.jobId);

    // TODO: Send mail update
    // TODO: Update status in both places

    res.render("users/recruiter/proceed_next_stage", {
        jobId: req.params.jobId,
        applicant: req.body.applicant
    });
});



app.post("/send_interview_invites", function(req, res) {
    logger.info("On post route /send_interview_invites");
    console.log(req.body);
    console.log(req.body.applicant);
    const interviewersEmail = req.body.email;
    const applicantsEmail = req.body.applicant;
    var org = req.session.userOrganization;
    x = req.body.date;
    var dateObj = new Date(x);

    // TODO: Make this invite more specific by mentioning which company and what role they have applied to
    const subject = "Congratulation! Next Steps: Interview with the team of " + org;
    const text = "Congratulations! You have been selected for the next stage of the interview.\
    The interview will be scheduled on" + dateObj.toString() + ". All the very best!";

    // Send mail to applicant
    sendEmail(applicantsEmail, text, subject, dateObj, org);

    // TODO: Make these mails more descriptive, and have more data by fetching from the dbs.

    sendEmail(interviewersEmail, "You have to take an interview on " + dateObj.toString(), "Interviewing Details", dateObj, org);
    // res.send("Mail has been sent");
    res.render("random_base", {
        text: "Mail has been sent"
    });
});


app.get("/logout", function(req, res) {
    logger.info("On route /logout");
    // Destroying the session when we logout
    req.session.destroy();
    res.redirect("/");
});

app.listen(port, function() {
    console.log("Server has started successfully");
});