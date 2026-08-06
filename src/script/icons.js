import { join } from "/script/path.js";
import { request } from "/script/request.js";

export const icons = {
	eye: {
		fill: "M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,168a40,40,0,1,1,40-40A40,40,0,0,1,128,168Z"
	},
	star: {
		fill: "M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z"
	},
	brand: {
		blender_community_badge: null,
		discord: null,
		github: null,
		youtube: null
	}
};

export const parseIcon = (iconElement) => {
	if (iconElement.dataset.done) return;

	if (iconElement.dataset.style === "brand") {
		iconElement.dataset.style = iconElement.dataset.icon;
		iconElement.dataset.icon = "brand";
	}

	const name = iconElement.dataset.icon;
	if (!name || !icons[name]) return;

	const icon = icons[name][iconElement.dataset.style || "fill"];
	if (!icon) return;

	let iconHTML;

	switch (iconElement.dataset.style) {
		case "fill":
			iconHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256"><path fill="currentColor" d="${icon}"/></svg>`;
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