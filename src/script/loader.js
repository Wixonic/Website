import { playVideo, stop } from "/src/script/media.js";

/** @type {import("/src/types.d.ts").Module["components"]} */
const components = [
	{
		id: "screentest",
		type: "video",
		url: new URL("/private/screentest.mp4", path.assets)
	}
];

/**
 * @param {Promise<void>} onLoaded — resolves when the target module is fully loaded
 */
const init = async (onLoaded) => {
	await onLoaded;
	stop();
};

export { components, init };