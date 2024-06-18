import loader from "/lib/loader.js";
import { path } from "/lib/path.js";
import request from "/lib/request.js";

/**
 * @param {HTMLAnchorElement} el
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
		favicon: null
	};

	const display = async (e) => {
		hoverEl.innerHTML = `<div class="title fade">${data.title ?? "Unknown webpage"}</div><div class="description fade">${data.description ?? "No description"}</div>`;
		if (data.favicon) hoverEl.append(data.favicon);
		if (data.thumbnail) hoverEl.append(data.thumbnail);
		hoverEl.style.display = "";

		const elementBoundingBox = hoverEl.getBoundingClientRect();
		const targetBoundingBox = e.target.getBoundingClientRect();

		let x = targetBoundingBox.left + targetBoundingBox.width / 2 - elementBoundingBox.width / 2;
		let y = targetBoundingBox.top + targetBoundingBox.height + 10;

		if (y + elementBoundingBox.height + 10 >= innerHeight) y = innerHeight - elementBoundingBox.height - 10;

		hoverEl.style.left = x + "px";
		hoverEl.style.top = y + "px";
	};

	const hide = () => hoverEl.style.display = "none";

	let hoverEl = document.querySelector("div#richLinkHover");
	if (!hoverEl) {
		hoverEl = document.createElement("div");
		hoverEl.id = "richLinkHover";
		hide();
		document.body.append(hoverEl);
	}

	(async () => {
		const result = await request("GET", new URL(`/rich/link?url=${encodeURIComponent(url)}`, localEnvironment ? path.local.functions : path.functions), "json", "application/json", null, 0);

		data.title = result.response.title ?? "Unknown webpage";
		data.description = result.response.description ?? "No description";

		if (result.response.thumbnail) {
			data.thumbnail = await loader.image(result.response.thumbnail);
			data.thumbnail.classList.add("thumbnail", "fade");
		}

		if (result.response.favicon) {
			data.favicon = await loader.image(result.response.favicon);
			data.favicon.classList.add("favicon", "fade");
		}
	})();

	el.addEventListener("mouseenter", display);
	el.addEventListener("mouseleave", hide);

	return el;
};

export {
	RichLink
};