import { loadComponents, cleanupComponents } from "/script/components.js";
import logger from "/script/logger.js";

/** @type {import("/types.d.ts").Module | null} */
let currentModule = null;

/**
 * Updates the page metadata (title, description, and OpenGraph image).
 * @param {import("/types.d.ts").Module["metadata"]} metadata
 */
const updateMetadata = (metadata) => {
	if (!metadata) return;

	if (metadata.title) {
		document.title = metadata.title;

		const ogTitle = document.querySelector(`meta[property="og:title"]`);
		if (ogTitle) ogTitle.setAttribute("content", metadata.title);
	}

	if (metadata.description) {
		const description = document.querySelector(`meta[name="description"]`);
		if (description) description.setAttribute("content", metadata.description);

		const ogDescription = document.querySelector(`meta[property="og:description"]`);
		if (ogDescription) ogDescription.setAttribute("content", metadata.description);
	}

	if (metadata.image) {
		const ogImage = document.querySelector(`meta[property="og:image"]`);
		if (ogImage) ogImage.setAttribute("content", metadata.image);
	}
};

/**
 * Loads a module dynamically based on the current path.
 * @param {string} currentPath
 */
const navigate = async (currentPath) => {
	try {
		/** @type {import("/types.d.ts").Module} */
		const loader = await import("/script/loader.js");

		if (loader.components) await loadComponents(loader.components);

		const targetModulePath = document.body.getAttribute("is-one-page-website") == "true" ? "/index.js" : currentPath + (currentPath.endsWith("/") ? "index.js" : "/index.js");

		const loadTargetModuleAndComponents = async (path) => {
			let module;

			try {
				module = await import(path);
			} catch (unsafeError) {
				const error = unsafeError instanceof Error ? unsafeError : new Error(unsafeError);
				logger.warn(`[Router] Module not found at ${path}, falling back to 404`, error.message, error.stack);
				module = await import("/404.js");
			}

			if (module.components && module.components.length > 0) await loadComponents(module.components);

			return module;
		};

		/** @type {() => void} */
		let resolveLoaded;
		const onLoaded = new Promise((resolve) => (resolveLoaded = resolve));

		const [targetModule] = await Promise.all([
			loadTargetModuleAndComponents(targetModulePath)
				.then((m) => {
					resolveLoaded();
					return m;
				}),
			loader.init(onLoaded)
		]);

		updateMetadata(targetModule.metadata);

		const currentURL = location.href;

		const opengraphURL = document.querySelector(`meta[property="og:url"]`);
		if (opengraphURL) opengraphURL.setAttribute("content", currentURL);

		const canonical = document.querySelector(`meta[rel="canonical"]`);
		if (canonical) canonical.setAttribute("href", currentURL);

		if (currentModule && currentModule.destroy) {
			try {
				await currentModule.destroy();
			} catch (unsafeError) {
				const error = unsafeError instanceof Error ? unsafeError : new Error(unsafeError);
				logger.error(`[Router] Failed to destroy previous module`, error.message, error.stack);
			}
		}

		if (targetModule.init) await targetModule.init();

		currentModule = targetModule;

		const activeComponentIds = [
			...(loader.components || []),
			...(targetModule.components || [])
		].map((component) => component.id);

		cleanupComponents(activeComponentIds);
	} catch (unsafeError) {
		const error = unsafeError instanceof Error ? unsafeError : new Error(unsafeError);
		logger.fatalError("[Router] 404 module not found", error.message, error.stack);
	}
};

addEventListener("DOMContentLoaded", async () => {
	document.addEventListener("click", (event) => {
		const target = event.target.closest("a");

		if (!target || !target.href) return;
		if (target.target === "_blank") return;

		event.preventDefault();

		const url = new URL(target.href);
		const path = url.pathname;

		if (url.pathname !== location.pathname) {
			history.pushState({}, "", url.pathname + url.search + url.hash);

			navigate(path);
		}
	});

	addEventListener("popstate", () => navigate(location.pathname));
	navigate(location.pathname);

	// Format buttons
	const formatButton = (button) => {
		if (button.dataset.formatted) return;
		button.dataset.formatted = "true";

		const glows = button.classList.contains("glow");
		if (glows) button.classList.remove("glow");

		const edge = document.createElement("span");
		edge.className = "edge" + (glows ? " glow" : "");

		const content = document.createElement("span");
		content.className = "content" + (glows ? " glow" : "");

		while (button.firstChild) content.appendChild(button.firstChild); // Move children to preserve events

		const shadow = document.createElement("span");
		shadow.className = "shadow";

		button.appendChild(edge);
		button.appendChild(content);
		button.appendChild(shadow);
	};

	for (const button of document.body.getElementsByTagName("button")) formatButton(button);

	// Glow effect
	document.addEventListener("mousemove", (event) => {
		const element = event.target.closest(".glow");
		if (!element) return;

		const rect = element.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		element.style.setProperty("--x", `${x}px`);
		element.style.setProperty("--y", `${y}px`);
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
