import loader from "/lib/loader.js";
import { path } from "/lib/path.js";
import request from "/lib/request.js";

const engine = {
	list: [],
	running: false,

	push: (el) => {
		engine.list.push(el);
		engine.run();
	},

	run: async () => {
		if (!engine.running) {
			engine.running = true;

			while (engine.list.length > 0) {
				const el = engine.list.shift();
				await el();
			}

			engine.running = false;
		}
	}
};

/**
 * @param {URL} url
 * @param {HTMLAnchorElement?} el
 * @returns {HTMLAnchorElement}
 */
const RichLink = (url, el) => {
	if (!el) el = document.createElement("a");

	el.classList.add("richlink");
	el.href = url.toString();

	const data = {
		title: null,
		description: null,
		thumbnail: null,
		favicon: null,
		update: false
	};

	let hoverEl = document.querySelector("div#richLinkHover");
	if (!hoverEl) {
		hoverEl = document.createElement("div");
		hoverEl.id = "richLinkHover";
		document.body.append(hoverEl);
	}

	engine.push(async () => {
		const result = await request("GET", new URL(`${localEnvironment ? "/wixonic-website-2/europe-west1" : ""}/httpServer/rich/link?url=${encodeURIComponent(url)}`, localEnvironment ? path.local.functions : path.functions), "json", "application/json", null, -1);

		data.title = result.response.title ?? "Unknown webpage";
		data.description = result.response.description ?? "No description";

		if (result.response.thumbnail) {
			data.thumbnail = await loader.image(result.response.thumbnail);
			data.thumbnail.classList.add("thumbnail");
		}

		if (result.response.favicon) {
			data.favicon = await loader.image(result.response.favicon);
			data.favicon.classList.add("favicon");
		}
	});

	el.addEventListener("mouseenter", (e) => {
		data.update = true;

		const hoverEl = document.querySelector("div#richLinkHover");

		const update = () => {
			if (data.update) {
				hoverEl.innerHTML = `<div class="title">${data.title ?? "Loading..."}</div><div class="description">${data.description ?? "This webpage is still loading, or an error occured."}</div>`;
				if (data.favicon) hoverEl.append(data.favicon);
				if (data.thumbnail) hoverEl.append(data.thumbnail);
				setTimeout(update, 500);
			}
		};

		update();
		hoverEl.style.opacity = "1";

		const elementBoundingBox = hoverEl.getBoundingClientRect();
		const targetBoundingBox = e.target.getBoundingClientRect();

		let x = targetBoundingBox.left + targetBoundingBox.width / 2 - elementBoundingBox.width / 2;
		let y = targetBoundingBox.top + targetBoundingBox.height + 10;

		if (y + elementBoundingBox.height + 10 >= innerHeight) y = targetBoundingBox.top - elementBoundingBox.height - 10;

		hoverEl.style.left = x + "px";
		hoverEl.style.top = y + "px";
	});

	el.addEventListener("mouseleave", () => {
		data.update = false;
		document.querySelector("div#richLinkHover").style.opacity = "";
	});

	return el;
};

export {
	RichLink
};