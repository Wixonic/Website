const cheerio = require("cheerio");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const http = require("http");
const https = require("https");
const sharp = require("sharp");

const localEnvironment = process.env.FUNCTIONS_EMULATOR === "true";

const server = express();

server.use(cookieParser());
server.use(cors({
	credentials: true,
	origin: "*",
	optionsSuccessStatus: 200
}));

let requestId = 0;

server.get("/rich/link", async (req, res) => {
	req.id = requestId++;
	req.log = (...data) => console.log(`req${req.id}`, ...data);
	req.info = (...data) => console.info(`req${req.id}`, ...data);
	req.warn = (...data) => console.warn(`req${req.id}`, ...data);
	req.error = (...data) => console.error(`req${req.id}`, ...data);

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
					"accept-language": "en-US,en-GB,en"
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
		getWithRedirects(localEnvironment ? url?.replace("https://assets.wixonic.fr", "http://localhost:2012") : url, localEnvironment ? host?.replace("https://assets.wixonic.fr", "http://localhost:2012") : host)
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
				req.warn(`Title finder: ${e} `);
			}

			try {
				description = $(`meta[property="og:description"]`).attr("content") || $(`meta[name="description"]`).attr("content");
			} catch (e) {
				req.warn(`Description finder: ${e} `);
			}

			try {
				thumbnail = await getImageData($(`meta[property="og:image"]`).attr("content"));
			} catch (e) {
				req.warn(`Thumbnail finder: ${e} `);
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
							req.warn(`Favicon finder - PNG: ${e}`);
						}
					}
				}

				icon = await getImageData(bestFavicon?.url, 64, 64, htmlUrl.origin);
			} catch (e) {
				req.warn(`Favicon finder: ${e} `);
			}
		} catch (e) {
			req.warn(`Failed to get HTML: ${e} `);
		}
	} catch {
		req.warn("Invalid url");
	}

	res.writeHead(200, {
		"access-control-allow-origin": "*",
		"content-type": "application/json",
		"cache-control": "max-age=604800"
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