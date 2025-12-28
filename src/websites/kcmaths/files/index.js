import { init } from "../lib/main.js";

import { updateURL } from "../lib/script/path.js";
import request from "../lib/script/request.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	document.querySelector(".extra-header .overview").addEventListener("click", () => location.href = path.kcmaths);
	document.querySelector(".extra-header .leaderboard").addEventListener("click", () => location.href = new URL("/leaderboard/", path.kcmaths));

	const searchInput = document.querySelector(".input.search");

	const fileList = document.querySelector("#files");

	const loadFiles = async () => {
		fileList.innerHTML = "";

		const response = await request("GET", new URL("/kcmaths/files/history/", path.server), "json", "application/json", null, -1);

		if (response.status === 200) {
			fileList.classList.remove("loading");
			const files = response.response;

			const fileArray = Object.entries(files).map(([name, data]) => ({ name, ...data }));
			fileArray.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

			const formatSize = (sizeStr) => {
				const size = parseFloat(sizeStr);
				if (isNaN(size)) return sizeStr;

				if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} Go`;
				if (size >= 1024) return `${(size / 1024).toFixed(2)} Mo`;
				return `${Math.round(size)} Ko`;
			};

			const renderFiles = (filter = "") => {
				fileList.innerHTML = "";
				const lowerFilter = filter.toLowerCase();

				const filteredFiles = fileArray.filter(file => file.name.toLowerCase().includes(lowerFilter));

				if (filteredFiles.length === 0) {
					fileList.innerHTML = "<tr><td colspan='3'>Aucun fichier ne correspond à votre recherche.</td></tr>";
					return;
				}

				for (const file of filteredFiles) {
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
					sizeCell.textContent = formatSize(file.size);
					row.appendChild(sizeCell);

					fileList.appendChild(row);
				}
			};

			const params = new URLSearchParams(location.search);
			const initialQuery = params.get("q") || "";
			searchInput.value = initialQuery;
			renderFiles(initialQuery);

			searchInput.addEventListener("input", (e) => {
				const query = e.target.value;
				renderFiles(query);
				const url = new URL(location.href);
				if (query) url.searchParams.set("q", query);
				else url.searchParams.delete("q");
				updateURL(url);
			});

		} else {
			fileList.classList.remove("loading");
			fileList.innerHTML = "<tr><td colspan='3'>Impossible de charger la liste des fichiers.</td></tr>";
		}
	};

	await loadFiles();
});