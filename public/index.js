import background from "/background.js";
import error from "/error.js";
import firebase from "/firebase.js";
import font from "/font.js";
import loader from "/loader.js";

window.addEventListener("load", async () => {
	try {
		background.init();
		
		try {
			await firebase.init();
		} catch (e) {
			error({
				title: "Failed to start firebase engine",
				message: "Something wrong happened while loading dynamic resources",
				code: 2,
				details: e.message
			});
		}

		try {
			await font();
		} catch (e) {
			console.error(`Failed to load font: ${e}`);
		}
		
		loader.hide();
	} catch (e) {
		error({
			title: "Unknown error while DOMContentLoaded",
			message: "Something happend while loading the website",
			code: 1,
			details: e.message,
		});
	}
}, { once: true });