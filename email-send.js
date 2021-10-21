/*const nodemailer = require("nodemailer");

/*module.exports = function (toEmail, text, subject) {
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

    
}*/


//To send Email with Google Calendar invite
var nodemailer = require("nodemailer");
const ical = require('ical-generator');

module.exports = function (toEmail, text, subject, dateObj,org){
    
    var mailOptions = {
        from: "interviewbud.nitk.se.project@gmail.com",
        to: toEmail,
        subject: subject,
        text: text
    }

    const cal = ical({ domain: "mytestwebsite.com", name: 'My test calendar event' });
    cal.createEvent({
        start: dateObj,        
        end: dateObj,            
        summary: "INTERVIEW WITH " + org,       
        description: "Please be ready 5 minutes before your slot", 
        organizer: {              
            name: org, //"MyCompany",
            email: "interviewbud.nitk.se.project@gmail.com"
        },
    });
    if (cal) {
        let alternatives = {
            "Content-Type": "text/calendar",
            "method": "REQUEST",
            "content": new Buffer(cal.toString()),
            "component": "VEVENT",
            "Content-Class": "urn:content-classes:calendarmessage"
        }
mailOptions['alternatives'] = alternatives;
mailOptions['alternatives']['contentType'] = 'text/calendar'
mailOptions['alternatives']['content'] 
    = new Buffer(cal.toString())
}
var smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "interviewbud.nitk.se.project@gmail.com",
        pass: "thatsmystrongpassword"
    }
 });
smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log("Message sent: " , response);
        }
    })
}
