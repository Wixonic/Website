import { path, updateURL } from "/lib/script/path.js";
import request from "/lib/script/request.js";

import { findRankFor } from "/utils.js";

addEventListener("DOMContentLoaded", async () => {
	const params = new URLSearchParams(location.search);
	let category = params.get("category") ?? "percent";
	let date = params.get("date") ? new Date(params.get("date")) : new Date();
	let mode = "before";

	const load = async (checkNearest = true) => {
		const newURL = new URL(location.href);
		newURL.searchParams.set("category", category);
		newURL.searchParams.set("date", `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`);
		updateURL(newURL);

		const sameDay = (a, b) => a.getUTCDate() == b.getUTCDate() && a.getUTCMonth() == b.getUTCMonth() && a.getUTCFullYear() == b.getUTCFullYear();

		const displayDateControls = (entryDate, failed) => {
			const before = document.querySelector("button#date-before");
			before.disabled = failed && checkNearest;
			before.addEventListener("click", async () => {
				if (!before.disabled) {
					before.disabled = true;
					mode = "before";
					date.setUTCDate(date.getUTCDate() - 1);
					load();
				}
			});

			const min = new Date(entryDate.getTime());
			min.setUTCDate(min.getUTCDate() - 28);
			const max = new Date();

			const field = document.querySelector("input#date");
			field.min = `${min.getUTCFullYear()}-${String(min.getUTCMonth() + 1).padStart(2, "0")}-${String(min.getUTCDate()).padStart(2, "0")}`;
			field.value = `${entryDate.getUTCFullYear()}-${String(entryDate.getUTCMonth() + 1).padStart(2, "0")}-${String(entryDate.getUTCDate()).padStart(2, "0")}`;
			field.max = `${max.getUTCFullYear()}-${String(max.getUTCMonth() + 1).padStart(2, "0")}-${String(max.getUTCDate()).padStart(2, "0")}`;
			field.addEventListener("input", () => {
				date = field.valueAsDate;
				load(false);
			});

			const after = document.querySelector("button#date-after");
			after.disabled = sameDay(new Date(), date);
			after.addEventListener("click", async () => {
				if (!after.disabled) {
					after.disabled = true;
					mode = "after";
					date.setUTCDate(date.getUTCDate() + 1);
					load();
				}
			});
		};

		let previousValue = { id: 0, value: 0 };
		const createMemberEntry = (id, data, previousRank) => {
			const member = document.createElement("a");
			member.classList.add("member");
			member.href = `/user/?id=${encodeURIComponent(data.id)}`;

			const value = {
				percent: data.percent,
				bank: data.kcCoins,
				victories: data.victories,
				entries: data.entries
			}[category];
			if (previousValue.value != value && data.lastName != "Corbineau") previousValue = { id, value };
			const rank = document.createElement("div");
			rank.classList.add("rank");
			rank.innerHTML = data.lastName == "Corbineau" ? "--" : previousValue.id;
			member.append(rank);

			const deltaRank = previousRank - previousValue.id;
			console.log(previousRank, previousValue.id);

			const progress = document.createElement("div");
			progress.classList.add("progress", deltaRank == 0 || previousRank <= 0 ? "nochange" : (deltaRank > 0 ? "up" : "down"));
			progress.innerHTML = deltaRank == 0 || previousRank <= 0 ? "--" : `${deltaRank > 0 ? "&#x2197;" : "&#x2198;"} ${Math.abs(deltaRank)}`;
			member.append(progress);

			const name = document.createElement("div");
			name.classList.add("name");
			name.innerHTML = data.id;
			member.append(name);

			const percent = document.createElement("div");
			percent.classList.add("percent");
			percent.innerHTML = data.entries > 0 && data.victories > 0 ? Math.floor((data.victories / data.entries) * 100) + "%" : "--";
			member.append(percent);

			const victories = document.createElement("div");
			victories.classList.add("victories");
			victories.innerHTML = data.victories > 0 ? data.victories : "--";
			member.append(victories);

			const entries = document.createElement("div");
			entries.classList.add("entries");
			entries.innerHTML = data.entries > 0 ? data.entries : "--";
			member.append(entries);

			const coins = document.createElement("div");
			coins.classList.add("coins");
			coins.innerHTML = data.kcCoins;
			member.append(coins);

			return member;
		};

		const getIdFromDate = (date) => String(date.getUTCDate()).padStart(2, "0") + String(date.getUTCMonth() + 1).padStart(2, "0") + date.getUTCFullYear();

		const displayLeaderboard = async (entry) => {
			const entryDate = new Date(entry.date);
			const theDayBefore = new Date(entry.date);
			theDayBefore.setDate(theDayBefore.getDate() - 1);
			const progressLeaderboardRequest = await request("GET", new URL(`/kcmaths/api/leaderboard/?date=${getIdFromDate(theDayBefore)}`, path.server), "json", "application/json", null, 600);

			let progressLeaderboard;
			if (progressLeaderboardRequest.status == 200) progressLeaderboard = progressLeaderboardRequest.response[category];

			const sortedLeaderboard = Object.values(entry.leaderboard).sort((a, b) => {
				switch (category) {
					case "bank":
						if (a.kcCoins == b.kcCoins) return b.percent - a.percent;
						else return b.kcCoins - a.kcCoins;

					case "entries":
						if (a.entries == b.entries) return b.percent - a.percent;
						else return b.entries - a.entries;

					case "percent":
						if (a.percent == b.percent) return b.entries - a.entries;
						else return b.percent - a.percent;

					case "victories":
						if (a.victories == b.victories) return b.percent - a.percent;
						else return b.victories - a.victories;

					default:
						return 0;
				};
			});


			{
				const percent = document.querySelector("button#nav-elo");
				percent.disabled = category == "percent";
				percent.addEventListener("click", async () => {
					if (!percent.disabled) {
						percent.disabled = true;
						category = "percent";
						load();
					}
				});

				const bank = document.querySelector("button#nav-richesse");
				bank.disabled = category == "bank";
				bank.addEventListener("click", async () => {
					if (!bank.disabled) {
						bank.disabled = true;
						category = "bank";
						load();
					}
				});

				const entries = document.querySelector("button#nav-participations");
				entries.disabled = category == "entries";
				entries.addEventListener("click", async () => {
					if (!entries.disabled) {
						entries.disabled = true;
						category = "entries";
						load();
					}
				});

				const victories = document.querySelector("button#nav-victoires");
				victories.disabled = category == "victories";
				victories.addEventListener("click", async () => {
					if (!victories.disabled) {
						victories.disabled = true;
						category = "victories";
						load();
					}
				});
			}

			displayDateControls(entryDate);

			const leaderboardContainer = document.querySelector("div#leaderboardContainer");
			leaderboardContainer.innerHTML = "";

			let count = 0;
			for (const data of sortedLeaderboard) {
				const member = createMemberEntry(data.lastName == "Corbineau" ? count : ++count, data, progressLeaderboard ? findRankFor(progressLeaderboard, data.id) : 0);
				leaderboardContainer.append(member);
			}
		};

		const initialDate = date.getTime();

		let leaderboardRequest = await request("GET", new URL(`/kcmaths/api/day/?date=${getIdFromDate(date)}`, path.server), "json", "application/json", null, 600);

		if (checkNearest) {
			while (leaderboardRequest.status == 404) {
				date.setUTCDate(date.getUTCDate() + (mode == "after" ? 1 : -1));

				if (date.getTime() > Date.now()) {
					date = new Date();
					mode = "before";
				}

				if (initialDate - date.getTime() > 28 * 24 * 60 * 60 * 1000) break;

				leaderboardRequest = await request("GET", new URL(`/kcmaths/api/day/?date=${getIdFromDate(date)}`, path.server), "json", "application/json", null, 600);
			}
		}

		if (leaderboardRequest.status == 200) {
			const leaderboard = leaderboardRequest.response;

			for (const id in leaderboard) {
				leaderboard[id].percent = leaderboard[id].entries > 0 ? leaderboard[id].victories / leaderboard[id].entries : 0;
				leaderboard[id].id = id;
			}

			const entry = {
				date: date.getTime(),
				leaderboard
			};

			displayLeaderboard(entry);
		} else {
			displayDateControls(date, true);

			const leaderboardContainer = document.querySelector("div#leaderboardContainer");
			leaderboardContainer.innerHTML = "Failed to fetch data for this period.";
		};
	};

	await load();
});