/** @type {import("/src/types.d.ts").Module["components"]} */
const components = [
	{
		id: "test",
		type: "video",
		url: new URL("/private/test.webm", path.assets)
	}
];

/** @type {import("/src/types.d.ts").Module["init"]} */
const init = async () => {

};

export { components, init };