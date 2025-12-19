import { init } from "/lib/main.js";

import { updateURL } from "/lib/script/path.js";
import request from "/lib/script/request.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	document.querySelector(".extra-header .overview").addEventListener("click", () => location.href = path.kcmaths);
	document.querySelector(".extra-header .leaderboard").addEventListener("click", () => location.href = new URL("/leaderboard/", path.kcmaths));

	const fileList = document.querySelector("#file-list");

	const loadFiles = async () => {
		fileList.innerHTML = "<tr><td colspan='3' class='loading'>Chargement...</td></tr>";

		const response = await request("GET", new URL("/kcmaths/files/history/", path.server), "json", "application/json", null, 600);

		if (response.status === 200) {
			const files = response.response;
			fileList.innerHTML = "";

			const fileArray = Object.entries(files).map(([name, data]) => ({ name, ...data }));

			fileArray.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

			if (fileArray.length === 0) {
				fileList.innerHTML = "<tr><td colspan='3'>Aucun fichier disponible.</td></tr>";
				return;
			}

			for (const file of fileArray) {
				const row = document.createElement("tr");

				const nameCell = document.createElement("td");
				const link = document.createElement("a");
				link.href = new URL(`/kcmaths/files/download/?name=${encodeURIComponent(file.name)}`, path.server);
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
			fileList.innerHTML = "<tr><td colspan='3'>Impossible de charger la liste des fichiers.</td></tr>";
		}
	};

	await loadFiles();
});