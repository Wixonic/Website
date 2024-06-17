const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");

const server = express();

server.use(cors({
	credentials: true,
	origin: (origin, callback) => {
		console.log(`Request incomming: ${origin}`);

		if (localEnvironment && origin.match(/localhost:\d{4,6}$/m)) return callback(null, true);
		else if (origin.endsWith("wixonic.fr")) return callback(null, true);

		return callback(new Error("Origin not allowed"));
	},
	optionsSuccessStatus: 200
}));

server.use(cookieParser());

module.exports = server;