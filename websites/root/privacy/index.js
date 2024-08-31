import { init } from "/lib/main.js";
import { RichLink } from "/lib/rich.js";

addEventListener("DOMContentLoaded", async () => {
	const sleepingRichLinks = document.getElementsByClassName("sleepingRichLink");
	for (let x = 0; x < sleepingRichLinks.length; ++x) RichLink(new URL(sleepingRichLinks[x].href), sleepingRichLinks[x]);

	await init();
});