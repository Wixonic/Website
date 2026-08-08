import { getDiscordProfile } from "/script/discord.profile.js";
import logger from "/script/logger.js";
import { join } from "/script/path.js";
import storage from "/script/storage.js";
import { parseDuration } from "/script/utils.js";

const loadProject = {
	blender: async (data) => {
		const containerElement = document.createElement("article");
		containerElement.classList.add("project", "blender");

		const titleElement = document.createElement("div");
		titleElement.classList.add("title");

		const statusElement = document.createElement("div");
		statusElement.classList.add("status", data.status.toLowerCase());
		statusElement.textContent = data.status;

		const summaryElement = document.createElement("div");
		summaryElement.classList.add("summary");

		if ((data.redacted ?? []).includes("title")) {
			titleElement.classList.add("redacted");
			titleElement.innerText = "REDACTED Project"
		} else titleElement.textContent = data.name ?? "Unknown Project";

		if ((data.redacted ?? []).includes("summary")) {
			summaryElement.classList.add("redacted");
			summaryElement.innerText = "This project is private and cannot be displayed, and it's not by looking at the source code that you can see it either. >:(";
		} else summaryElement.textContent = data.summary ?? "No description provided.";

		const blenderElement = document.createElement("div");
		blenderElement.classList.add("blender", "icon");
		blenderElement.dataset.icon = "blender_community_badge";
		blenderElement.dataset.style = "brand";
		blenderElement.addEventListener("click", (event) => event.stopPropagation());

		containerElement.append(titleElement, statusElement, summaryElement, blenderElement);
		return containerElement;
	},
	github: async (owner, repo) => {
		const cacheKey = `github-project-${owner}_${repo}`;

		let response, data;
		const cached = storage.getItem(cacheKey);
		if (cached) {
			const cache = JSON.parse(cached);
			if (Date.now() - cache.timestamp < 1000 * 60 * 15) response = {
				ok: cache.ok
			};
			data = cache.data;
		}

		if (!response) {
			try {
				response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
				data = await response.json();
				if (response.status != 403) storage.setItem(cacheKey, JSON.stringify({ ok: response.ok, timestamp: Date.now(), data }));
			} catch (error) {
				response = { ok: false };
				logger.error(`Failed to load project ${owner}/${repo}`, error.message, error.trace);
			}
		}

		const containerElement = document.createElement("article");
		containerElement.classList.add("project", "github");

		containerElement.addEventListener("click", () => open(`https://github.com/${owner}/${repo}`, "_blank", "noopener noreferrer"));

		const headerElement = document.createElement("div");
		headerElement.classList.add("header");

		const avatarElement = document.createElement("img");
		avatarElement.classList.add("avatar");

		const titleElement = document.createElement("div");
		titleElement.classList.add("title");
		{
			const ownerElement = document.createElement("a");
			ownerElement.classList.add("author", "stealth");
			ownerElement.textContent = owner;
			ownerElement.href = `https://github.com/${owner}`;
			ownerElement.target = "_blank";
			ownerElement.rel = "noopener noreferrer";
			ownerElement.addEventListener("click", (event) => event.stopPropagation());

			const titleSeparator = document.createElement("span");
			titleSeparator.classList.add("separator");
			titleSeparator.textContent = "/";

			const repoElement = document.createElement("span");
			repoElement.classList.add("name");
			repoElement.textContent = repo;

			titleElement.append(ownerElement, titleSeparator, repoElement);
		}

		const statusElement = document.createElement("div");
		statusElement.classList.add("status");

		const summaryElement = document.createElement("div");
		summaryElement.classList.add("summary");

		if (response.ok) {
			avatarElement.src = data.owner.avatar_url;

			if (data.archived) statusElement.classList.add("archived");
			statusElement.textContent = data.private ? "Private" : (data.archived ? "Archived" : "Public");

			{
				const starsElement = document.createElement("div");
				starsElement.classList.add("stars");

				const starsAmountElement = document.createElement("span");
				starsAmountElement.classList.add("amount");
				starsAmountElement.textContent = data.stargazers_count;

				const starsSeparatorElement = document.createElement("span");
				starsSeparatorElement.classList.add("icon");
				starsSeparatorElement.dataset.icon = "star";
				starsSeparatorElement.dataset.style = "fill";

				starsElement.append(starsAmountElement, starsSeparatorElement);
				containerElement.append(starsElement);
			}

			summaryElement.textContent = data.description || "No description provided.";
		} else {
			avatarElement.src = join(path.assets, "raw/icon/image_not_found.webp");

			statusElement.classList.add("private");
			statusElement.textContent = "Private";

			if (response.status === 403) summaryElement.innerHTML = `GitHub rate limit reached for your IP, please try again in ${parseDuration(Number(response.headers.get("x-ratelimit-reset") * 1000) - Date.now())}.`;
			else {
				summaryElement.classList.add("redacted");
				summaryElement.innerHTML = "This project is private and cannot be displayed, and it's not by looking at the source code that you can see it either. >:(";
			}
		}

		const githubElement = document.createElement("div");
		githubElement.classList.add("github", "icon");
		githubElement.dataset.icon = "github";
		githubElement.dataset.style = "brand";
		githubElement.addEventListener("click", (event) => event.stopPropagation());

		containerElement.append(avatarElement, titleElement, statusElement, summaryElement, githubElement);
		console.log(data);
		return containerElement;

		/*
	<article class="project github">
	
	<div class="wakatime">
		<span class="amount">54</span>
		<span class="separator">hours</span>
	</div>
	
	</article>
		*/
	}
};

