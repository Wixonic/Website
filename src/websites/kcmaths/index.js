import { init } from "./lib/main.js";

import request from "../lib/script/request.js";

import { initFacts } from "./facts.js";

import { formatLeaderboard } from "../utils.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	document.querySelector(".extra-header .leaderboard").addEventListener("click", () => location.href = new URL("/leaderboard/", path.kcmaths));
	document.querySelector(".extra-header .files").addEventListener("click", () => location.href = new URL("/files/", path.kcmaths));

	const factsContainer = document.querySelector(".facts");

	/** @type {Date[]} */
	let entries = await request("GET", new URL("/kcmaths/entries/", path.server), "json", "application/json", null, -1);

	if ([200, 204].includes(entries.status)) {
		entries = entries.response;

		for (let i = 0; i < entries.length; ++i) {
			entries[i] = new Date(entries[i]);
			entries[i].setUTCHours(0, 0, 0, 0);
		}

		entries = entries.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

		/**
		 * @param {number} id
		 */
		const loadLeaderboard = async (id) => {
			if (id !== -1) {
				const date = entries[id];
				const previous = id > 0 ? entries[id - 1] : null;

				let [leaderboard, previousLeaderboard] = await Promise.all([
					request("GET", new URL(`/kcmaths/leaderboard/?date=${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`, path.server), "json", "application/json", null, -1)
						.then((res) => [200].includes(res.status) ? formatLeaderboard(res.response) : {}),

					previous ? request("GET", new URL(`/kcmaths/leaderboard/?date=${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}-${String(previous.getUTCDate()).padStart(2, "0")}`, path.server), "json", "application/json", null, 600)
						.then((res) => [200].includes(res.status) ? formatLeaderboard(res.response) : {}) : Promise.resolve({})
				]);

				initFacts(factsContainer, leaderboard, previousLeaderboard);
			}
		};

		await loadLeaderboard(entries.length - 1);
	}
});