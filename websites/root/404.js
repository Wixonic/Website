import footer from "/script/footer.js";
import { playVideo } from "/script/media.js";

/** @type {import("/types.d.ts").Module["components"]} */
const components = [
	{
		id: "404",
		type: "video",
		sources: {
			"video/quicktime; codecs=hvc1": new URL("/raw/animation/404/web.mov", path.assets),
			"video/webm; codecs=vp9": new URL("/raw/animation/404/web.webm", path.assets)
		}
	}
];

/** @type {import("/types.d.ts").Module["metadata"]} */
const metadata = {
	title: "404 Not Found | Wixonic",
	description: "Page not found."
};

/** @type {import("/types.d.ts").Module["init"]} */
const init = async () => {
	document.body.append(footer());

	await playVideo("404");
};

export {
	components,
	metadata,
	init
};