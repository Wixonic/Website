import background from "/background.js";
import error from "/error.js";
import firebase from "/firebase.js";
import font from "/font.js";
import footer from "/footer.js";
import loader from "/loader.js";
import pages from "/pages.js";

window.addEventListener("load", async () => {
	try {
		pages.init();

		try {
			await font();
		} catch (e) {
			console.error(`Failed to load font: ${e}`);
		}

		background.init();
		footer.init();

		try {
			await firebase.init();
		} catch (e) {
			error({
				title: "Error in firebase engine",
				message: "Something wrong happened while loading dynamic resources",
				code: 2,
				details: e
			});
		}

		loader.hide();
	} catch (e) {
		error({
			title: "Unhandled error while DOMContentLoaded",
			message: "Something happend while loading the website",
			code: 1,
			details: e
		});
	}
}, { once: true });