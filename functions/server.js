const cheerio = require("cheerio");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const http = require("http");
const https = require("https");

const server = express();

const localEnvironment = process.env.FUNCTIONS_EMULATOR === "true";

server.use(cookieParser());

server.use(cors({
	credentials: true,
	origin: (origin, callback) => {
		console.log(`Request incomming from ${origin}`);

		if (localEnvironment && origin.match(/localhost:\d{4,6}$/m)) return callback(null, true);
		else if (origin.endsWith("wixonic.fr")) return callback(null, true);

		return callback(new Error("Origin not allowed"));
	},
	optionsSuccessStatus: 200
}));

server.get("/rich/link", async (req, res) => {
	let title = null;
	let description = null;
	let icon = null;
	let thumbnail = null;

	try {
		const queryUrl = new URL(req.query.url);

		const getHtml = (url) => new Promise((resolve, reject) => {
			const get = (url.protocol == "https:" ? https : http).get;

			const request = get(url, (response) => {
				if (String(response.statusCode).startsWith("3")) {
					getHtml(new URL(response.headers.location))
						.then(resolve)
						.catch(reject);
				} else {
					response.on("error", reject);

					const chunks = [];
					response.on("data", (chunk) => chunks.push(chunk));
					response.on("end", () => resolve(chunks.join("")));
				}
			});

			request.on("error", reject);
		});

		const html = await getHtml(queryUrl);

		const $ = cheerio.load(html);

		title = $(`meta[property="og:title"]`).attr("content") || $("title").text();
		description = $(`meta[property="og:description"]`).attr("content") || $(`meta[name="description"]`).attr("content");
		thumbnail = $(`meta[property = "og:image"]`).attr("content");

		const favicons = $(`link[rel="icon"], link[rel="apple-touch-icon"], link[rel="shortcut icon"]`);

		let bestFavicon = null;

		for (const el of favicons) {
			const favicon = {
				rel: el.attributes.find((value) => value.name == "rel")?.value,
				sizes: el.attributes.find((value) => value.name == "sizes")?.value,
				url: el.attributes.find((value) => value.name == "href")?.value
			};

			if (favicon.url.endsWith(".svg")) {
				bestFavicon = favicon;
				break;
			}

			try {
				if (favicon.url.endsWith(".png")) {
					if (!bestFavicon) bestFavicon = favicon;
					else if (!bestFavicon.sizes && favicon.sizes) bestFavicon = favicon;
					else if (favicon.sizes && Number(bestFavicon.sizes.split(" ")[0].split("x")[0]) > Number(favicon.sizes.split(" ")[0].split("x")[0])) bestFavicon = favicon;
				}
			} catch (e) {
				console.warn(`Favicon finder - PNG: ${e}`);
			}
		}

		icon = bestFavicon?.url;
	} catch (e) {
		console.warn(`Favicon finder: ${e}`);
	}

	res.writeHead(200, {
		"content-type": "application/json"
	});

	res.write(JSON.stringify({
		title,
		description,
		favicon: icon,
		thumbnail
	}));

	res.end();
});

module.exports = server;