import { playVideo } from "/src/script/media.js";

/** @type {import("/src/types.d.ts").Module["components"]} */
const components = [
	{
		id: "404",
		type: "video",
		sources: {
			"video/quicktime; codecs=hvc1": new URL("/animation/404/web.mov", path.assets),
			"video/webm; codecs=vp9": new URL("/animation/404/web.webm", path.assets)
		}
	}
];

/** @type {import("/src/types.d.ts").Module["metadata"]} */
const metadata = {
	title: "404 Not Found - Wixonic",
	description: "Page not found."
};

/** @type {import("/src/types.d.ts").Module["init"]} */
const init = async () => {
	await playVideo("404");
};

export { components, metadata, init };
