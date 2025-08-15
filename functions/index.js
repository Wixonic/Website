const cheerio = require("cheerio");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const adminAppLibrary = require("firebase-admin/app");
const adminAuthLibrary = require("firebase-admin/auth");
const adminFirestoreLibrary = require("firebase-admin/firestore");
const fs = require("fs");
const http = require("http");
const https = require("https");
const nodemailer = require("nodemailer");
const sharp = require("sharp");

const adminFunctionsLibrary = require("firebase-functions/v1");

const clientAppLibrary = require("firebase/app");
const clientAuthLibrary = require("firebase/auth");

const request = require("./request.js");

const config = require("./config.json");

const localEnvironment = process.env.FUNCTIONS_EMULATOR == "true";

const adminApp = adminAppLibrary.initializeApp({
	credential: adminAppLibrary.cert(config.firebase),

	apiKey: "AIzaSyAoAl-09tw3K0i8N2PnYKAjjZb19e4zEBk",
	projectId: "wixonic-website-2",
	appId: "1:6198929588:web:3e2650dacec00b1bf90fe1",

	authDomain: "wixonic-website-2.firebaseapp.com",
	messagingSenderId: "6198929588",
	storageBucket: "wixonic-website-2.appspot.com"
}, "admin");
const adminAuth = adminAuthLibrary.getAuth(adminApp);
const adminFirestore = adminFirestoreLibrary.getFirestore(adminApp);

const adminFunctionsDefaultLibrary = adminFunctionsLibrary.runWith({
	memory: "128MB",
	timeoutSeconds: 15
}).region("europe-west1");

const clientApp = clientAppLibrary.initializeApp({
	apiKey: "AIzaSyAoAl-09tw3K0i8N2PnYKAjjZb19e4zEBk",
	projectId: "wixonic-website-2",
	appId: "1:6198929588:web:3e2650dacec00b1bf90fe1",

	authDomain: "wixonic-website-2.firebaseapp.com",
	messagingSenderId: "6198929588",
	storageBucket: "wixonic-website-2.appspot.com"
}, "client");
const clientAuth = clientAuthLibrary.getAuth(clientApp);
if (localEnvironment) clientAuthLibrary.connectAuthEmulator(clientAuth, "http://localhost:2001");

const transporter = nodemailer.createTransport({
	host: "smtp.mail.me.com",
	port: 587,
	secure: false,
	auth: {
		user: config.icloud.id,
		pass: config.icloud.password
	}
});

const server = express();

server.use(cors({
	credentials: true,
	origin: (origin, callback) => callback(null, origin ?? true)
}));

server.use(cookieParser());

let requestId = 0;

const sendVerificationEmail = async (email, newEmail) => {
	const url = new URL("/verify/", localEnvironment ? "http://localhost:2010" : "https://accounts.wixonic.fr");
	const verificationLink = new URL(newEmail ? await adminAuth.generateVerifyAndChangeEmailLink(email, newEmail) : await adminAuth.generateEmailVerificationLink(email));
	url.searchParams.set("mode", verificationLink.searchParams.get("mode"));
	url.searchParams.set("oobCode", verificationLink.searchParams.get("oobCode"));

	await transporter.sendMail({
		from: "Wixonic Network <contact@wixonic.fr>",
		to: email,
		subject: "Verify your email",
		html: fs.readFileSync("./emails/verify.html", "utf-8")
			.replaceAll("%EMAIL%", email)
			.replaceAll("%VERIFICATION_LINK%", url.toString())
	});
};

