import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class Avatar {
	constructor() {
		this.emissionFactor = 5;

		this.head = null;
		this.leftEye = null;
		this.rightEye = null;
		this.eyeMaterials = [];

		this.soundIndicators = [];

		this.eyesInitialPosition = new THREE.Vector3(0.07, 0.22, 0.245);
		this.eyeMovementCoeff = { x: 15, y: 15 };
		this.blinkState = { left: false, right: false };
		this.blinkingThresholdOn = 0.5;
		this.blinkingThresholdOff = 0.3;
		this.eyesSyncThreshold = 0.2;
		this.smilingFactor = 0.3;

		this.eyeBaseCoeff = 0.1;
		this.headPositionBaseCoeff = 0.05;
		this.headQuaternionBaseCoeff = 0.05;
		this.blendShapeBaseCoeff = {
			9: 0.5, // eyeBlinkLeft
			10: 0.5, // eyeBlinkRight
			44: 0.5, // mouthSmileLeft
			45: 0.5  // mouthSmileRight
		};

		this.smoothedBlendShapes = {
			9: 0, // eyeBlinkLeft
			10: 0, // eyeBlinkRight
			44: 0, // mouthSmileLeft
			45: 0  // mouthSmileRight
		};

		this.headTargetPosition = new THREE.Vector3();
		this.headTargetQuaternion = new THREE.Quaternion();
		this.leftEyeTargetPosition = new THREE.Vector3();
		this.rightEyeTargetPosition = new THREE.Vector3();

		this.dummyVector = new THREE.Vector3();
	}

	async init() {
		await this._loadModel();
		await this._loadTextures();
		await this._loadTextures();
		this._setupEyes();
		this._setupSoundIndicator();

		this.leftEyeTargetPosition.copy(this.leftEye.position);
		this.rightEyeTargetPosition.copy(this.rightEye.position);
	}

	async _loadModel() {
		const gltfLoader = new GLTFLoader();
		const gltf = await new Promise((resolve, reject) =>
			gltfLoader.load("./head.glb", resolve, undefined, reject)
		);
		this.head = gltf.scene.children[0];
		this.head.position.set(0, 0, 0);
	}

	async _loadTextures() {
		const textureLoader = new THREE.TextureLoader();
		const paths = ["./eye/default", "./eye/blink", "./eye/happy"];

		for (const path of paths) {
			const texture = await textureLoader.loadAsync(path + ".png");

			this.eyeMaterials.push(new THREE.MeshBasicMaterial({
				map: texture,
				transparent: true,
				polygonOffset: true,
				polygonOffsetFactor: -1,
				depthWrite: false
			}));
		}
	}

	_setupEyes() {
		const eyeGeometry = new THREE.PlaneGeometry(0.1, 0.1);

		this.leftEye = new THREE.Group();
		this.rightEye = new THREE.Group();

		for (let i = 0; i < this.emissionFactor; i++) {
			const leftMesh = new THREE.Mesh(eyeGeometry, this.eyeMaterials[0]);
			const rightMesh = new THREE.Mesh(eyeGeometry, this.eyeMaterials[0]);
			this.leftEye.add(leftMesh);
			this.rightEye.add(rightMesh);
		}

		this.leftEye.initialX = -this.eyesInitialPosition.x;
		this.leftEye.initialY = this.eyesInitialPosition.y;
		this.leftEye.initialZ = this.eyesInitialPosition.z;

		this.rightEye.initialX = this.eyesInitialPosition.x;
		this.rightEye.initialY = this.eyesInitialPosition.y;
		this.rightEye.initialZ = this.eyesInitialPosition.z;

		this.leftEye.position.set(this.leftEye.initialX, this.leftEye.initialY, this.leftEye.initialZ);
		this.rightEye.position.set(this.rightEye.initialX, this.rightEye.initialY, this.rightEye.initialZ);

		this.leftEye.currentEyeState = 0;
		this.rightEye.currentEyeState = 0;

		this.head.add(this.leftEye);
		this.head.add(this.rightEye);
	}

	_setupSoundIndicator() {
		const loader = new THREE.TextureLoader();
		loader.load("./sound_indicator.png", (texture) => {
			const geometry = new THREE.PlaneGeometry(0.386, 0.206);
			const material = new THREE.MeshBasicMaterial({
				map: texture,
				transparent: true,
				opacity: 0,
				blending: THREE.AdditiveBlending,
				depthWrite: false
			});

			this.soundIndicators = [];
			for (let i = 0; i < this.emissionFactor; i++) {
				const mesh = new THREE.Mesh(geometry, material);
				mesh.position.set(0, 0.2, 0.241);
				this.head.add(mesh);
				this.soundIndicators.push(mesh);
			}
		});
	}

	updateSoundIndicator(volume) {
		if (this.soundIndicators && this.soundIndicators.length > 0) {
			const easedVolume = 1 - Math.pow(1 - volume, 3);
			this.soundIndicators[0].material.opacity = easedVolume;
		}
	}

	update(faceData, delta) {
		if (faceData) {
			this._updateTargets(faceData);
		}

		this._applyAnimation(delta);
	}

	_updateTargets(face) {
		if (face.matrix?.data) {
			const m = face.matrix.data;
			this.headTargetPosition.set(
				Math.min(Math.max(-m[12], -15), 15) / 15,
				Math.min(Math.max(m[13], -12), 12) / 25,
				Math.min((m[14] + 45) / 15, 0)
			);

			const headTargetRotation = new THREE.Euler(
				-Math.atan2(m[9], m[10]) + 0.2,
				Math.atan2(-m[8], Math.sqrt(m[9] * m[9] + m[10] * m[10])),
				Math.atan2(m[4], m[0])
			);
			this.headTargetQuaternion.setFromEuler(headTargetRotation);
		}

		if (face.landmarks) {
			const leftIris = face.landmarks[473];
			const rightIris = face.landmarks[468];

			// 468 = Right Iris, 473 = Left Iris
			// Range indices: Right Eye [33, 133], Left Eye [362, 263]

			const leftOffset = this._calculateEyeOffset(leftIris, face.landmarks[362], face.landmarks[263]);
			const rightOffset = this._calculateEyeOffset(rightIris, face.landmarks[133], face.landmarks[33]);

			this.leftEyeTargetPosition.set(
				this.leftEye.initialX + leftOffset.x,
				this.leftEye.initialY + leftOffset.y,
				this.leftEye.initialZ
			);

			this.rightEyeTargetPosition.set(
				this.rightEye.initialX + rightOffset.x,
				this.rightEye.initialY + rightOffset.y,
				this.rightEye.initialZ
			);
		}

		if (face.blendShapes?.categories) {
			const smooth = (idx, factor) => {
				const raw = face.blendShapes.categories[idx]?.score || 0;
				const alpha = factor || 0.2;
				this.smoothedBlendShapes[idx] = THREE.MathUtils.lerp(this.smoothedBlendShapes[idx], raw, alpha);
				return this.smoothedBlendShapes[idx];
			};

			const blinkLeft = smooth(9, this.blendShapeBaseCoeff[9]);
			const blinkRight = smooth(10, this.blendShapeBaseCoeff[10]);
			const smile = (smooth(44, 0.1) + smooth(45, 0.1)) / 2;

			const updateState = (currentState, score) => {
				if (!currentState && score > this.blinkingThresholdOn) return true;
				if (currentState && score < this.blinkingThresholdOff) return false;
				return currentState;
			};

			this.blinkState.left = updateState(this.blinkState.left, blinkLeft);
			this.blinkState.right = updateState(this.blinkState.right, blinkRight);

			let renderLeft = this.blinkState.left;
			let renderRight = this.blinkState.right;

			if (renderLeft && blinkRight > this.eyesSyncThreshold) renderRight = true;
			if (renderRight && blinkLeft > this.eyesSyncThreshold) renderLeft = true;

			const isSmiling = smile > this.smilingFactor;

			const targetStateLeft = isSmiling ? 2 : (renderLeft ? 1 : 0);
			const targetStateRight = isSmiling ? 2 : (renderRight ? 1 : 0);

			if (this.leftEye.currentEyeState !== targetStateLeft) {
				this.leftEye.currentEyeState = targetStateLeft;
				this.leftEye.children.forEach((mesh) => {
					mesh.material = this.eyeMaterials[targetStateLeft];
				});
			}

			if (this.rightEye.currentEyeState !== targetStateRight) {
				this.rightEye.currentEyeState = targetStateRight;
				this.rightEye.children.forEach((mesh) => {
					mesh.material = this.eyeMaterials[targetStateRight];
				});
			}
		}
	}

	_calculateEyeOffset(iris, innerCorner, outerCorner) {
		const centerX = (innerCorner.x + outerCorner.x) / 2;
		const centerY = (innerCorner.y + outerCorner.y) / 2;

		const width = Math.abs(innerCorner.x - outerCorner.x);

		const virtualCenterY = centerY - (width / 4 + width / 8) / 2;

		const dx = centerX - iris.x;
		const dy = virtualCenterY - iris.y;

		return {
			x: Math.min(Math.max(dx * this.eyeMovementCoeff.x, -0.05), 0.05),
			y: Math.min(Math.max(dy * this.eyeMovementCoeff.y, -0.03), 0.03)
		};
	}

	_applyAnimation(delta) {
		if (!this.head) return;

		const eyeLerp = 1 - Math.pow(1 - this.eyeBaseCoeff, delta * 60);
		const headPosLerp = 1 - Math.pow(1 - this.headPositionBaseCoeff, delta * 60);
		const headQuatLerp = 1 - Math.pow(1 - this.headQuaternionBaseCoeff, delta * 60);

		this.leftEye.position.lerp(this.leftEyeTargetPosition, eyeLerp);
		this.rightEye.position.lerp(this.rightEyeTargetPosition, eyeLerp);

		this.head.position.lerp(this.headTargetPosition, headPosLerp);
		this.head.quaternion.slerp(this.headTargetQuaternion, headQuatLerp);
	}
}