import { showBanner } from "/script/banner.js";
import { getComponent } from "/script/components.js";
import logger from "/script/logger.js";

// ---------------------------------------------------------------------------
// AudioContext (lazy, shared)
// ---------------------------------------------------------------------------

/** @type {AudioContext | null} */
let context = null;

/** @type {GainNode | null} */
let masterGain = null;

/** @type {boolean | null} */
let audioAllowed = null;

let permissionRequested = audioAllowed !== null;

/** @returns {AudioContext} */
const getContext = () => {
	if (!context) {
		context = new AudioContext();
		masterGain = context.createGain();
		masterGain.gain.value = 0;
		masterGain.connect(context.destination);

		context.resume().catch(() => { });
	}

	return context;
};

const requestAudioPermission = () => {
	if (permissionRequested || audioAllowed !== null) return;
	permissionRequested = true;

	showBanner({
		message: "This page would like to play audio.",
		actions: [
			{ label: "Enable audio", value: true },
			{ label: "No thanks", value: false }
		]
	}).then(async (value) => {
		try {
			await getContext().resume();
		} catch (unsafeError) {
			const error = unsafeError instanceof Error ? unsafeError : new Error(String(unsafeError));
			logger.error("[Media] Failed to resume AudioContext", error.message, error.stack);
		}

		if (value === true) {
			audioAllowed = true;

			if (masterGain) {
				masterGain.gain.setValueAtTime(0, getContext().currentTime);
				masterGain.gain.linearRampToValueAtTime(1, getContext().currentTime + 0.05);
			}

			if (currentVideo && currentVideo.options.withAudio) setVideoAudioRouting(true);
		} else audioAllowed = false;
	});
};

// ---------------------------------------------------------------------------
// Video state
// ---------------------------------------------------------------------------

/** @type {HTMLVideoElement | null} */
const videoElement = document.querySelector("video");

/** @type {MediaElementAudioSourceNode | null} */
let videoAudioSource = null;

/** @type {GainNode | null} */
let videoGainNode = null;

/** @type {import("/types.d.ts").MediaQueueItem | null} */
let currentVideo = null;

/** @type {(() => void) | null} */
let currentVideoResolve = null;

/** @type {Array<import("/types.d.ts").MediaQueueItem & { _resolve: () => void }>} */
let videoQueue = [];

/** @type {boolean} */
let videoPaused = false;

// ---------------------------------------------------------------------------
// Audio state
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} AudioTrack
 * @property {string} id
 * @property {AudioBufferSourceNode} source
 * @property {GainNode} gain
 * @property {import("/types.d.ts").MediaQueueItem} item
 * @property {() => void} _resolve
 */

/** @type {AudioTrack[]} */
let activeTracks = [];

/** @type {Array<import("/types.d.ts").MediaQueueItem & { _resolve: () => void }>} */
let audioQueue = [];

// ---------------------------------------------------------------------------
// Video playback
// ---------------------------------------------------------------------------

/**
 * Connects or disconnects the video element's audio to the AudioContext.
 * @param {boolean} withAudio
 */
const setVideoAudioRouting = async (withAudio) => {
	if (!videoElement) return;

	if (withAudio && audioAllowed === true) {
		const ctx = getContext();

		if (!videoAudioSource) {
			videoAudioSource = ctx.createMediaElementSource(videoElement);
			videoGainNode = ctx.createGain();
			videoAudioSource.connect(videoGainNode);
			videoGainNode.connect(masterGain);
		}

		videoElement.muted = false;
	} else {
		videoElement.muted = true;
	}
};

/**
 * Plays the given queue item on the video element immediately.
 * Resolves when playback ends naturally. For looping items, resolves only via stop().
 * @param {import("/types.d.ts").MediaQueueItem} item
 * @param {boolean} [_isLoopContinuation] — internal flag, do not pass
 * @returns {Promise<void>}
 */