server.route(["/auth/token", "/auth/token/"])
	.get(async (req, res) => {
		req.id = requestId++;
		req.logger = {
			debug: (...data) => console.log(`req${req.id}:`, ...data),
			info: (...data) => console.info(`req${req.id}:`, ...data),
			warn: (...data) => console.warn(`req${req.id}:`, ...data),
			error: (...data) => console.error(`req${req.id}:`, ...data)
		};

		const sessionCookie = req.cookies.__session;

		if (!sessionCookie) {
			req.logger.warn("Session cookie is missing");
			return res.status(401).json({
				error: "Session cookie is missing"
			});
		}

		try {
			const user = await adminAuth.verifySessionCookie(sessionCookie, true);
			req.logger.debug("Authenticated user:", user.uid);

			const token = await adminAuth.createCustomToken(user.uid);
			res.status(200).json({
				token
			});
		} catch (e) {
			req.logger.error("Failed to verify token:", e);
			return res.status(403).json({
				error: "Invalid or expired token"
			});
		}
	})
	.post(async (req, res) => {
		req.id = requestId++;
		req.logger = {
			debug: (...data) => console.log(`req${req.id}:`, ...data),
			info: (...data) => console.info(`req${req.id}:`, ...data),
			warn: (...data) => console.warn(`req${req.id}:`, ...data),
			error: (...data) => console.error(`req${req.id}:`, ...data)
		};

		try {
			const { email, password } = JSON.parse(req.body);

			if (!email || !password) {
				req.logger.warn("Missing email or password");
				return res.status(400).json({
					error: "Missing email or password"
				});
			}

			try {
				const credentials = await clientAuthLibrary.signInWithEmailAndPassword(clientAuth, email, password);

				const idToken = await credentials.user.getIdToken();
				const expiresIn = 2 * 7 * 24 * 60 * 60 * 1000;
				const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

				res.cookie("__session", sessionCookie, {
					path: "/",
					domain: localEnvironment ? undefined : ".wixonic.fr",
					maxAge: expiresIn,
					httpOnly: true,
					secure: !localEnvironment,
					sameSite: localEnvironment ? "lax" : "none"
				});

				res.status(204).end();
			} catch (e) {
				req.logger.error(e);
				res.status(400).json({
					error: "Failed to authenticate"
				});
			}
		} catch (e) {
			res.status(400).json({
				error: `Failed to parse JSON: ${e}`
			});
		}
	});

server.post(["/auth/revoke", "/auth/revoke/"], async (req, res) => {
	req.id = requestId++;
	req.logger = {
		debug: (...data) => console.log(`req${req.id}:`, ...data),
		info: (...data) => console.info(`req${req.id}:`, ...data),
		warn: (...data) => console.warn(`req${req.id}:`, ...data),
		error: (...data) => console.error(`req${req.id}:`, ...data)
	};

	const sessionCookie = req.cookies.__session;

	if (!sessionCookie) {
		req.logger.warn("Session cookie is missing");
		return res.status(401).json({
			error: "Session cookie is missing"
		});
	}

	res.clearCookie("__session", {
		path: "/",
		domain: localEnvironment ? undefined : ".wixonic.fr",
		httpOnly: true,
		secure: !localEnvironment,
		sameSite: localEnvironment ? "lax" : "none"
	});

	try {
		const decoded = await adminAuth.verifySessionCookie(sessionCookie);
		await adminAuth.revokeRefreshTokens(decoded.uid);
	} catch (e) {
		req.logger.warn("Failed to revoke refresh tokens:", e);
	}

	res.status(204).end();
});

server.post(["/auth/join", "/auth/join/"], async (req, res) => {
	req.id = requestId++;
	req.logger = {
		debug: (...data) => console.log(`req${req.id}:`, ...data),
		info: (...data) => console.info(`req${req.id}:`, ...data),
		warn: (...data) => console.warn(`req${req.id}:`, ...data),
		error: (...data) => console.error(`req${req.id}:`, ...data)
	};

	try {
		const { email, password, confirm } = JSON.parse(req.body);

		if (!email || !password || !confirm) {
			req.logger.warn("Missing email, password or password confirmation");
			return res.status(400).json({
				error: "Missing email, password or password confirmation"
			});
		}

		if (password != confirm) {
			req.logger.warn("Password and confirmation do not match");
			return res.status(400).json({
				error: "Password and confirmation do not match",
			});
		}

		try {
			const credentials = await clientAuthLibrary.createUserWithEmailAndPassword(clientAuth, email, password);
			const displayName = credentials.user.email == "contact@wixonic.fr" ? "Admin" : "user_" + credentials.user.uid.slice(-16, -1);

			if (credentials.user.email == "contact@wixonic.fr") {
				await adminAuth.setCustomUserClaims(credentials.user.uid, {
					admin: true
				});
			}

			await adminAuth.updateUser(credentials.user.uid, { displayName });
			await adminFirestore.collection("users").doc(credentials.user.uid).set({
				displayName,
				createdAt: new Date().toISOString()
			});

			await adminFirestore.collection("privateUsers").doc(credentials.user.uid).set({
				email
			});

			await sendVerificationEmail(email);

			const idToken = await credentials.user.getIdToken();
			const expiresIn = 2 * 7 * 24 * 60 * 60 * 1000;
			const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

			res.cookie("__session", sessionCookie, {
				domain: localEnvironment ? undefined : ".wixonic.fr",
				maxAge: expiresIn,
				httpOnly: true,
				secure: !localEnvironment,
				sameSite: localEnvironment ? "lax" : "none"
			});

			res.status(204).end();
		} catch (e) {
			req.logger.error(e);
			res.status(400).json({
				error: "Failed to create account"
			});
		}
	} catch (e) {
		req.logger.error(e);
		res.status(400).json({
			error: `Failed to parse JSON: ${e}`
		});
	}
});

