import { loadComponents } from "/src/script/components.js";

window.debug = 0;

const loadPage = async () => {
	let modulePath = location.pathname;
	if (modulePath.endsWith("/")) modulePath += "index.js";
	else modulePath += "/index.js";

	/** @type {import("/src/types.d.ts").Module?} */
	let module = null;

	try {
		module = await import(modulePath);
	} catch (e) {
		console.warn(`[Router] Script ${modulePath} not found:`, e);

		try {
			module = await import("/src/404.js");
		} catch (e404) {
			return console.error("[Router] Critical - 404 failed:", e404);
		}
	}

	if (module.components) await loadComponents(module.components);
	else console.warn(`[Router] No components in ${modulePath}`);

	if (module.init) await module.init();
	else console.warn(`[Router] No init in ${modulePath}`);
};

const handleNavigation = (e) => {
	const link = e.target.closest("a");
	if (!link) return;

	const href = link.getAttribute("href");

	if (!href || link.target === "_blank") return;

	e.preventDefault();
	history.pushState(null, "", href);
	loadPage();
};

export const initRouter = () => {
	addEventListener("popstate", loadPage);
	document.addEventListener("click", handleNavigation);

	loadPage();
};