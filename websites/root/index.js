/** @type {import("/src/types.d.ts").Module["components"]} */
const components = [];

/** @type {import("/src/types.d.ts").Module["metadata"]} */
const metadata = {
	title: "Wixonic",
	description: "Learn more about Wixonic."
};

/** @type {import("/src/types.d.ts").Module["init"]} */
const init = async () => {
	console.log("Hello!");

	const screen = document.getElementById("screen");

	// screen.append();
};

export { components, metadata, init };