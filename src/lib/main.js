import storage from "/lib/script/storage.js";

/**
 * @typedef {{added: (node: HTMLElement) => void; removed: (node: HTMLElement) => void; changed: (node: HTMLElement, attribute: string, oldValue: string | null) => void}} Mutation
 */

const init = async () => {
	const mutationSelectors = {};
	/** @param {Record<string, Mutation>} mutations */
	const addMutations = (mutations) => {
		for (const selector in mutations) {
			if (!mutationSelectors[selector]) {
				mutationSelectors[selector] = [];
			}

			mutationSelectors[selector].push(mutations[selector]);
		}
	};


	// -------- HEADER --------
	{
		addMutations({
			"header > .home": {
				added: (node) => node.addEventListener("click", () => location.href = path.root)
			}
		});
	}
	// -------- HEADER --------


	// ----- CUSTOM INPUT -----
	{
		addMutations({
			".input.date": {
				added: (node) => {
					const calendar = document.createElement("div");
					calendar.classList.add("calendar");

					const value = document.createElement("div");
					value.classList.add("value");

					node.append(calendar, value);
				},
				changed: (node, attribute, oldValue) => {
					console.log(node, attribute, node.getAttribute(attribute), oldValue);
				},
				removed: (node) => {

				}
			}
		});
	}
	// ----- CUSTOM INPUT -----


	// ----- EXTRA HEADER -----
	{
		addMutations({
			".extra-header": {

			}
		});
	}
	// ----- EXTRA HEADER -----


	// ----- TABLE SORTING -----
	{
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

		addMutations({
			".table": {
				added: (table) => {
					const headers = table.querySelectorAll("th.sortable");
					headers.forEach((th) => {
						th.addEventListener("click", () => {
							const currentDir = th.dataset.sortDir;
							table.querySelectorAll("th").forEach((h) => delete h.dataset.sortDir);

							let newDir = "asc";
							if (currentDir === "asc") newDir = "desc";
							else if (currentDir === "desc") newDir = "asc";
							else if (th.dataset.type === "date") newDir = "desc";

							th.dataset.sortDir = newDir;
							sortTable(table);
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
			".table td": {
				added: (td) => {
					const table = td.closest("table");
					if (!table) return;

					const cellIndex = td.cellIndex;
					const th = table.querySelector(`thead th:nth-child(${cellIndex + 1})`);

					if (th && th.dataset.type === "date" && !td.dataset.value) {
						const date = new Date(td.innerText);
						if (!isNaN(date)) {
							td.dataset.value = date.getTime();
							td.innerText = formatDate(date);
							if (table.classList.contains("always-sorted")) requestSort(table);
						}
					}
				}
			}
		});
	}
	// ----- TABLE SORTING -----

	/** @param {HTMLElement} node */
	const added = (node) => {
		for (const selector in mutationSelectors) {
			if (node.matches(selector)) {
				for (const action of mutationSelectors[selector]) {
					if (action.added) action.added(node);
				}
			}

			const childs = node.querySelectorAll(selector);
			for (const child of childs) {
				for (const action of mutationSelectors[selector]) {
					if (action.added) action.added(child);
				}
			}
		}
	};

	/** @param {HTMLElement} node */
	const removed = (node) => {
		for (const selector in mutationSelectors) {
			if (node.matches(selector)) {
				for (const action of mutationSelectors[selector]) {
					if (action.removed) action.removed(node);
				}
			}

			const childs = node.querySelectorAll(selector);
			for (const child of childs) {
				for (const action of mutationSelectors[selector]) {
					if (action.removed) action.removed(child);
				}
			}
		}
	};

	/**
	 * @param {HTMLElement} node
	 * @param {string} attribute
	 * @param {string} oldValue
	 */
	const changed = (node, attribute, oldValue) => {
		for (const selector in mutationSelectors) {
			if (node.matches(selector)) {
				for (const action of mutationSelectors[selector]) {
					if (action.changed) action.changed(node, attribute, oldValue);
				}
			}
		}
	};

	added(document.documentElement);

	const observer = new MutationObserver((mutations, observer) => {
		for (const mutation of mutations) {
			if (mutation.type === "childList") {
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType == 1) added(node);
				});

				mutation.removedNodes.forEach((node) => {
					if (node.nodeType == 1) removed(node);
				});
			} else if (mutation.type === "attributes") {
				if (mutation.target.nodeType == 1) changed(mutation.target, mutation.attributeName, mutation.oldValue);
			}
		}
	});

	observer.observe(document.documentElement, {
		attributes: true,
		childList: true,
		subtree: true
	});

	const analyticScript = document.createElement("script");
	analyticScript.src = "https://www.googletagmanager.com/gtag/js?id=G-Q6C79RDDZX";

	if (storage.getItem("consent") == "true") {
		document.head.append(analyticScript);
	} else if (!storage.getItem("consent")) {
		const cookiePopup = document.createElement("aside");
		cookiePopup.classList.add("cookie");

		cookiePopup.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 256 256">
	<path d="M164.49,163.51a12,12,0,1,1-17,0A12,12,0,0,1,164.49,163.51Zm-81-8a12,12,0,1,0,17,0A12,12,0,0,0,83.51,155.51Zm9-39a12,12,0,1,0-17,0A12,12,0,0,0,92.49,116.49Zm48-1a12,12,0,1,0,0,17A12,12,0,0,0,140.49,115.51ZM232,128A104,104,0,1,1,128,24a8,8,0,0,1,8,8,40,40,0,0,0,40,40,8,8,0,0,1,8,8,40,40,0,0,0,40,40A8,8,0,0,1,232,128Zm-16.31,7.39A56.13,56.13,0,0,1,168.5,87.5a56.13,56.13,0,0,1-47.89-47.19,88,88,0,1,0,95.08,95.08Z" />
</svg>`;

		const description = document.createElement("div");
		description.classList.add("description");
		description.innerHTML = `Do you want some cookies?<br />We need a few to make the site work (the serious stuff), and some others to track how cool this page is (Analytics). See the recipe and ingredients in our <a href="${new URL("/privacy/", path.root)}" target="_blank">Privacy Policy</a><br />What's your flavor?`;

		const buttons = document.createElement("div");
		buttons.classList.add("buttons");

		const acceptButton = document.createElement("button");
		acceptButton.classList.add("primary");
		acceptButton.innerHTML = "Accept All";
		acceptButton.addEventListener("click", () => {
			storage.setItem("consent", "true");
			document.head.append(analyticScript);
			cookiePopup.remove();
		});

		const acceptFeaturesButton = document.createElement("button");
		acceptFeaturesButton.innerHTML = "Decline Analytics";
		acceptFeaturesButton.addEventListener("click", () => {
			storage.setItem("consent", "features");
			cookiePopup.remove();
		});

		const declineButton = document.createElement("button");
		declineButton.innerHTML = "Decline All";
		declineButton.addEventListener("click", () => {
			storage.setItem("consent", "false");
			cookiePopup.remove();
		});

		buttons.append(acceptButton, acceptFeaturesButton, declineButton);
		cookiePopup.append(description, buttons);
		document.body.append(cookiePopup);
	}
};

export {
	init
};