const playVideoItem = async (item, _isLoopContinuation = false) => {
	if (!videoElement) {
		logger.error("[Media] No <video> element found in the DOM");
		return;
	}

	const blobURL = getComponent(item.id);
	if (!blobURL) {
		logger.error(`[Media] Component "${item.id}" not found, was it loaded?`);
		return;
	}

	currentVideo = item;
	videoPaused = false;

	requestAudioPermission();

	videoElement.src = blobURL;
	videoElement.loop = item.options.loop;

	await setVideoAudioRouting(item.options.withAudio);

	videoElement.play().catch((unsafeError) => {
		const error = unsafeError instanceof Error ? unsafeError : new Error(String(unsafeError));
		if (error.name === "AbortError" || error.message.includes("aborted")) return;
		logger.warn(`[Media] video.play() rejected for "${item.id}"`, error.message);
	});

	if (item.options.loop) {
		// Native loop — no ended event, resolve only via stop() or playVideo() interruption
		return new Promise((resolve) => {
			currentVideoResolve = resolve;
		});
	}

	return new Promise((resolve) => {
		currentVideoResolve = resolve;

		videoElement.addEventListener("ended", () => {
			currentVideoResolve = null;
			resolve();
			const next = videoQueue.shift();
			if (next) playVideoItem(next).then(next._resolve);
			else currentVideo = null;
		}, { once: true });
	});
};

// ---------------------------------------------------------------------------
// Audio playback
// ---------------------------------------------------------------------------

/**
 * Decodes a blob URL into an AudioBuffer.
 * @param {string} blobURL
 * @returns {Promise<AudioBuffer>}
 */
const decodeblobURL = async (blobURL) => {
	const response = await fetch(blobURL);
	const arrayBuffer = await response.arrayBuffer();
	return getContext().decodeAudioData(arrayBuffer);
};

/**
 * Plays the given queue item as audio via WebAudio API.
 * Resolves when playback ends. For looping items, resolves only via stop().
 * @param {import("/types.d.ts").MediaQueueItem} item
 * @param {(() => void) | null} [_originalResolve] — internal, carries the root resolve through loop iterations
 * @returns {Promise<void>}
 */
