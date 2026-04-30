import * as THREE from "three";

export class SceneManager {
	constructor(canvas3D, canvas2D) {
		this.canvas3D = canvas3D;
		this.canvas2D = canvas2D;

		this.scene = null;
		this.camera = null;
		this.renderer = null;

		this.cameraPosition = [0, 0.15, 1.0];
		this.primaryLightPos = [4, 15, 3];
		this.secondaryLightPos = [-5, -5, 5];

		this.resizeObserver = null;
	}

	init() {
		this.scene = new THREE.Scene();

		this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas3D, antialias: true });
		this.renderer.setClearAlpha(0);

		this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
		this.camera.position.set(...this.cameraPosition);
		this.scene.add(this.camera);

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);

		const primaryDirectionalLight = new THREE.DirectionalLight(0xffffff, 10);
		primaryDirectionalLight.position.set(...this.primaryLightPos);

		const secondaryDirectionalLight = new THREE.DirectionalLight(0xffffff, 6);
		secondaryDirectionalLight.position.set(...this.secondaryLightPos);

		this.scene.add(ambientLight, primaryDirectionalLight, secondaryDirectionalLight);

		this._handleResize();
		window.addEventListener("resize", () => this._handleResize());
	}

	_handleResize() {
		const width = window.innerWidth;
		const height = window.innerHeight;

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(width, height);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		if (this.canvas2D) {
			this.canvas2D.width = width * window.devicePixelRatio;
			this.canvas2D.height = height * window.devicePixelRatio;
		}
	}

	add(object) {
		this.scene.add(object);
	}

	render() {
		this.renderer.render(this.scene, this.camera);
	}
}