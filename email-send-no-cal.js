const nodemailer = require("nodemailer");

// Sending email without calendar invites
module.exports = function (toEmail, text, subject) {
    const mailOptions = {
        from: "interviewbud.nitk.se.project@gmail.com",
        to: toEmail,
        subject: subject,
        text: text
    };
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "interviewbud.nitk.se.project@gmail.com",
            pass: "thatsmystrongpassword"
        }
    });

    console.log("Going to send mail");

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log("Error in sending mail .........");
            console.log(err);
        } else {
            console.log("Email sent: ", info.response);
        }
    })


}