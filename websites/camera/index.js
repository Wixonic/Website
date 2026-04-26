import { AudioManager } from "./AudioManager.js";
import { Avatar } from "./Avatar.js";
import { CameraManager } from "./CameraManager.js";
import { FaceTracker } from "./FaceTracker.js";
import { SceneManager } from "./SceneManager.js";

class App {
	constructor() {
		this.cameraManager = null;
		this.faceTracker = null;
		this.sceneManager = null;
		this.avatar = null;
		this.audioManager = null;

		this.canvas2D = document.getElementById("canvas2D");
		this.ctx2D = this.canvas2D.getContext("2d");
		this.canvas3D = document.getElementById("canvas3D");

		this.lastFrameTime = performance.now();
		this.isRunning = false;

		this.latestFaceData = null;
		this.isDetecting = false;

		this.loop = this.loop.bind(this);
	}

	async init() {
		this.sceneManager = new SceneManager(
			this.canvas3D,
			this.canvas2D
		);
		this.sceneManager.init();
		this.avatar = new Avatar();
		await this.avatar.init();
		if (this.avatar.head) {
			this.sceneManager.add(this.avatar.head);
		}

		const videoElement = document.querySelector("video");
		const cameraSelect = document.getElementById("camera");
		this.cameraManager = new CameraManager(videoElement, cameraSelect);
		await this.cameraManager.init();

		const microphoneSelect = document.getElementById("microphone");
		this.audioManager = new AudioManager(microphoneSelect);
		await this.audioManager.init();

		this.faceTracker = new FaceTracker();
		await this.faceTracker.init();

		this.setupUIAutoHiding();

		this.isRunning = true;
		this.loop();
	}

	loop() {
		if (!this.isRunning) return;

		const now = performance.now();
		const delta = (now - this.lastFrameTime) / 1000;
		this.lastFrameTime = now;

		if (this.cameraManager.isVideoReady()) {
			const width = this.canvas2D.width;
			const height = this.canvas2D.height;

			this.ctx2D.clearRect(0, 0, width, height);

			this.ctx2D.save();
			this.ctx2D.translate(width, 0);
			this.ctx2D.scale(-1, 1);
			// this.ctx2D.drawImage(this.cameraManager.video, 0, 0, width, height); 
			this.ctx2D.restore();

			// Async Face Detection
			if (!this.isDetecting) {
				this.isDetecting = true;
				this.faceTracker.detect(this.cameraManager.video, now)
					.then(data => {
						if (data) {
							this.latestFaceData = data;
							this.canvas3D.classList.remove("fade-out");
						} else {
							this.canvas3D.classList.add("fade-out");
						}
					})
					.catch(e => {
						console.warn("Detection error:", e);
					})
					.finally(() => {
						this.isDetecting = false;
					});
			}
		}

		if (this.avatar) {
			this.avatar.update(this.latestFaceData, delta);
		}

		if (this.audioManager && this.avatar) {
			const volume = this.audioManager.getVolume();
			this.avatar.updateSoundIndicator(volume);
		}

		if (this.sceneManager) {
			this.sceneManager.render();
		}

		requestAnimationFrame(this.loop);
	}
	setupUIAutoHiding() {
		const container = document.getElementById("container");
		if (!container) return;

		let hideTimeout;

		const showUI = () => {
			container.classList.remove("hidden");
		};

		const resetTimer = () => {
			showUI();
			clearTimeout(hideTimeout);
			hideTimeout = setTimeout(() => {
				// Don't hide if a child element has focus (e.g. select is open/focused)
				if (container.contains(document.activeElement)) {
					resetTimer(); // try again later
				} else {
					container.classList.add("hidden");
				}
			}, 3000);
		};

		// Initial start
		// resetTimer(); // Start hidden, wait for interaction

		// Listen for activity
		document.body.addEventListener("mousemove", resetTimer);
		document.body.addEventListener("click", resetTimer);
		document.body.addEventListener("keydown", resetTimer);
	}
}

addEventListener("DOMContentLoaded", async () => {
	const app = new App();
	window.app = app; // DEBUG
	await app.init();
});