const playAudioItem = async (item, _originalResolve = null) => {
	requestAudioPermission();

	const blobURL = getComponent(item.id);
	if (!blobURL) {
		logger.error(`[Media] Component "${item.id}" not found — was it loaded?`);
		return;
	}

	let buffer;
	try {
		buffer = await decodeblobURL(blobURL);
	} catch (unsafeError) {
		const error = unsafeError instanceof Error ? unsafeError : new Error(String(unsafeError));
		logger.error(`[Media] Failed to decode audio "${item.id}"`, error.message, error.stack);
		return;
	}

	const ctx = getContext();
	const source = ctx.createBufferSource();
	const gain = ctx.createGain();

	source.buffer = buffer;
	source.connect(gain);
	gain.connect(masterGain);

	return new Promise((resolve) => {
		const effectiveResolve = _originalResolve ?? resolve;

		/** @type {AudioTrack} */
		const track = { id: item.id, source, gain, item, _resolve: effectiveResolve };
		activeTracks.push(track);

		source.addEventListener("ended", () => {
			activeTracks = activeTracks.filter((t) => t !== track);

			if (item.options.loop) {
				playAudioItem(item, effectiveResolve);
			} else {
				resolve();
				const next = audioQueue.shift();
				if (next) playAudioItem(next).then(next._resolve);
			}
		}, { once: true });

		source.start();
	});
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Plays a video component immediately, interrupting the current one.
 * The video queue stays intact and resumes after this item ends.
 * @param {string} id
 * @param {import("/types.d.ts").MediaOptions} [options]
 * @returns {Promise<void>} Resolves when playback ends.
 */
const playVideo = (id, options = {}) => {
	const resolved = { loop: false, withAudio: false, ...options };
	const item = { id, options: resolved };

	if (videoElement) videoElement.pause();

	if (currentVideoResolve) {
		currentVideoResolve();
		currentVideoResolve = null;
	}

	return playVideoItem(item);
};

/**
 * Adds a video component to the video queue.
 * If nothing is playing, starts immediately.
 * @param {string} id
 * @param {import("/types.d.ts").MediaOptions} [options]
 * @returns {Promise<void>} Resolves when this item's playback ends.
 */
const enqueueVideo = (id, options = {}) => {
	const resolved = { loop: false, withAudio: false, ...options };
	const item = { id, options: resolved };

	if (!currentVideo) return playVideoItem(item);

	return new Promise((resolve) => {
		videoQueue.push({ ...item, _resolve: resolve });
	});
};

/**
 * Plays an audio component immediately (additive — does not interrupt other audio).
 * @param {string} id
 * @param {import("/types.d.ts").MediaOptions} [options]
 * @returns {Promise<void>} Resolves when playback ends.
 */
const playAudio = (id, options = {}) => {
	const resolved = { loop: false, withAudio: false, ...options };
	return playAudioItem({ id, options: resolved });
};

/**
 * Adds an audio component to the audio queue.
 * If no audio is currently playing (no active tracks), starts immediately.
 * @param {string} id
 * @param {import("/types.d.ts").MediaOptions} [options]
 * @returns {Promise<void>} Resolves when this item's playback ends.
 */
const enqueueAudio = (id, options = {}) => {
	const resolved = { loop: false, withAudio: false, ...options };
	const item = { id, options: resolved };

	if (activeTracks.length === 0) return playAudioItem(item);

	return new Promise((resolve) => {
		audioQueue.push({ ...item, _resolve: resolve });
	});
};

/**
 * Pauses all active playback (video + audio via GainNode mute).
 */
const pause = () => {
	if (videoElement && !videoElement.paused) {
		videoElement.pause();
		videoPaused = true;
	}

	const ctx = context;
	if (ctx) ctx.suspend();
};

/**
 * Resumes all paused playback.
 */
const resume = () => {
	if (videoElement && videoPaused) {
		videoElement.play().catch(() => { });
		videoPaused = false;
	}

	const ctx = context;
	if (ctx) ctx.resume();
};

/**
 * Stops all playback, clears all queues, and resolves all pending Promises.
 */
const stop = () => {
	// Video
	if (videoElement) {
		videoElement.pause();
		videoElement.removeAttribute("src");
		videoElement.load();
		videoElement.muted = true;
	}
	if (currentVideoResolve) {
		currentVideoResolve();
		currentVideoResolve = null;
	}
	for (const item of videoQueue) item._resolve();
	currentVideo = null;
	videoQueue = [];
	videoPaused = false;

	// Audio — fade out then stop
	const tracksToStop = [...activeTracks];
	activeTracks = [];
	for (const item of audioQueue) item._resolve();
	audioQueue = [];

	for (const track of tracksToStop) {
		track.item.options.loop = false;
		track._resolve();
	}

	if (masterGain) {
		const ctx = getContext();
		masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
		masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);

		setTimeout(() => {
			for (const track of tracksToStop) {
				try { track.source.stop(); } catch (_) { }
			}
			if (audioAllowed) masterGain.gain.value = 1;
		}, 60);
	} else {
		for (const track of tracksToStop) {
			try { track.source.stop(); } catch (_) { }
		}
	}
};

/**
 * Clears the video and audio queues without stopping the current item.
 * Resolves all pending queue Promises.
 */
const clearQueue = () => {
	for (const item of videoQueue) item._resolve();
	videoQueue = [];
	for (const item of audioQueue) item._resolve();
	audioQueue = [];
};

/** @returns {string | null} */
const getCurrentVideoId = () => currentVideo?.id ?? null;

/** @returns {string | null} — the id of all active audio tracks (first one) */
const getCurrentAudioId = () => activeTracks[0]?.id ?? null;

/** @returns {import("/types.d.ts").MediaQueueItem[]} */
const getVideoQueue = () => [...videoQueue];

/** @returns {import("/types.d.ts").MediaQueueItem[]} */
const getAudioQueue = () => [...audioQueue];

/** @returns {boolean} */
const isVideoPlaying = () => currentVideo !== null && !videoPaused;

/** @returns {boolean} */
const isAudioPlaying = () => activeTracks.length > 0;

export {
	playVideo,
	playAudio,
	enqueueVideo,
	enqueueAudio,
	pause,
	resume,
	stop,
	clearQueue,
	getCurrentVideoId,
	getCurrentAudioId,
	getVideoQueue,
	getAudioQueue,
	isVideoPlaying,
	isAudioPlaying
};