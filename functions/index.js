const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");
const functions = require("firebase-functions/v2/https");

const logger = require("./middleware/logger.js");
const auth = require("./routes/auth.js");
const rich = require("./routes/rich.js");

const server = express();
server.use(cors({
	credentials: true,
	origin: (origin, callback) => callback(null, origin ?? true)
}));
server.use(cookieParser());
server.use(logger);

server.use("/auth", auth);
server.use("/rich", rich);

exports.httpServer = functions.onRequest({
	cors: false,
	memory: "256MiB",
	region: "europe-west1",
	timeoutSeconds: 10
}, server);