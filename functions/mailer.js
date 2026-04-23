const nodemailer = require("nodemailer");

const config = require("./config.json");

const transporter = nodemailer.createTransport({
	host: config.mailer.host,
	port: config.mailer.port,
	secure: false,
	auth: {
		user: config.mailer.id,
		pass: config.mailer.password
	}
});

module.exports = transporter;