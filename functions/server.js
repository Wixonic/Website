const bodyParser = require("body-parser");
const cheerio = require("cheerio");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const http = require("http");
const https = require("https");
const sharp = require("sharp");

const localEnvironment = process.env.FUNCTIONS_EMULATOR == "true";

const server = express();
server.use(bodyParser.json());
server.use(cookieParser());
server.use(cors({
	credentials: true,
	origin: (origin, callback) => callback(null, origin)
}));

let requestId = 0;

server.get("/auth/token/", async (req, res) => {
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
		const user = await admin.auth().verifyIdToken(sessionCookie);
		req.logger.debug("Authenticated user:", user.uid);

		const token = await admin.auth().createCustomToken(user.uid);
		res.status(200).json({
			token
		});
	} catch (e) {
		req.logger.error("Failed to verify token:", e);
		return res.status(403).json({
			error: "Invalid or expired token"
		});
	}
});

server.post("/auth/token/", async (req, res) => {
	req.id = requestId++;
	req.logger = {
		debug: (...data) => console.log(`req${req.id}:`, ...data),
		info: (...data) => console.info(`req${req.id}:`, ...data),
		warn: (...data) => console.warn(`req${req.id}:`, ...data),
		error: (...data) => console.error(`req${req.id}:`, ...data)
	};

	const { email, password } = req.body;

	if (!email || !password) {
		req.logger.warn("Missing email or password");
		return res.status(400).json({
			error: "Missing email or password"
		});
	}

	// Login with email and password

	const expiresIn = 4 * 7 * 24 * 60 * 60 * 1000;

	const sessionCookie = null; // Create session cookie

	res.cookie("__session", sessionCookie, {
		domain: localEnvironment ? undefined : ".wixonic.fr",
		maxAge: expiresIn,
		httpOnly: true,
		secure: !localEnvironment,
		sameSite: localEnvironment ? "lax" : "none"
	});

	res.status(200).json({ status: "success" });
});

server.get("/rich/link", async (req, res) => {
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

module.exports = server;