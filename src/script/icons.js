import { join } from "/script/path.js";
import { request } from "/script/request.js";

export const icons = {
	brand: {
		blender_community_badge: null,
		discord: null,
		github: null,
		gravatar: null,
		instagram: null,
		osu: null,
		reddit: null,
		tiktok: null,
		twitch: null,
		wakatime: null,
		youtube: null
	}
};

export const parseIcon = (iconElement) => {
	if (iconElement.dataset.done) return;

	const icon = iconElement.dataset.style == "brand" ? icons.brand[iconElement.dataset.icon] : (icons[iconElement.dataset.icon] ? icons[iconElement.dataset.icon][iconElement.dataset.style] : null);
	if (!icon) return;

	let iconHTML;

	switch (iconElement.dataset.style) {
		case "fill":
			iconHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="${icon}"/></svg>`;
			break;

		default:
			iconHTML = icon;
			break;
	}

	iconElement.innerHTML = iconHTML;
	iconElement.dataset.done = true;
};

const parseElement = (element) => {
	if (element.nodeType !== 1) return;
	if (element.classList.contains("icon")) parseIcon(element);
	element.querySelectorAll(".icon").forEach((iconElement) => parseIcon(iconElement));
};

export const init = async () => {
	await Promise.all(Object.entries(icons.brand).map(async ([name]) => {
		const req = await request("GET", join(path.assets, `raw/icon/${name}.svg`), "text");
		if (req.status === 200) icons.brand[name] = req.response;
	}));

	document.querySelectorAll(".icon").forEach((iconElement) => parseIcon(iconElement));

	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (mutation.type === "childList") mutation.addedNodes.forEach((node) => parseElement(node));
			else if (mutation.type === "attributes" && mutation.target.classList.contains("icon")) parseIcon(mutation.target);
		});
	});

	observer.observe(document.body, {
		attributes: true,
		attributeFilter: ["class", "data-icon", "data-style"],
		childList: true,
		subtree: true
	});
};