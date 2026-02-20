import { getComponent } from "/src/script/components.js";


let canvas = document.querySelector("canvas");
let ctx = null;

const initCanvas = () => {
	if (canvas && ctx) return;
	if (!canvas) canvas = document.querySelector("canvas");
	if (canvas && !ctx) {
		try {
			ctx = canvas.getContext("2d", { colorSpace: "display-p3" });
		} catch (e) {
			ctx = canvas.getContext("2d");
		}
	}
};

initCanvas();

const video = document.createElement("video");
video.crossOrigin = "anonymous";
video.playsInline = true;
video.muted = true;

let queue = [];
let isPlaying = false;
let currentLoop = false;
let animationFrameId = null;

const activeAudios = new Set();

video.addEventListener("ended", () => {
	if (currentLoop) video.play().catch((e) => console.warn("[Renderer] Video replay failed:", e));
	else playNext();
});

const drawLoop = () => {
	if (isPlaying && video.readyState >= 2) {
		initCanvas();

		if (canvas && ctx) {
			if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
				if (video.videoWidth > 0 && video.videoHeight > 0) {
					canvas.width = video.videoWidth;
					canvas.height = video.videoHeight;
				}
			}

			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		}
	}

	animationFrameId = requestAnimationFrame(drawLoop);
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

	if (video.src !== src && video.src !== window.location.origin + src) video.src = src;

	video.play().catch((e) => console.warn("[Renderer] Video play failed:", e));
	isPlaying = true;

	if (!animationFrameId) drawLoop();
};

export const stopVideo = () => {
	isPlaying = false;
	video.pause();
	video.removeAttribute("src");
	video.load();
	queue = [];

	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}

	if (ctx && canvas && canvas.width > 0 && canvas.height > 0) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}
};

export const playSound = (id, loop = false) => {
	const src = getComponent(id).content;
	const audio = new Audio(src);
	audio.loop = loop;

	audio.play().catch((e) => console.warn("[Renderer] Audio play failed:", e));

	activeAudios.add(audio);

	const removeAudio = () => activeAudios.delete(audio);
	audio.addEventListener("ended", removeAudio);

	return {
		audio,
		stop: () => {
			audio.pause();
			audio.currentTime = 0;
			removeAudio();
		},
		pause: () => audio.pause(),
		resume: () => audio.play(),
		setVolume: (v) => {
			audio.volume = Math.max(0, Math.min(1, v));
		}
	};
};

export const stopAllSounds = () => {
	for (const audio of activeAudios) {
		audio.pause();
		audio.currentTime = 0;
	}

	activeAudios.clear();
};