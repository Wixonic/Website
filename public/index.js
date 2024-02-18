let state = "loading";
let error = null;

const cancelDB = {};

window.addEventListener("DOMContentLoaded", () => {
	try {
		const background = document.querySelector("canvas#background");
		const ctx = background.getContext("2d");
		const sections = {
			error: document.querySelector("section#error"),
			resize: document.querySelector("section#resize"),
		};

		const stopResize = () => {
			try {
				sections.resize.removeAttribute("active");
				state = "idle";
			} catch (e) {
				console.error(e);
				state = "error";
				error = {
					title: "Unknown error while stopping resize",
					message: "The website failed to update while resizing",
					code: 4,
					details: e.message,
				};
			}
		};

		window.addEventListener("resize", () => {
			state = "resize";
			clearTimeout(cancelDB.resize);
			sections.resize.setAttribute("active", "true");
			cancelDB.resize = setTimeout(stopResize, 1000);
		});

		window.addEventListener("DOMContentLoaded", () => {
			console.error("Multiple DOMContentLoaded");
			state = "error";
			error = {
				title: "Multiple Load",
				message: "The website loaded a second time, really weird",
				code: 2,
				details: "Second DOMContentLoaded event",
			};
		});

		const update = () => {
			try {
				switch (state) {
					case "error":
						sections.error.querySelector(".code").innerHTML = `Error code: ${error.code}`;
						sections.error.querySelector(".message").innerHTML = error.message;
						sections.error.setAttribute("active", "true");
						break;

					case "loading":
						break;

					default:
						console.error(`Unknown state: ${state}`);
						state = "error";
						error = {
							title: "Unknown state",
							message: "The website is in an unknown state",
							code: 1,
							details: `state = "${state}"`,
						};
						break;
				}
			} catch (e) {
				console.error(e);
				state = "error";
				error = {
					title: "Unknown error while update",
					message: "Something happend while updating the website",
					code: 3,
					details: e.message,
				};
			}

			if (state != "error") requestAnimationFrame(update);
		};

		update();

		a
	} catch (e) {
		console.error(e);
		state = "error";
		error = {
			title: "Unknown error while DOMContentLoaded",
			message: "Something happend while loading the website",
			code: 0,
			details: e.message,
		};
	}
}, { once: true });