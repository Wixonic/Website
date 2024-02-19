import { init } from "/background.js";
import { error } from "/error.js";
import font from "/font.js";
import { loader } from "/loader.js";

window.addEventListener("load", () => {
	try {
		init();

		font()
			.catch((e) => console.error(`Failed to load font: ${e}`))
			.finally(loader.hide);
	} catch (e) {
		error({
			title: "Unknown error while DOMContentLoaded",
			message: "Something happend while loading the website.",
			code: 0,
			details: e.message,
		});
	}
}, { once: true });