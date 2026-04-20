import { playAudio, playVideo, stop } from "/script/media.js";
import { wait } from "/script/utils.js";

/** @type {import("/types.d.ts").Module["components"]} */
const components = [
	{
		id: "loading-music",
		type: "audio",
		url: new URL("/raw/song/animation/NCS_sakuracloud_miffy-cafe.mp3", path.assets) // 89 BPM
	}, {
		id: "loading-starts",
		type: "video",
		sources: {
			"video/quicktime; codecs=hvc1": new URL("/raw/animation/loading/start.mov", path.assets),
			"video/webm; codecs=vp9": new URL("/raw/animation/loading/start.webm", path.assets)
		}
	}, {
		id: "loading-video_ping-pong",
		type: "video",
		sources: {
			"video/quicktime; codecs=hvc1": new URL("/raw/animation/loading/ping-pong.mov", path.assets),
			"video/webm; codecs=vp9": new URL("/raw/animation/loading/ping-pong.webm", path.assets)
		}
	}
];

/**
 * @param {Promise<void>} onLoaded — resolves when the target module is fully loaded
 */
const init = async (onLoaded) => {
	await playVideo("loading-starts", { withAudio: true });
	playAudio("loading-music", { loop: true });

	const loader = ["loading-video_ping-pong"]; // Insert loading animation IDs

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