server.post(["/auth/delete", "/auth/delete/"], async (req, res) => {
	req.id = requestId++;
	req.logger = {
		debug: (...data) => console.log(`req${req.id}:`, ...data),
		info: (...data) => console.info(`req${req.id}:`, ...data),
		warn: (...data) => console.warn(`req${req.id}:`, ...data),
		error: (...data) => console.error(`req${req.id}:`, ...data)
	};

	const sessionCookie = req.cookies.__session;

	if (!sessionCookie) {
		req.logger.warn("Session cookie is missing");
		return res.status(401).json({
			error: "Session cookie is missing"
		});
	}

	try {
		const decoded = await adminAuth.verifySessionCookie(sessionCookie);

		const discordLink = await adminFirestore.collection("users").doc(decoded.uid).collection("links").doc("discord").get();

		if (discordLink.exists) {
			try {
				const discordData = discordLink.data();
				const response = await request(req.logger, {
					url: new URL("/discord/link/delete/", localEnvironment ? "http://localhost:999" : "https://server.wixonic.fr"),
					method: "POST",
					type: "text",
					auth: config.server.wixkey,
					headers: {
						"Content-Type": "text/plain"
					},
					secure: !localEnvironment,
					body: discordData.id
				});
				if (response.error) throw "Failed: " + response.error;
			} catch (e) {
				req.logger.error("Failed to delete Discord link:", e);
				return res.status(500).end();
			}
		}

		await adminFirestore.recursiveDelete(adminFirestore.collection("users").doc(decoded.uid));
		await adminFirestore.recursiveDelete(adminFirestore.collection("privateUsers").doc(decoded.uid));

		await adminAuth.revokeRefreshTokens(decoded.uid);
		await adminAuth.deleteUser(decoded.uid);

		res.clearCookie("__session", {
			path: "/",
			domain: localEnvironment ? undefined : ".wixonic.fr",
			httpOnly: true,
			secure: !localEnvironment,
			sameSite: localEnvironment ? "lax" : "none"
		});

		res.status(204).end();
	} catch (e) {
		req.logger.error("Failed to delete account:", e);
		res.status(500).end();
	}
});

server.post(["/auth/verify", "/auth/verify/"], async (req, res) => {
	req.id = requestId++;
	req.logger = {
		debug: (...data) => console.log(`req${req.id}:`, ...data),
		info: (...data) => console.info(`req${req.id}:`, ...data),
		warn: (...data) => console.warn(`req${req.id}:`, ...data),
		error: (...data) => console.error(`req${req.id}:`, ...data)
	};

	const sessionCookie = req.cookies.__session;

	if (!sessionCookie) {
		req.logger.warn("Session cookie is missing");
		return res.status(401).json({
			error: "Session cookie is missing"
		});
	}

	try {
		const user = await adminAuth.verifySessionCookie(sessionCookie, true);
		req.logger.debug("Authenticated user:", user.uid);

		const newEmail = req.query.email ? decodeURIComponent(req.query.email) : null;

		if (newEmail) await sendVerificationEmail(user.email, newEmail);
		else if (user.email_verified) throw "Email already verified";
		else await sendVerificationEmail(user.email);
		res.status(204).end();
	} catch (e) {
		req.logger.error("Failed to verify token:", e);
		return res.status(403).json({
			error: "Invalid or expired token"
		});
	}
});

