import firebase from "/lib/firebase.js";
import request from "/lib/request.js";

const init = () => new Promise(async (resolve, reject) => {
	const newsContainer = document.querySelector("#news-container");

	try {
		const news = await firebase.firestore.getDocs(firebase.firestore.query(firebase.firestore.collection("news"), firebase.firestore.orderBy("date", "desc"), firebase.firestore.limit(25)));

		for (const id in news) {
			const article = news[id];

			const el = document.createElement("a");
			el.classList.add("article");
			el.href = `/news/?id=${id}`;
			el.innerHTML = `<div class="date">${article.date.toDate().toLocaleString(navigator?.language ?? "en-US", { dateStyle: "short", timeStyle: "short" })}</div><div class="title">${article.title}</div><div class="summary">${article.summary}</div>`;
			newsContainer.append(el);
		}

		if (Object.values(news).length == 0) newsContainer.innerHTML = `<div class="empty-message">Nothing new here..</div>`;
	} catch (e) {
		reject(e);
	}

	const discordNewsContainer = document.querySelector("#discord-news");

	try {
		const discordNews = await firebase.firestore.getDocs(firebase.firestore.query(firebase.firestore.collection("discord-news"), firebase.firestore.orderBy("date", "desc"), firebase.firestore.limit(25)));

		for (const id in discordNews) {
			const article = discordNews[id];

			const el = document.createElement("a");
			el.classList.add("article");
			el.href = `${window.localEnvironment ? "http://localhost:2012" : "https://discord.wixonic.fr"}/news/?id=${id}`;
			el.innerHTML = `<div class="date">${article.date.toDate().toLocaleString(navigator?.language ?? "en-US", { dateStyle: "short", timeStyle: "short" })}</div><div class="title">${article.title}</div><div class="summary">${article.summary}</div>`;
			discordNewsContainer.append(el);
		}

		if (Object.values(discordNews).length == 0) discordNewsContainer.innerHTML = `<div class="empty-message">Nothing new here..</div>`;
	} catch (e) {
		reject(e);
	}

	const discordControlPanelLink = document.querySelector("#discord-control-panel");
	discordControlPanelLink.href = window.localEnvironment ? "http://localhost:2012" : "https://discord.wixonic.fr";

	try {
		await Promise.all([
			new Promise((resolve, reject) => {
				request("GET", "https://api.github.com/users/Wixonic/repos?sort=updated&per_page=100", "json", "application/vnd.github+json", null, 500, false)
					.then((xhr) => {
						const repos = xhr.response;
						const repoList = document.querySelector("div#repos");

						if (xhr.status == 403) {
							const resetDate = new Date();
							resetDate.setTime(Number(xhr.getResponseHeader("x-ratelimit-reset")) * 1000);
							repoList.innerHTML = `<div class="empty-message">You are rate-limited. Rate limit resets at ${resetDate.toLocaleTimeString(navigator?.language ?? "en-US", { timeStyle: "short" })}.</div>`;
							resolve();
						} else {
							if (!repos instanceof Array) reject(new Error(`Invalid reponse while fetching repositories - Status: ${xhr.status} - Reponse-Type: ${typeof repos}`));
							else {
								for (const repo of repos) {
									const repoEl = document.createElement("a");

									repoEl.classList.add("repo");
									if (repo?.archived) repoEl.classList.add("archived");

									repoEl.href = repo?.html_url ?? "/go/github";
									repoEl.target = "_blank";

									const owner = repo?.owner?.login ?? "unknown";

									let topics = "";
									for (const topic of repo?.topics ?? []) topics += `<a class="topic" href="https://github.com/topics/${topic}" target="_blank">${topic}</a>`;

									repoEl.innerHTML = `<a class="icon link" href="${repo?.owner?.html_url ?? "/go/github"}" target="_blank"><img src="${repo?.owner?.avatar_url ?? "/assets/file/images/icon/logo.svg"}" class="icon" alt="${owner}'${owner.endsWith("s") ? "" : "s"} avatar" /></a><div class="fullname"><a class="owner link" href="${repo?.owner?.html_url ?? "https://go.wixonic.fr/github"}" target="_blank">${owner}</a>/<span class="name">${repo?.name ?? "unknown"}</span></div><div class="description">${repo?.description ?? "No description"}</div><div class="topics">${topics}</div>`;

									repoList.append(repoEl);
								}

								if (Object.values(repos).length == 0) repoList.innerHTML = `<div class="empty-message">Nothing new here..</div>`;

								resolve();
							}
						}
					}).catch((e) => {
						reject(new Error(`Failed to fetch GitHub repositories: ${e ?? "unknown error"}`));
					});
			}),
			new Promise((resolve, reject) => {
				const image = document.createElement("img");
				image.src = "/assets/file/images/icon/logo/gold/512.png";
				image.addEventListener("load", resolve);
				image.addEventListener("error", (e) => reject(e?.error));
				document.querySelector(".logo").append(image);
			})
		]);

		resolve();
	} catch (e) {
		reject(e);
	}
});

export default {
	init
};