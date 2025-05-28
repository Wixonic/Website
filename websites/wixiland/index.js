import { init } from "/lib/main.js";
import loader from "/lib/loader.js";
import { path } from "/lib/path.js";
import { RichLink } from "/lib/rich.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	const main = document.querySelector("main");

	await (async () => {
		const wikiSection = document.createElement("section");
		wikiSection.classList.add("fade");
		wikiSection.id = "wiki";
		main.append(wikiSection);

		const wikiTitle = document.createElement("h2");
		wikiTitle.classList.add("fade", "slide");
		wikiTitle.innerHTML = "Wiki";
		wikiSection.append(wikiTitle);

		const wikiDescription = document.createElement("p");
		wikiDescription.classList.add("fade", "slide");
		wikiDescription.innerHTML = "Lore, technical details, facts...<br />Everything you want to know about WixiLand.<br /><br />";
		wikiSection.append(wikiDescription);

		const wikiLink = await RichLink(new URL("/wiki", localEnvironment ? path.local.wixiLand : path.wixiLand));
		wikiLink.target = "_blank";
		wikiLink.classList.add("fade", "button");
		wikiLink.innerHTML = "Take a look Inside";
		wikiDescription.append(wikiLink);

		const wikiImage = await loader.image(new URL("/icon/wixiland/1024.png", localEnvironment ? path.local.assets : path.assets));
		wikiImage.alt = "Logo of Inside, Wixies' home.";
		wikiImage.classList.add("fade", "slide");
		wikiSection.append(wikiImage);
	})();

	await (async () => {
		const joinSection = document.createElement("section");
		joinSection.classList.add("fade");
		joinSection.id = "join";
		main.append(joinSection);

		const joinTitle = document.createElement("h2");
		joinTitle.classList.add("fade", "slide");
		joinTitle.innerHTML = "Discord";
		joinSection.append(joinTitle);

		const joinDescription = document.createElement("p");
		joinDescription.classList.add("fade", "slide");
		joinDescription.innerHTML = "Land with one click in a futuristic universe and be part of a wonderful community on Discord, or anywhere. Find a place in it, or watch from afar what's happening. In either case, you are welcome.<br /><br />";
		joinSection.append(joinDescription);

		const joinLink = await RichLink(new URL("/discord", localEnvironment ? path.local.redirects : path.redirects));
		joinLink.classList.add("fade", "button");
		joinLink.innerHTML = "Join WixiLand";
		joinDescription.append(joinLink);

		const helloImage = await loader.image(new URL("/image/discord.png", localEnvironment ? path.local.assets : path.assets));
		helloImage.alt = "Robot holding a sign saying hello.";
		helloImage.classList.add("fade", "slide");
		joinSection.append(helloImage);
	})();
});