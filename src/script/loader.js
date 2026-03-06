import { playAudio, playVideo, stop } from "/src/script/media.js";
import { wait } from "/src/script/utils.js";

/** @type {import("/src/types.d.ts").Module["components"]} */
const components = [
	{
		id: "loading-music",
		type: "audio",
		url: new URL("/song/animation/NCS_sakuracloud_miffy-cafe.mp3", path.assets) // 89 BPM
	}
];

/**
 * @param {Promise<void>} onLoaded — resolves when the target module is fully loaded
 */
const init = async (onLoaded) => {
	// await playVideo("loading-starts", { withAudio: true });
	playAudio("loading-music", { loop: true });

	const loader = []; // Insert loading animation IDs

	let loaded = false;
	onLoaded.then(() => loaded = true);

	let last = null;

	while (!loaded) {
		const pool = loader.length > 1 ? loader.filter((id) => id !== last) : loader;
		last = pool[Math.floor(Math.random() * pool.length)];
		if (!last) await wait(4 * 60 / 89 * 1000);
		else await playVideo(last, { withAudio: true });
	}

	stop();
};

export { components, init };