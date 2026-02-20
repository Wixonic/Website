import { getComponent } from "/src/script/components.js";
import { request } from "/src/script/request.js";

let queue = [];
let isPlaying = false;
let currentLoop = false;

const activeAudios = new Set();

const getVideo = () => document.getElementById("main");

const setupVideoOnce = () => {
	const video = getVideo();
	if (video && !video.dataset.eventsAttached) {
		video.addEventListener("ended", () => {
			if (currentLoop) video.play().catch((e) => console.warn("[Renderer] Video replay failed:", e));
			else playNext();
		});

		video.dataset.eventsAttached = "true";
	}

	return video;
};

export const startVideo = (id, loop = false) => {
	queue = [];
	currentLoop = loop;
	playVideoInternal(id);
};

export const queueVideo = (id, loop = false) => {
	queue.push({ id, loop });

	if (!isPlaying) playNext();
};

export const playNext = () => {
	if (queue.length > 0) {
		const next = queue.shift();
		currentLoop = next.loop;
		playVideoInternal(next.id);
	} else stopVideo();
};

const playVideoInternal = (id) => {
	const src = getComponent(id).content;
	const video = setupVideoOnce();

	if (!video) return console.warn("[Renderer] Video element #main not found in DOM");

	if (video.src !== src && video.src !== window.location.origin + src) video.src = src;

	video.play().catch((e) => console.warn("[Renderer] Video play failed:", e));
	isPlaying = true;
};

export const stopVideo = () => {
	const video = getVideo();
	if (!video) return console.warn("[Renderer] Video element #main not found in DOM");

	isPlaying = false;
	video.pause();
	video.removeAttribute("src");
	video.load();
	queue = [];
};

let audioCtx = null;
const audioBuffers = new Map();

const getAudioContext = () => {
	if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	return audioCtx;
};

export const playSound = (id, loop = false) => {
	const ctx = getAudioContext();
	if (ctx.state === "suspended") ctx.resume();

	const srcUrl = getComponent(id).content;

	const audioProxy = {
		stop: () => { },
		setVolume: () => { }
	};

	const playBuffer = (buffer) => {
		const source = ctx.createBufferSource();
		source.buffer = buffer;
		source.loop = loop;

		const gainNode = ctx.createGain();
		source.connect(gainNode);
		gainNode.connect(ctx.destination);

		source.start(0);

		const audioObj = { source, gainNode, stop: null };
		activeAudios.add(audioObj);

		const removeAudio = () => activeAudios.delete(audioObj);
		source.addEventListener("ended", removeAudio);

		audioProxy.stop = () => {
			try {
				source.stop();
			} catch (e) { }

			removeAudio();
		};

		audioProxy.setVolume = (v) => gainNode.gain.value = Math.max(0, Math.min(1, v));

		audioObj.stop = audioProxy.stop;
	};

	let buffer = audioBuffers.get(id);
	if (buffer) {
		playBuffer(buffer);
	} else {
		request("GET", srcUrl, "arraybuffer")
			.then((resp) => ctx.decodeAudioData(resp.response))
			.then((decodedBuffer) => {
				audioBuffers.set(id, decodedBuffer);
				playBuffer(decodedBuffer);
			})
			.catch((e) => console.warn("[Renderer] Audio decode failed:", e));
	}

	return audioProxy;
};

export const stopAllSounds = () => {
	for (const audioObject of activeAudios) if (audioObject.stop) audioObject.stop();

	activeAudios.clear();
};