addEventListener("DOMContentLoaded", async () => {
	const projectsWrapper = document.querySelector(".projects");
	const projectsContainer = projectsWrapper.querySelector("nav");

	const projects = [
		loadProject.github("Wixonic", "Mercury"),
		loadProject.github("Wixonic", "TIPE"),
		loadProject.github("Wixonic", "WixiBot"),
		loadProject.blender({
			status: "Writing",
			redacted: ["title", "summary"]
		}),
		loadProject.github("Wixonic", "12th-Client"),
		loadProject.github("Wixonic", "YouTube-Alt")
	];

	projectsContainer.append(...(await Promise.all(projects)));

	if (projects.length > 0) projectsWrapper.classList.remove("hidden");

	const newsWrapper = document.querySelector(".news");
	const newsContainer = newsWrapper.querySelector("nav");

	const news = [];

	if (news.length > 0) newsWrapper.classList.remove("hidden");

	const discordProfile = await getDiscordProfile();

	const updateDiscordPresence = (profile) => {
		const discordElement = document.querySelector("article.discord");
		discordElement.classList.remove("hidden");

		const youBarElement = discordElement.querySelector(".you-bar");
		youBarElement.addEventListener("click", () => open(join(path.links, "/discord/"), "_blank", "noopener noreferrer"));

		youBarElement.querySelector(".avatar image").setAttribute("href", profile.avatar);

		if (profile.avatarDecoration) youBarElement.querySelector(".avatar-decoration image").setAttribute("href", profile.avatarDecoration);

		const usernameElement = youBarElement.querySelector(".username");
		usernameElement.textContent = profile.displayName;
		usernameElement.setAttribute("data-username", profile.displayName);
		usernameElement.classList.add(`discord-name-style-font-${profile.displayNameStyle.font_id}`, `discord-name-style-effect-${profile.displayNameStyle.effect_id}`);
		usernameElement.style.setProperty("--discord-name-style-color-1", `#${profile.displayNameStyle.colors[0].toString(16).padStart(6, "0")}`);
		if (profile.displayNameStyle.colors.length > 1) usernameElement.style.setProperty("--discord-name-style-color-2", `#${profile.displayNameStyle.colors[1].toString(16).padStart(6, "0")}`);

		youBarElement.querySelector(".status-icon").setAttribute("class", `status-icon ${profile.presence.status}`);

		const nameplateElement = youBarElement.querySelector(".nameplate");
		nameplateElement.style.setProperty("--palette", `var(--discord-nameplate-${profile.nameplate.palette}-dark)`);
		nameplateElement.src = profile.nameplate.url;

		console.log(profile);
	};

	if (discordProfile) updateDiscordPresence(discordProfile);

	setInterval(async () => {
		const discordProfile = await getDiscordProfile();
		if (discordProfile) updateDiscordPresence(discordProfile);
	}, 30 * 1000);
});