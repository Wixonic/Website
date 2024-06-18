import loader from "/lib/loader.js";
import { path } from "/lib/path.js";
import { RichLink } from "/lib/rich.js";

const buttons = [
	{
		alt: "Wixonic's icon",
		image: new URL("/icon/logo.svg", localEnvironment ? path.local.assets : path.assets),
		text: "Home",
		url: localEnvironment ? path.local.root : path.root
	},
	{
		alt: "A robot icon",
		image: new URL("/icon/wixiland.svg", localEnvironment ? path.local.assets : path.assets),
		text: "WixiLand",
		url: localEnvironment ? path.local.wixiland : path.wixiland
	}
];

const init = async () => {
	const header = document.createElement("header");
	document.body.append(header);

	const container = document.createElement("div");
	container.classList.add("container", "fade", "slide");
	header.append(container);

	for (const button of buttons) {
		const el = await RichLink(button.url);

		const img = await loader.image(button.image);
		img.classList.add("fade", "slide");
		img.alt = button.alt;
		img.title = button.text;
		el.append(img);

		container.append(el);
	}
};

export default {
	init
};