import { init } from "/lib/main.js";
import loader from "/lib/loader.js";
import { path } from "/lib/path.js";
import { RichLink } from "/lib/rich.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	const text = document.createElement("main");
	text.classList.add("fade", "slide");
	text.innerHTML = `<h1>Oops!</h1><p>Seems that this Wixi had the same error, maybe this page doesn't exist anymore?</p>`;
	document.body.append(text);

	const link = await RichLink(localEnvironment ? path.local.root : path.root);
	link.classList.add("button", "fade", "slide");
	link.innerHTML = "Travel to an existing location";
	text.append(link);

	const image = await loader.image(new URL("/image/404.png", localEnvironment ? path.local.assets : path.assets));
	image.alt = "Robot watching a 404 page, meaning that the page is not found.";
	image.classList.add("fade", "slide");
	document.body.append(image);
});