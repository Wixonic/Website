import background from "/lib/background.js";
import error from "/lib/error.js";
import firebase from "/lib/firebase.js";
import font from "/lib/font.js";
import footer from "/lib/footer.js";
import header from "/lib/header.js";
import loader from "/lib/loader.js";
import pages from "/lib/pages.js";
import status from "/lib/status.js";

import content from "./content.js";

window.addEventListener("load", async () => {
	try {
		try {
			await font();
		} catch (e) {
			error({
				title: "Error while loading",
				message: "Failed to load font",
				code: 4,
				details: e
			});
		}

		try {
			await firebase.init();

			try {
				await background.init();
				await content.init();
				await footer.init();
				await header.init();
				await pages.init();
				await status.init();

				loader.hide();
			} catch (e) {
				error({
					title: "Error in loading process",
					message: "Failed to load dynamic resources",
					code: 3,
					details: e
				});
			}
		} catch (e) {
			error({
				title: "Error in firebase engine",
				message: "Something wrong happened while initializing dynamic resources",
				code: 2,
				details: e
			});
		}
	} catch (e) {
		error({
			title: "Unhandled error while DOMContentLoaded",
			message: "Something happend while loading the website",
			code: 1,
			details: e
		});
	}
}, { once: true });