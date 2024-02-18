import { error } from "/error.js";
import { loader } from "/loader.js";

window.addEventListener("DOMContentLoaded", () => {
	try {
		const background = document.querySelector("canvas#background");
		const ctx = background.getContext("2d");

		loader.hide();
	} catch (e) {
		error({
			title: "Unknown error while DOMContentLoaded",
			message: "Something happend while loading the website.",
			code: 0,
			details: e.message,
		});
	}
}, { once: true });