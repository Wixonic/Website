import { init } from "/lib/main.js";
import loader from "/lib/loader.js";
import { path } from "/lib/path.js";
import { RichLink } from "/lib/rich.js";
import request from "/lib/request.js";

let currentActivities = {};
let currentActivityIntervals = [];
const activityChanged = (type, activity) => {
	const previousActivity = currentActivities[type];
	let changed = false;

	changed ||= activity.applicationId != previousActivity?.applicationId;
	changed ||= activity.assets?.small_image != previousActivity?.assets?.small_image;
	changed ||= activity.assets?.small_text != previousActivity?.assets?.small_text;
	changed ||= activity.assets?.large_image != previousActivity?.assets?.large_image;
	changed ||= activity.assets?.large_text != previousActivity?.assets?.large_text;
	changed ||= Math.floor((activity.timestamps?.start ?? 0) / 10000) != Math.floor((previousActivity?.timestamps?.start ?? 0) / 10000);
	changed ||= Math.floor((activity.timestamps?.end ?? 0) / 10000) != Math.floor((previousActivity?.timestamps?.end ?? 0) / 10000);
	changed ||= activity.name != previousActivity?.name;
	changed ||= activity.details != previousActivity?.details;
	changed ||= activity.state != previousActivity?.state;
	changed ||= activity.type != previousActivity?.type;

	return changed;
};

const compileAsset = (url) => {
	switch (true) {
		case url == "spotify:null":
			url = null;
			break;

		case url.startsWith("spotify:"):
			url = url.replace("spotify:", "https://i.scdn.co/image/");
			break;
	}

	return url;
};

const compileDuration = (duration) => {
	const hours = Math.floor(duration / 60 / 60 / 1000);
	const minutes = Math.floor(duration / 60 / 1000) % 60;
	const seconds = Math.floor(duration / 1000) % 60;

	return `${hours > 0 ? hours + ":" : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

addEventListener("DOMContentLoaded", async () => {
	await init();

	const main = document.querySelector("main");

	await (async () => {
		const section = document.createElement("section");
		section.classList.add("fade");
		section.id = "activities";

		const title = document.createElement("h3");
		title.classList.add("fade", "slide", "glow");
		title.innerHTML = "Live Activities";
		section.append(title);

		const activityContainer = document.createElement("container");
		activityContainer.id = "activityContainer";
		section.append(activityContainer);

		const cycle = async () => {
			try {
				const req = await request("GET", new URL("/activity/", localEnvironment ? path.local.server : path.server), null, null, null, -1, false);

				const activities = JSON.parse(req.response);

				let changed = false;
				for (const type in activities) changed ||= activityChanged(type, activities[type]);
				for (const type in currentActivities) changed ||= !activities[type];

				if (changed) {
					title.classList.remove("glow");
					void title.offsetWidth;
					title.classList.add("glow");

					for (const interval of currentActivityIntervals ?? []) clearInterval(interval);
					currentActivityIntervals = [];
					currentActivities = activities;

					const els = [];
					for (const type in activities) {
						const activity = activities[type];
						console.log(activity);

						const el = document.createElement("activity");
						el.classList.add("fade", "slide", type);

						switch (type) {
							case "music":
								{
									let current = Date.now() - (activity.timestamps?.start ?? 0);
									const duration = (activity.timestamps?.end ?? 0) - (activity.timestamps?.start ?? 0);
									if (current > duration) current = duration;

									const thumbnail = document.createElement("img");
									thumbnail.classList.add("thumbnail");
									thumbnail.src = compileAsset(activity.assets?.large_image) ?? compileAsset(activity.assets?.small_image);
									el.append(thumbnail);

									const title = document.createElement("div");
									title.classList.add("title");
									title.innerText = activity.name;
									el.append(title);

									const artists = document.createElement("div");
									artists.classList.add("artists");
									artists.innerText = activity.state;
									el.append(artists);

									const album = document.createElement("div");
									album.classList.add("album");
									album.innerText = activity.assets?.large_text ?? "";
									el.append(album);

									const start = document.createElement("div");
									start.classList.add("start");
									start.innerText = compileDuration(current);
									el.append(start);

									const end = document.createElement("div");
									end.classList.add("end");
									end.innerText = compileDuration(duration);
									el.append(end);

									const bar = document.createElement("div");
									bar.classList.add("bar");

									const innerBar = document.createElement("div");
									innerBar.classList.add("innerBar");
									innerBar.style.width = `${duration == 0 ? 50 : current / duration * 100}%`;
									bar.append(innerBar);

									el.append(bar);

									els.push(el);
									currentActivityIntervals.push(setInterval(() => {
										current = Date.now() - (activity.timestamps?.start ?? 0);
										if (current > duration) current = duration;
										start.innerText = compileDuration(current);
										innerBar.style.width = `${duration == 0 ? 50 : current / duration * 100}%`;
									}, 1000));
								}
								break;
						}
					}

					if (els.length < 1) throw "Empty";

					activityContainer.innerHTML = "";
					activityContainer.append(...els);

					if (!main.contains(section)) main.prepend(section);
					document.body.classList.add("hasLiveActivities");
				}
			} catch (e) {
				console.log("Activity not available:", e);

				if (main.contains(section)) main.removeChild(section);
				document.body.classList.remove("hasLiveActivities");
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