import { enqueueAudio, enqueueVideo, playAudio, playVideo, stop } from "/src/script/media.js";
import { wait } from "/src/script/utils.js";

/** @type {import("/src/types.d.ts").Module["components"]} */
const components = [
	{
		id: "hdr",
		type: "video",
		url: new URL("/private/hdr.webm", path.assets)
	}, {
		id: "timecode",
		type: "video",
		url: new URL("/private/timecode.mp4", path.assets)
	}, {
		id: "sound",
		type: "video",
		url: new URL("/private/sound.mp4", path.assets)
	}, {
		id: "1kHz",
		type: "audio",
		url: new URL("/private/1kHz.m4a", path.assets)
	}, {
		id: "whitenoise",
		type: "audio",
		url: new URL("/private/whitenoise.m4a", path.assets)
	}
];

/** @type {import("/src/types.d.ts").Module["metadata"]} */
const metadata = {
	title: "404 Not Found - Wixonic",
	description: "Page not found."
};

/** @type {import("/src/types.d.ts").Module["init"]} */
const init = async () => {
	playVideo("timecode");
	await enqueueVideo("sound", { withAudio: true });

	playVideo("hdr");
	playAudio("1kHz");
	playAudio("whitenoise");
	await enqueueAudio("whitenoise");

	stop();

	playVideo("timecode", {
		loop: true
	});

	await wait(5000);
	stop();
};

export { components, metadata, init };