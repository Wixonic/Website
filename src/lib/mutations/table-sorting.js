const formatTime = (date) => {
	return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (date, lang = "en") => {
	const now = new Date();
	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);

	const isToday = date.toDateString() === now.toDateString();
	const isYesterday = date.toDateString() === yesterday.toDateString();

	const timeStr = formatTime(date);

	if (isToday) return `${lang === "fr" ? "Aujourd'hui" : "Today"}, ${timeStr}`;
	if (isYesterday) return `${lang === "fr" ? "Hier" : "Yesterday"}, ${timeStr}`;

	const d = date.getDate().toString().padStart(2, "0");
	const m = (date.getMonth() + 1).toString().padStart(2, "0");
	const y = date.getFullYear();

	return `${d}/${m}/${y}, ${timeStr}`;
};

const sortTable = (table) => {
	const tbody = table.querySelector("tbody");
	const rows = Array.from(tbody.rows).filter((r) => !r.classList.contains("loading"));
	if (rows.length === 0) return;

	const activeTh = table.querySelector("th[data-sort-dir]");
	if (!activeTh) return;

	const index = Array.from(activeTh.parentNode.children).indexOf(activeTh);
	const dir = activeTh.dataset.sortDir;
	const isDate = activeTh.dataset.type === "date";

	rows.sort((a, b) => {
		const cellA = a.cells[index];
		const cellB = b.cells[index];

		if (!cellA || !cellB) return 0;

		let valA = isDate ? parseInt(cellA.dataset.value || 0) : cellA.innerText.toLowerCase();
		let valB = isDate ? parseInt(cellB.dataset.value || 0) : cellB.innerText.toLowerCase();

		if (valA < valB) return dir === "asc" ? -1 : 1;
		if (valA > valB) return dir === "asc" ? 1 : -1;
		return 0;
	});

	tbody.append(...rows);
};

let sortTimeout;
const requestSort = (table) => {
	clearTimeout(sortTimeout);
	sortTimeout = setTimeout(() => sortTable(table), 50);
};

export default {
	"table": {
		added: (table) => {
			const headers = table.querySelectorAll("th.sortable");
			headers.forEach((th) => {
				th.addEventListener("click", () => {
					const currentDir = th.dataset.sortDir;
					const isDate = th.dataset.type === "date";
					const isAlwaysSorted = table.classList.contains("always-sorted");

					table.querySelectorAll("th").forEach((h) => delete h.dataset.sortDir);

					let newDir;
					if (currentDir === "asc") {
						if (isDate && !isAlwaysSorted) newDir = null;
						else newDir = "desc";
					} else if (currentDir === "desc") {
						if (isDate) newDir = "asc";
						else newDir = isAlwaysSorted ? "asc" : null;
					} else {
						newDir = isDate ? "desc" : "asc";
					}

					if (newDir) {
						th.dataset.sortDir = newDir;
						sortTable(table);
					}
				});
			});

			if (table.classList.contains("always-sorted")) {
				const defaultHeader = table.querySelector("th[data-type='date']") || table.querySelector("th.sortable");
				if (defaultHeader && !defaultHeader.dataset.sortDir) {
					defaultHeader.dataset.sortDir = "desc";
				}
			}
		}
	},
	"table td": {
		added: (td) => {
			const table = td.closest("table");
			if (!table) return;

			const cellIndex = td.cellIndex;
			const th = table.querySelector(`thead th:nth-child(${cellIndex + 1})`);

			if (th && th.dataset.type === "date" && !td.dataset.value) {
				const date = new Date(td.innerText);
				if (!isNaN(date)) {
					td.dataset.value = date.getTime();
					td.innerText = formatDate(date, table.getAttribute("lang") || "en");
					if (table.querySelector("th[data-sort-dir]")) requestSort(table);
				}
			}
		}
	}
};