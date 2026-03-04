import { loadComponents } from "/src/script/components.js";
import logger from "/src/script/logger.js";

/**
 * Updates the page metadata (title, description, and OpenGraph image).
 * @param {import("/src/types.d.ts").Module["metadata"]} metadata
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
		if (description)
			description.setAttribute("content", metadata.description);

		const ogDescription = document.querySelector(
			`meta[property="og:description"]`,
		);
		if (ogDescription)
			ogDescription.setAttribute("content", metadata.description);
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
		/** @type {import("/src/types.d.ts").Module} */
		const loader = await import("/src/script/loader.js");

		if (loader.components) await loadComponents(loader.components);

		let targetModulePath = currentPath;
		if (targetModulePath.endsWith("/")) targetModulePath += "index.js";
		else targetModulePath += "/index.js";

		const loadTargetModuleAndComponents = async (path) => {
			let module;
			try {
				module = await import(path);
			} catch (unsafeError) {
				const e =
					unsafeError instanceof Error
						? unsafeError
						: new Error(unsafeError);
				logger.warn(
					`[Router] Module not found at ${path}, falling back to 404`,
					e.message,
					e.stack,
				);
				module = await import("/src/404.js");
			}

			if (module.components && module.components.length > 0)
				await loadComponents(module.components);

			return module;
		};

		/** @type {() => void} */
		let resolveLoaded;
		const onLoaded = new Promise((resolve) => (resolveLoaded = resolve));

		const [targetModule] = await Promise.all([
			loadTargetModuleAndComponents(targetModulePath).then((m) => {
				resolveLoaded();
				return m;
			}),
			loader.init(onLoaded),
		]);

		updateMetadata(targetModule.metadata);

		const currentURL = location.href;
		const opengraphURL = document.querySelector(`meta[property="og:url"]`);
		if (opengraphURL) opengraphURL.setAttribute("content", currentURL);
		const canonical = document.querySelector(`meta[rel="canonical"]`);
		if (canonical) canonical.setAttribute("href", currentURL);

		if (targetModule.init) await targetModule.init();
	} catch (unsafeError) {
		const e =
			unsafeError instanceof Error ? unsafeError : new Error(unsafeError);
		logger.fatalError("[Router] 404 module not found", e.message, e.stack);
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
});

addEventListener("error", (event) => {
	event.preventDefault();
	const e =
		event.error instanceof Error
			? event.error
			: new Error(event.error || event.message);
	logger.fatalError("Uncaught Exception", e.message, e.stack);
});

addEventListener("unhandledrejection", (event) => {
	event.preventDefault();
	const e =
		event.reason instanceof Error ? event.reason : new Error(event.reason);
	logger.fatalError("Unhandled Promise Rejection", e.message, e.stack);
});
