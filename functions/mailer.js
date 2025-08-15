const nodemailer = require("nodemailer");
const config = require("./config.json");

const transporter = nodemailer.createTransport({
	host: "smtp.mail.me.com",
	port: 587,
	secure: false,
	auth: {
		user: config.icloud.id,
		pass: config.icloud.password
	}
});

module.exports = transporter;