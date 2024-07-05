import { init } from "/lib/main.js";
import loader from "/lib/loader.js";
import { path } from "/lib/path.js";
import { RichLink } from "/lib/rich.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	const main = document.querySelector("main");

	await (async () => {
		const section = document.createElement("section");
		section.classList.add("fade");
		section.id = "wixiland";
		main.append(section);

		const title = document.createElement("h2");
		title.classList.add("fade", "slide");
		title.innerHTML = "WixiLand";
		section.append(title);

		const description = document.createElement("p");
		description.classList.add("fade", "slide");
		description.innerHTML = "Land with one click in a futuristic universe and be part of a wonderful community on Discord, or anywhere. Find a place in it, or watch from afar what's happening. In either case, you are welcome.<br /><br />";
		section.append(description);

		const link = await RichLink(localEnvironment ? path.local.wixiLand : path.wixiLand);
		link.classList.add("fade", "slide");
		link.innerHTML = "Join WixiLand";
		description.append(link);

		const image = await loader.image(new URL("/image/hello.png", localEnvironment ? path.local.assets : path.assets));
		image.alt = "Robot holding a sign saying hello.";
		image.classList.add("fade", "slide");
		section.append(image);
	})();

	await (async () => {
		const section = document.createElement("section");
		section.classList.add("fade");
		section.id = "github";
		main.append(section);

		const title = document.createElement("h2");
		title.classList.add("fade", "slide");
		title.innerHTML = "Projects";
		section.append(title);

		const description = document.createElement("p");
		description.classList.add("fade", "slide");
		description.innerHTML = "Searching for small or archived projects?<br />This is the place to go.<br /><br />";
		section.append(description);

		const link = await RichLink(new URL("/github", localEnvironment ? path.local.redirects : path.redirects));
		link.classList.add("fade", "slide");
		link.innerHTML = "See open-source projects";
		description.append(link);

		const image = await loader.image(new URL("/image/github.png", localEnvironment ? path.local.assets : path.assets));
		image.alt = "Logo of GitHub in 3D";
		image.classList.add("fade", "slide");
		section.append(image);
	})();
});