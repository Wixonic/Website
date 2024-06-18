import { init } from "/lib/main.js";
import loader from "/lib/loader.js";
import { path } from "/lib/path.js";
import { RichLink } from "/lib/rich.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	await (async () => {
		const section = await RichLink(localEnvironment ? path.local.wixiland : path.wixiland);
		section.classList.add("fade");
		section.id = "wixiland";
		document.body.append(section);

		const title = document.createElement("h2");
		title.classList.add("fade", "slide");
		title.innerHTML = "WixiLand";
		section.append(title);

		const description = document.createElement("p");
		description.classList.add("fade", "slide");
		description.innerHTML = "Land with one click in a futuristic universe and be part of a wonderful community on Discord, or anywhere. Find a place in it, or watch from afar what's happening. In either case, you are welcome.";
		section.append(description);

		const image = await loader.image(new URL("/image/hello.png", localEnvironment ? path.local.assets : path.assets));
		image.alt = "Robot holding a sign saying hello.";
		image.classList.add("fade", "slide");
		section.append(image);
	})();
});