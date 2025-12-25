import { init } from "/lib/main.js";

import { updateURL } from "/lib/script/path.js";
import request from "/lib/script/request.js";

import { findRankFor, formatLeaderboard, formatRank, sortLeaderboard } from "/utils.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	document.querySelector(".extra-header .overview").addEventListener("click", () => location.href = path.kcmaths);
	document.querySelector(".extra-header .files").addEventListener("click", () => location.href = new URL("/files/", path.kcmaths));

	const date = document.querySelector(".input.date");
	const ratioButton = document.querySelector(".category#ratio");
	const bankButton = document.querySelector(".category#bank");
	const entriesButton = document.querySelector(".category#entries");
	const victoriesButton = document.querySelector(".category#victories");

	const factsContainer = document.querySelector(".facts");
	const container = document.querySelector("#leaderboard");
	const leaderboardTitle = document.querySelector("#title");

	const lastUpdated = document.querySelector(".last-updated");

	(async () => {
		const lastUpdate = await request("GET", new URL("/kcmaths/lastUpdate/", path.server), "text", "plain/text", null, -1);
		lastUpdated.classList.remove("loading");
		if (lastUpdate.status === 200) lastUpdated.textContent = `Mis à jour le ${new Date(lastUpdate.response).toLocaleString("fr-FR", {
			weekday: "long",
			day: "numeric",
			month: "long",
			hour: "numeric",
			minute: "numeric"
		})}`;
		else lastUpdated.textContent = "Serveur indisponible pour le moment.";
	})();

	/** @type {Date[]} */
	let entries = await request("GET", new URL("/kcmaths/entries/", path.server), "json", "application/json", null, -1);

	if ([200, 204].includes(entries.status)) {
		entries = entries.response;

		date.setAttribute("dates", entries.join(", "));

		for (let i = 0; i < entries.length; ++i) {
			entries[i] = new Date(entries[i]);
			entries[i].setUTCHours(0, 0, 0, 0);
		}

		entries = entries.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

		/**
		 * @param {number} id
		 * @param {"ratio" | "bank" | "entries" | "victories"} category
		 */
		const loadLeaderboard = async (id, category) => {
			for (const el of [ratioButton, bankButton, entriesButton, victoriesButton]) el.removeAttribute("disabled");

			leaderboardTitle.innerHTML = {
				"ratio": "Pourcentage de victoires",
				"bank": "Banque",
				"entries": "Participations",
				"victories": "Victoires"
			}[category];

			/**
			 * @param {HTMLElement} element
			 * @param {string} id
			 */
			const loadDetails = async (element, id) => {
				const el = element.querySelector(".details");
				el.classList.add("loading");
				const details = await request("GET", new URL(`/kcmaths/details/?id=${encodeURIComponent(id)}`, path.server), "json", "application/json", null, -1);

				// el.classList.remove("loading");
				// el.innerHTML = JSON.stringify(details);
			};

			if (id === -1) container.innerHTML = "Aucune donnée pour cette date.";
			else {
				container.innerHTML = "";
				const date = entries[id];
				const previous = id > 0 ? entries[id - 1] : null;

				let [leaderboard, previousLeaderboard] = await Promise.all([
					request("GET", new URL(`/kcmaths/leaderboard/?date=${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`, path.server), "json", "application/json", null, -1)
						.then((res) => [200].includes(res.status) ? formatLeaderboard(res.response) : {}),

					previous ? request("GET", new URL(`/kcmaths/leaderboard/?date=${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}-${String(previous.getUTCDate()).padStart(2, "0")}`, path.server), "json", "application/json", null, 600)
						.then((res) => [200].includes(res.status) ? formatLeaderboard(res.response) : {}) : Promise.resolve({})
				]);

				container.classList.remove("loading");

				{
					factsContainer.classList.add("hidden");
					factsContainer.innerHTML = `<div class="title">Faits interréssants</div>`;

					const generateFact = (text, category) => {
						factsContainer.classList.remove("hidden");
						const el = document.createElement("div");
						el.innerHTML = text;
						el.classList.add("fact", category);
						factsContainer.append(el);
					};

					for (const id in leaderboard) {
						const entry = leaderboard[id];
						const previousEntry = previousLeaderboard[id];

						if (!previousEntry) continue;

						const generateFactForCategory = (category) => {
							const currentRank = findRankFor(leaderboard, id, category);
							const previousRank = findRankFor(previousLeaderboard, id, category);
							const rankDelta = previousRank - currentRank;

							const categoryText = {
								"ratio": "en pourcentage",
								"bank": "dans la banque",
								"entries": "en nombre de participations",
								"victories": "en nombre de victoires"
							};

							if (rankDelta > 15) generateFact(`${id} a progressé de ${rankDelta} places ${categoryText[category]}.`, "pos");
							else if (rankDelta < -15) generateFact(`${id} a perdu ${Math.abs(rankDelta)} places ${categoryText[category]}.`, "neg");
						};

						generateFactForCategory("ratio");
						generateFactForCategory("bank");
						generateFactForCategory("entries");
						generateFactForCategory("victories");

						const kccDelta = entry.kcCoins - previousEntry.kcCoins;

						if (kccDelta > 20) generateFact(`${id} a gagné ${kccDelta} KCC`, "pos");
						else if (kccDelta < -20) generateFact(`${id} a dépensé ${Math.abs(kccDelta)} KCC`, "neg");

						const victoriesDelta = entry.victories - previousEntry.victories;
						if (victoriesDelta > 2) generateFact(`${id} a gagné ${victoriesDelta} fois`, "pos");
					}
				}

				const sortedLeaderboard = sortLeaderboard(leaderboard, category);

				const entriesSorted = Object.values(leaderboard).sort((a, b) => b.entries - a.entries);

				let hellThreshold = -1;
				if (entriesSorted.length > 0) {
					const thresholdIndex = Math.max(0, entriesSorted.length - 12);
					hellThreshold = entriesSorted[thresholdIndex].entries;
				}

				for (const id in sortedLeaderboard) {
					const rank = findRankFor(leaderboard, id, category);
					const previousRank = findRankFor(previousLeaderboard, id, category);

					const entry = leaderboard[id];
					const previousEntry = previousLeaderboard[id] ?? {};

					const element = document.createElement("div");
					element.classList.add("member");
					element.setAttribute("rank", rank);
					if (entry.entries <= hellThreshold) element.classList.add("hell");

					{
						const rankEl = document.createElement("div");
						rankEl.classList.add("rank");
						rankEl.innerHTML = formatRank(rank);
						element.append(rankEl);

						const deltaEl = document.createElement("div");
						deltaEl.classList.add("delta");
						const delta = previousRank - rank;
						if (delta !== 0) {
							deltaEl.innerHTML = `${delta > 0 ? "+" : ""}${delta}`;
							deltaEl.classList.add(delta > 0 ? "pos" : "neg");
						}
						element.append(deltaEl);

						const nameEl = document.createElement("div");
						nameEl.classList.add("name");
						nameEl.innerHTML = id;
						element.append(nameEl);

						const valueEl = document.createElement("div");
						valueEl.classList.add("value");
						element.append(valueEl);

						const deltaValueEl = document.createElement("div");
						deltaValueEl.classList.add("delta-value");
						element.append(deltaValueEl);

						const detailsEl = document.createElement("div");
						detailsEl.classList.add("details");
						element.append(detailsEl);

						switch (category) {
							case "ratio":
								valueEl.innerHTML = entry.ratio > 0 ? `${Number((entry.ratio * 100).toFixed(1))}%` : "--";
								const deltaRatio = entry.ratio > 0 ? entry.ratio - (previousEntry.ratio ?? entry.ratio) : 0;
								if (deltaRatio !== 0) {
									deltaValueEl.innerHTML = `${deltaRatio > 0 ? "+" : ""}${Number((deltaRatio * 100).toFixed(1))}%`;
									deltaValueEl.classList.add(deltaRatio > 0 ? "pos" : "neg");
								}
								break;

							case "bank":
								valueEl.innerHTML = entry.kcCoins;
								const deltaKCC = entry.kcCoins - (previousEntry.kcCoins ?? entry.kcCoins);
								if (deltaKCC !== 0) {
									deltaValueEl.innerHTML = `${deltaKCC > 0 ? "+" : ""}${deltaKCC}`;
									deltaValueEl.classList.add(deltaKCC > 0 ? "pos" : "neg");
								}
								break;

							case "entries":
								valueEl.innerHTML = entry.entries;
								const deltaEntries = entry.entries - (previousEntry.entries ?? entry.entries);
								if (deltaEntries !== 0) {
									deltaValueEl.innerHTML = `${deltaEntries > 0 ? "+" : ""}${deltaEntries}`;
									deltaValueEl.classList.add(deltaEntries > 0 ? "pos" : "neg");
								}
								break;

							case "victories":
								valueEl.innerHTML = entry.victories;
								const deltaVictories = entry.victories - (previousEntry.victories ?? entry.victories);
								if (deltaVictories !== 0) {
									deltaValueEl.innerHTML = `${deltaVictories > 0 ? "+" : ""}${deltaVictories}`;
									deltaValueEl.classList.add(deltaVictories > 0 ? "pos" : "neg");
								}
								break;
						}
					}

					element.addEventListener("click", async () => {
						for (const el of container.querySelectorAll(".member")) {
							if (el !== element) el.classList.remove("open");
						}

						const open = element.classList.toggle("open");

						if (open) await loadDetails(element, id);
					});

					container.append(element);
				}
			}
		};

		const params = new URLSearchParams(location.search);
		let entry = entries.length - 1;

		const changeCategory = async (category) => {
			await loadLeaderboard(entry, category);
			const url = new URL(location.href);
			params.set("category", category);
			url.searchParam = params;
			updateURL(url);
		};

		ratioButton.addEventListener("click", async () => await changeCategory("ratio"));
		bankButton.addEventListener("click", async () => await changeCategory("bank"));
		entriesButton.addEventListener("click", async () => await changeCategory("entries"));
		victoriesButton.addEventListener("click", async () => await changeCategory("victories"));

		const category = ["ratio", "bank", "entries", "victories"].includes(params.get("category")) ? params.get("category") : "ratio";
		if (params.get("date")) {
			const selectedDate = new Date(params.get("date"));
			selectedDate.setUTCHours(0, 0, 0, 0);
			date.setAttribute("date", `${selectedDate.getUTCFullYear()}-${String(selectedDate.getUTCMonth() + 1).padStart(2, "0")}-${String(selectedDate.getUTCDate()).padStart(2, "0")}`);

			entry = entries.findIndex((value) => `${selectedDate.getUTCFullYear()}-${String(selectedDate.getUTCMonth() + 1).padStart(2, "0")}-${String(selectedDate.getUTCDate()).padStart(2, "0")}` === `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`) ?? -1;
			await loadLeaderboard(entry, category);
		} else await loadLeaderboard(entry, category);
	} else {
		container.style.display = "none";
		lastUpdated.classList.remove("loading");
	}
});