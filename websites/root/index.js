import footer from "/script/footer.js";

/** @type {import("/types.d.ts").Module["components"]} */
const components = [];

/** @type {import("/types.d.ts").Module["metadata"]} */
const metadata = {
	title: "Wixonic",
	description: "Learn more about Wixonic."
};

/** @type {import("/types.d.ts").Module["init"]} */
const init = async () => {
	document.body.append(footer());

	const layer = document.querySelector("#layer");
	const screen = document.querySelector("#screen");

	// screen.append();
};

export { components, metadata, init };