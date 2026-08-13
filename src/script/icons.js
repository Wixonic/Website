import { join } from "/script/path.js";
import { request } from "/script/request.js";

export const icons = {
	"address-book": {
		fill: "M160,112a24,24,0,1,1-24-24A24,24,0,0,1,160,112Zm64-72V216a16,16,0,0,1-16,16H64a16,16,0,0,1-16-16V192H32a8,8,0,0,1,0-16H48V136H32a8,8,0,0,1,0-16H48V80H32a8,8,0,0,1,0-16H48V40A16,16,0,0,1,64,24H208A16,16,0,0,1,224,40ZM190.4,163.2A67.88,67.88,0,0,0,163,141.51a40,40,0,1,0-53.94,0A67.88,67.88,0,0,0,81.6,163.2a8,8,0,1,0,12.8,9.6,52,52,0,0,1,83.2,0,8,8,0,1,0,12.8-9.6Z"
	},
	eye: {
		fill: "M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,168a40,40,0,1,1,40-40A40,40,0,0,1,128,168Z"
	},
	"shirt-folded": {
		fill: "M201,40H179.35L165.66,26.34A8,8,0,0,0,160,24H96a8,8,0,0,0-5.66,2.34L76.65,40H55A15,15,0,0,0,40,55V209a15,15,0,0,0,15,15h61a4,4,0,0,0,4-4V104.27A8.18,8.18,0,0,1,127.47,96a8,8,0,0,1,8.53,8V220a4,4,0,0,0,4,4h61a15,15,0,0,0,15-15V55A15,15,0,0,0,201,40ZM86.54,107.08A4,4,0,0,1,80,104V59.31L95.24,44.07l23.47,35.21ZM128,80h0v0Zm48,24a4,4,0,0,1-2.3,3.63,3.93,3.93,0,0,1-4.21-.51l-32.2-27.82,23.47-35.21L176,59.31Z"
	},
	star: {
		fill: "M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z"
	},
	"tip-jar": {
		fill: "M184,48.81V32a16,16,0,0,0-16-16H88A16,16,0,0,0,72,32V48.81A40.05,40.05,0,0,0,40,88V200a40,40,0,0,0,40,40h96a40,40,0,0,0,40-40V88A40.05,40.05,0,0,0,184,48.81ZM120,32h16V48H120ZM88,32h16V48H88Zm48,152v8a8,8,0,0,1-16,0v-8h-8a8,8,0,0,1,0-16h24a8,8,0,0,0,0-16H120a24,24,0,0,1,0-48V96a8,8,0,0,1,16,0v8h8a8,8,0,0,1,0,16H120a8,8,0,0,0,0,16h16a24,24,0,0,1,0,48ZM168,48H152V32h16Z"
	},

	brand: {
		blender_community_badge: null,
		discord: null,
		github: null,
		osu: null,
		reddit: null,
		twitch: null,
		wakatime: null,
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