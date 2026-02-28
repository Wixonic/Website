import { playVideo, stop } from "/src/script/media.js";
import { wait } from "/src/script/utils.js";

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
	playVideo("screentest", {
		loop: true
	});

	await wait(2000);

	// await onLoaded;
	// stop();
};

export { components, init };