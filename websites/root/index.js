import { init } from "/lib/main.js";
import loader from "/lib/loader.js";
import { path } from "/lib/path.js";
import { RichLink } from "/lib/rich.js";
import request from "/lib/request.js";

let currentActivities = {};
const activityChanged = (type, activity) => {
	const previousActivity = currentActivities[type];
	let changed = false;

	changed ||= activity.applicationId != previousActivity?.applicationId;
	changed ||= activity.assets?.small_image != previousActivity?.assets?.small_image;
	changed ||= activity.assets?.small_text != previousActivity?.assets?.small_text;
	changed ||= activity.assets?.large_image != previousActivity?.assets?.large_image;
	changed ||= activity.assets?.large_text != previousActivity?.assets?.large_text;
	changed ||= activity.timestamps?.start != previousActivity?.timestamps?.start;
	changed ||= activity.timestamps?.end != previousActivity?.timestamps?.end;
	changed ||= activity.name != previousActivity?.name;
	changed ||= activity.details != previousActivity?.details;
	changed ||= activity.state != previousActivity?.state;
	changed ||= activity.type != previousActivity?.type;

	return changed;
};

addEventListener("DOMContentLoaded", async () => {
	await init();

	const main = document.querySelector("main");

	await (async () => {
		const section = document.createElement("section");
		section.classList.add("fade");
		section.id = "activity";

		const cycle = async () => {
			try {
				const req = await request("GET", new URL("/activity/", localEnvironment ? path.local.server : path.server), null, null, null, -1, false);

				const activities = JSON.parse(req.response);

				let changed = false;
				for (const type in activities) changed ||= activityChanged(type, activities[type]);
				for (const type in currentActivities) changed ||= !activities[type];

				if (changed) {
					currentActivities = activities;

					const els = [];
					for (const type in activities) {
						const activity = activities[type];

						const el = document.createElement("activity");
						el.classList.add("fade", "slide", type);

						switch (type) {
							case "music":
								el.innerHTML = activity.name;
								els.push(el);
								break;
						}
					}

					if (els.length < 1) throw "Empty";

					section.innerHTML = "";

					const title = document.createElement("h3");
					title.classList.add("fade", "slide");
					title.innerHTML = "Live Activities";
					section.append(title);

					section.append(...els);

					if (!main.contains(section)) main.prepend(section);
				}
			} catch (e) {
				if (main.contains(section)) main.removeChild(section);
				console.log("Activity not available:", e);
			}

			setTimeout(cycle, 5000);
		};

		await cycle();
	})();

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
		link.classList.add("fade", "slide", "button");
		link.innerHTML = "Discover WixiLand";
		description.append(link);

		const image = await loader.image(new URL("/image/discord.png", localEnvironment ? path.local.assets : path.assets));
		image.alt = "Robot holding a sign.";
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
		link.classList.add("fade", "slide", "button");
		link.innerHTML = "See open-source projects";
		description.append(link);

		const image = await loader.image(new URL("/image/github.png", localEnvironment ? path.local.assets : path.assets));
		image.alt = "Logo of GitHub in 3D";
		image.classList.add("fade", "slide");
		section.append(image);
	})();
});