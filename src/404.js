import footer from "/script/footer.js";

/** @type {import("/types.d.ts").Module["components"]} */
const components = [];

/** @type {import("/types.d.ts").Module["metadata"]} */
const metadata = {
	title: "404 Not Found - Wixonic",
	description: "Page not found."
};

/** @type {import("/types.d.ts").Module["init"]} */
const init = async () => {
	document.body.append(footer());
};

export { components, metadata, init };