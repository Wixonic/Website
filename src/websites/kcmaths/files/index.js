import { init } from "/lib/main.js";

import { updateURL } from "/lib/script/path.js";
import request from "/lib/script/request.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	document.querySelector(".extra-header .overview").addEventListener("click", () => location.href = path.kcmaths);
	document.querySelector(".extra-header .leaderboard").addEventListener("click", () => location.href = new URL("/leaderboard/", path.kcmaths));

	const dateInput = document.querySelector(".input.date");
	const fileList = document.querySelector("#file-list");

	/** @type {Date[]} */
	let entries = await request("GET", new URL("/kcmaths/files/entries/", path.server), "json", "application/json", null, 600);

	if ([200, 204].includes(entries.status)) {
		entries = entries.response;
		dateInput.setAttribute("dates", entries.join(", "));

		for (let i = 0; i < entries.length; ++i) {
			entries[i] = new Date(entries[i]);
			entries[i].setUTCHours(0, 0, 0, 0);
		}

		entries = entries.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

		const loadFiles = async (dateStr) => {
			fileList.innerHTML = "<tr><td colspan='3' class='loading'>Chargement...</td></tr>";

			const response = await request("GET", new URL(`/kcmaths/files/history/?date=${dateStr}`, path.server), "json", "application/json", null, 600);

			if (response.status === 200) {
				const files = response.response;
				fileList.innerHTML = "";

				// Convert object to array for sorting
				const fileArray = Object.entries(files).map(([name, data]) => ({ name, ...data }));

				// Optional: sort logic
				fileArray.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

				for (const file of fileArray) {
					const row = document.createElement("tr");

					const nameCell = document.createElement("td");
					const link = document.createElement("a");
					link.href = new URL(`/kcmaths/files/download/?hash=${file.hash}&name=${encodeURIComponent(file.name)}`, path.server);
					link.textContent = file.name;
					link.target = "_blank";
					nameCell.appendChild(link);
					row.appendChild(nameCell);

					const dateCell = document.createElement("td");
					dateCell.textContent = file.lastModified;
					row.appendChild(dateCell);

					const sizeCell = document.createElement("td");
					sizeCell.textContent = file.size;
					row.appendChild(sizeCell);

					fileList.appendChild(row);
				}
			} else {
				fileList.innerHTML = "<tr><td colspan='3'>Aucune donnée pour cette date.</td></tr>";
			}
		};

		const params = new URLSearchParams(location.search);
		let initialDateStr = params.get("date");

		if (!initialDateStr && entries.length > 0) {
			const lastEntry = entries[entries.length - 1];
			initialDateStr = `${lastEntry.getUTCFullYear()}-${String(lastEntry.getUTCMonth() + 1).padStart(2, "0")}-${String(lastEntry.getUTCDate()).padStart(2, "0")}`;
		}

		if (initialDateStr) {
			dateInput.setAttribute("date", initialDateStr);
			await loadFiles(initialDateStr);
		}

		// Watch for attribute changes on the date input component
		const observer = new MutationObserver(async (mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === "attributes" && mutation.attributeName === "date") {
					const newDate = dateInput.getAttribute("date");
					if (newDate) {
						updateURL(new URL(`?date=${newDate}`, location.href));
						await loadFiles(newDate);
					}
				}
			}
		});

		observer.observe(dateInput, { attributes: true });

	} else {
		fileList.innerHTML = "<tr><td colspan='3'>Impossible de charger l'historique.</td></tr>";
	}
});