server.get(["/rich/link", "/rich/link/"], async (req, res) => {
	req.id = requestId++;
	req.logger = {
		debug: (...data) => console.log(`req${req.id}:`, ...data),
		info: (...data) => console.info(`req${req.id}:`, ...data),
		warn: (...data) => console.warn(`req${req.id}:`, ...data),
		error: (...data) => console.error(`req${req.id}:`, ...data)
	};

	let title = null;
	let description = null;
	let icon = null;
	let thumbnail = null;

	const getWithRedirects = (url, host) => new Promise((resolve, reject) => {
		try {
			url = new URL(url, host);

			const get = (url.protocol == "https:" ? https : http).get;

			const request = get(url, {
				headers: {
					"Accept-Language": "en-US,en-GB,en"
				}
			}, (response) => {
				if (String(response.statusCode).startsWith("3")) {
					getWithRedirects(response.headers.location.startsWith("http") ? response.headers.location : `${url.origin}}${response.headers.location}`)
						.then(resolve)
						.catch(reject);
				} else if (String(response.statusCode).startsWith("2")) {
					let data = [];
					response.on("data", (chunk) => data.push(chunk));
					response.on("end", () => {
						response.url = url;
						response.data = Buffer.concat(data);
						resolve(response);
					});
				} else reject(`Invalid status: ${response.statusCode}`);
			});

			request.on("error", reject);
		} catch {
			reject(`Invalid url: ${url} - Host: ${host}`);
		}
	});

	const getImageData = (url, width = 500, height = 500, host) => new Promise((resolve, reject) => {
		getWithRedirects(url, host)
			.then(async (response) => {
				const buffer = Buffer.from(response.data);
				const resizeBuffer = await sharp(buffer)
					.resize({ width, height, fit: "inside" })
					.toFormat("png")
					.toBuffer();
				resolve(`data:image/png;base64,${resizeBuffer.toString("base64")}`);
			})
			.catch(reject);
	});

	try {
		let htmlUrl = null;

		const getHtml = (url, host) => new Promise((resolve, reject) => {
			getWithRedirects(url, host)
				.then((response) => {
					htmlUrl = response.url;
					resolve(response.data.toString("utf8"));
				}).catch(reject);
		});

		try {
			const html = await getHtml(req.query.url);
			const $ = cheerio.load(html);

			try {
				title = $(`meta[property="og:title"]`).attr("content") || $("title").text();
			} catch (e) {
				req.logger.warn(`Title finder: ${e} `);
			}

			try {
				description = $(`meta[property="og:description"]`).attr("content") || $(`meta[name="description"]`).attr("content");
			} catch (e) {
				req.logger.warn(`Description finder: ${e} `);
			}

			try {
				thumbnail = await getImageData($(`meta[property="og:image"]`).attr("content"));
			} catch (e) {
				req.logger.warn(`Thumbnail finder: ${e} `);
			}

			try {
				const favicons = $("link").toArray().filter((el) => el.attributes.find((value) => value.name == "rel")?.value?.includes("icon"));

				let bestFavicon = null;

				for (const el of favicons) {
					const favicon = {
						rel: el.attributes.find((value) => value.name == "rel")?.value,
						sizes: el.attributes.find((value) => value.name == "sizes")?.value,
						url: el.attributes.find((value) => value.name == "href")?.value
					};

					if ((!bestFavicon) && favicon.url.endsWith(".svg")) bestFavicon = favicon;
					else if ((!bestFavicon || bestFavicon.url.endsWith(".svg")) && favicon.url.endsWith(".ico")) bestFavicon = favicon;
					else if (favicon.url.endsWith(".png")) {
						try {
							if (!bestFavicon || bestFavicon.url.endsWith(".svg") || bestFavicon.url.endsWith(".ico")) bestFavicon = favicon;
							else if (!bestFavicon.sizes && favicon.sizes) bestFavicon = favicon;
							else if (favicon.sizes && Number(bestFavicon.sizes.split(" ")[0].split("x")[0]) > Number(favicon.sizes.split(" ")[0].split("x")[0]) && Number(favicon.sizes.split(" ")[0].split("x")[0]) >= 32) bestFavicon = favicon;
						} catch (e) {
							req.logger.warn(`Favicon finder - PNG: ${e}`);
						}
					}
				}

				icon = await getImageData(bestFavicon?.url, 64, 64, htmlUrl.origin);
			} catch (e) {
				req.logger.warn(`Favicon finder: ${e} `);
			}
		} catch (e) {
			req.logger.warn(`Failed to get HTML: ${e} `);
		}
	} catch {
		req.logger.warn("Invalid url");
	}

	res.status(200).json({
		title,
		description,
		favicon: icon,
		thumbnail
	});

	res.end();
});

exports.httpServer = require("firebase-functions/v2/https").onRequest({
	memory: "256MiB",
	region: "europe-west1",
	timeoutSeconds: 10
}, server);