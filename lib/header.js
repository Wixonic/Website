import { path } from "/lib/path.js";
import { RichLink } from "/lib/rich.js";

const buttons = [
	{
		text: "News",
		url: new URL("/news/", localEnvironment ? path.local.root : path.root)
	},
	{
		text: "WixiLand",
		url: localEnvironment ? path.local.wixiLand : path.wixiLand
	}
];

const init = async () => {
	const header = document.createElement("header");
	document.body.append(header);

	const icon = await RichLink(localEnvironment ? path.local.root : path.root);
	icon.classList.add("fade", "slide", "icon");
	icon.innerHTML = `<img class="text" src="${new URL("/icon/logo.svg", localEnvironment ? path.local.assets : path.assets)}" alt="Wixonic's logo" />`;
	header.append(icon);

	const container = document.createElement("div");
	container.classList.add("container", "fade", "slide");
	header.append(container);

	for (const button of buttons) {
		const el = await RichLink(button.url);
		el.innerHTML = `<div class="text">${button.text}</div>`;
		container.append(el);
	}
};

export default {
	init
};