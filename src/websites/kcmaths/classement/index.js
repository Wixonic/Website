import { init } from "/lib/main.js";

import { path, updateURL } from "/lib/script/path.js";
import request from "/lib/script/request.js";

import { findRankFor, formatLeaderboard, formatRank, sortLeaderboard } from "/utils.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	const date = document.querySelector(".input.date");

	/** @type {Date[]} */
	let entries = await request("GET", new URL("/kcmaths/entries/", path.server), "json", "application/json", null, 600);

	if ([200, 204].includes(entries.status)) entries = entries.response;
	else entries = [];

	date.setAttribute("dates", entries.join(", "));

	for (let i = 0; i < entries.length; ++i) {
		entries[i] = new Date(entries[i]);
		entries[i].setUTCHours(0, 0, 0, 0);
	}

	entries = entries.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

	/**
	 * @param {Number} id
	 * @param {"ratio" | "bank" | "entries"} category
	 */
	const loadLeaderboard = async (id, category) => {
		const container = document.querySelector(".classement");

		if (id == -1) {
			container.innerHTML = "Aucune donnée pour cette date.";
		} else {
			container.innerHTML = "";
			const date = entries[id];
			const previous = id > 0 ? entries[id - 1] : [];

			let leaderboard = await request("GET", new URL(`/kcmaths/leaderboard/?date=${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`, path.server), "json", "application/json", null, 600);

			if ([200].includes(leaderboard.status)) leaderboard = formatLeaderboard(leaderboard.response);
			else leaderboard = {};

			let previousLeaderboard = await request("GET", new URL(`/kcmaths/leaderboard/?date=${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}-${String(previous.getUTCDate()).padStart(2, "0")}`, path.server), "json", "application/json", null, 600);

			if ([200].includes(previousLeaderboard.status)) previousLeaderboard = formatLeaderboard(previousLeaderboard.response);
			else previousLeaderboard = {};

			const sortedLeaderboard = sortLeaderboard(leaderboard, category);
			for (const id in sortedLeaderboard) {
				const rank = findRankFor(leaderboard, id, category);
				const previousRank = findRankFor(previousLeaderboard, id, category);

				const entry = leaderboard[id];
				const previousEntry = previousLeaderboard[id];

				const element = document.createElement("div");
				element.classList.add("membre");

				{
					const rankEl = document.createElement("div");
					rankEl.classList.add("rang");
					rankEl.innerHTML = formatRank(rank);
					element.append(rankEl);

					const deltaEl = document.createElement("div");
					deltaEl.classList.add("delta");
					const delta = previousRank - rank;
					if (delta != 0) {
						deltaEl.innerHTML = `${delta > 0 ? "+" : ""}${delta}`;
						deltaEl.classList.add(delta > 0 ? "positif" : "negatif");
					}
					element.append(rankEl);

					const nameEl = document.createElement("div");
					nameEl.classList.add("nom");
					nameEl.innerHTML = id;
					element.append(nameEl);

					const valueEl = document.createElement("div");
					valueEl.classList.add("valeur");
					element.append(valueEl);

					const deltaValueEl = document.createElement("div");
					deltaValueEl.classList.add("delta-valeur");
					element.append(deltaValueEl);

					const detailsEl = document.createElement("div");
					detailsEl.classList.add("details");
					element.append(detailsEl);

					switch (category) {
						case "ratio":
							valueEl.innerHTML = entry.ratio > 0 ? `${Number((entry.ratio * 100).toFixed(2))}%` : "--";
							const deltaRatio = entry.ratio > 0 ? entry.ratio - previousEntry.ratio : 0;
							if (deltaRatio != 0) {
								deltaValueEl.innerHTML = `${deltaRatio > 0 ? "+" : ""}${Number((deltaRatio * 100).toFixed(2))}%`;
								deltaValueEl.classList.add(deltaRatio > 0 ? "positif" : "negatif");
							}
							break;

						case "bank":
							valueEl.innerHTML = entry.kcCoins;
							const deltaKCC = entry.kcCoins - previousEntry.kcCoins;
							if (deltaKCC != 0) {
								deltaValueEl.innerHTML = `${deltaKCC > 0 ? "+" : ""}${deltaKCC}`;
								deltaValueEl.classList.add(deltaKCC > 0 ? "positif" : "negatif");
							}
							break;

						case "entries":
							valueEl.innerHTML = entry.entries;
							const deltaEntries = entry.entries - previousEntry.entries;
							if (deltaEntries != 0) {
								deltaValueEl.innerHTML = `${deltaEntries > 0 ? "+" : ""}${deltaEntries}`;
								deltaValueEl.classList.add(deltaEntries > 0 ? "positif" : "negatif");
							}
							break;
					}
				}

				container.append(element);
			}
		}
	};

	const params = new URLSearchParams(location.search);
	const category = ["ratio", "bank", "entries"].includes(params.get("category")) ? params.get("category") : "ratio";
	if (params.get("date")) {
		const selectedDate = new Date(params.get("date"));
		selectedDate.setUTCHours(0, 0, 0, 0);
		date.setAttribute("date", `${selectedDate.getUTCFullYear()}-${String(selectedDate.getUTCMonth() + 1).padStart(2, "0")}-${String(selectedDate.getUTCDate()).padStart(2, "0")}`);

		const entry = entries.findIndex((value) => `${selectedDate.getUTCFullYear()}-${String(selectedDate.getUTCMonth() + 1).padStart(2, "0")}-${String(selectedDate.getUTCDate()).padStart(2, "0")}` == `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`) ?? -1;
		await loadLeaderboard(entry, category);
	} else await loadLeaderboard(entries.length - 1, category);
});