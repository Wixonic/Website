import { init } from "/lib/main.js";
import loader from "/lib/loader.js";
import { path } from "/lib/path.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	const background = document.createElement("div");
	background.classList.add("fade");
	background.id = "background-hello";
	document.body.append(background);

	const image = await loader.image(new URL("/image/hello.png", localEnvironment ? path.local.assets : path.assets));
	image.alt = "Robot holding a sign saying hello.";
	image.classList.add("fade", "slide");
	image.id = "hello";
	background.append(image);

	const title = document.createElement("h1");
	title.innerHTML = "Wixonic";
	title.classList.add("fade", "slide");
	title.id = "title";
	document.body.append(title);
});