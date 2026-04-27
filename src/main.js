import logger from "/script/logger.js";

addEventListener("DOMContentLoaded", async () => {
	// Format buttons
	const formatButton = (button) => {
		if (button.dataset.formatted) return;
		button.dataset.formatted = "true";

		const edge = document.createElement("span");
		edge.className = "edge";

		const content = document.createElement("span");
		content.className = "content";

		while (button.firstChild) content.appendChild(button.firstChild); // Move children to preserve events

		const shadow = document.createElement("span");
		shadow.className = "shadow";

		button.appendChild(edge);
		button.appendChild(content);
		button.appendChild(shadow);
	};

	for (const button of document.body.querySelectorAll("button")) formatButton(button);
	for (const button of document.body.querySelectorAll("a.button")) formatButton(button);

	// Glow effect
	document.addEventListener("mousemove", (event) => {
		let element = event.target;
		while (element && element.classList) {
			if (element.classList.contains("glow")) {
				const rect = element.getBoundingClientRect();
				const x = event.clientX - rect.left;
				const y = event.clientY - rect.top;

				element.style.setProperty("--x", `${x}px`);
				element.style.setProperty("--y", `${y}px`);
			}

			element = element.parentElement;
		}
	});

	// Mutation Observer
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === "childList") {
				for (const node of mutation.addedNodes) {
					if (node.nodeType === Node.ELEMENT_NODE) {
						if (node.tagName === "BUTTON") formatButton(node);
						else {
							const buttons = node.getElementsByTagName("button");
							for (const button of buttons) formatButton(button);
						}
					}
				}
			}
		}
	});

	observer.observe(document.body, { childList: true, subtree: true });
});

addEventListener("error", (event) => {
	event.preventDefault();
	const error = event.error instanceof Error ? event.error : new Error(event.error || event.message);
	logger.fatalError("Uncaught Exception", error.message, error.stack);
});

addEventListener("unhandledrejection", (event) => {
	event.preventDefault();
	const error = event.reason instanceof Error ? event.reason : new Error(event.reason);
	logger.fatalError("Unhandled Promise Rejection", error.message, error.stack);
});