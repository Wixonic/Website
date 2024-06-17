import { init } from "/lib/main.js";
import loader from "/lib/loader.js";
import { path } from "/lib/path.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	const text = document.createElement("div");
	text.classList.add("slide");
	text.innerHTML = `<h1>Oops!</h1><p>Seems that this Wixi had the same error, maybe this page doesn't exist anymore?</p><a href="${localEnvironment ? path.local.root : path.root}" class="button">Travel to an existing location</a>`;
	document.body.append(text);

	const image = await loader.image(new URL("/image/404.png", localEnvironment ? path.local.assets : path.assets));
	image.alt = "Robot watching a 404 page, meaning that the page is not found.";
	image.classList.add("fade", "slide");
	document.body.append(image);
});