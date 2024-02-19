/**
 * Must be called when DOM is loaded
 */
const init = () => {
	/**
	 * @type {HTMLCanvasElement?}
	 */
	const canvas = document.querySelector("canvas#background");

	if (canvas) {
		const ctx = canvas.getContext("2d");

		const update = () => {
			const n = Date.now(),
				w = canvas.width = Number(getComputedStyle(canvas).width.replace("px", "")) * devicePixelRatio,
				h = canvas.height = Number(getComputedStyle(canvas).height.replace("px", "")) * devicePixelRatio,
				m = Math.min(w, h),
				M = Math.max(w, h);

			ctx.clearRect(0, 0, w, h);

			const fillStyle = rt => `hsla(${Math.floor(rt * 360)}, 70%, 50%, 0.1)`,
				strokeStyle = rt => `hsla(${Math.floor(rt * 360)}, 70%, 50%, 0.2)`;

			const drawShape = (t, yOffset, sizeFactor, sides) => {
				const rt = (n + t / 2) % t / t,
					a = rt * Math.PI * sides;

				const s = m * sizeFactor,
					x = ((w + s * 3) * rt) - s,
					y = h * yOffset;

				ctx.translate(x - s / 2, y - s / 2);
				ctx.rotate(a);

				ctx.beginPath();
				for (let i = 0; i < sides; i++) {
					const angle = (i / sides) * 2 * Math.PI;
					const px = Math.cos(angle) * s;
					const py = Math.sin(angle) * s;
					ctx.lineTo(px, py);
				}
				ctx.closePath();

				ctx.lineCap = "round";
				ctx.lineJoin = "round";
				ctx.lineWidth = s * 0.04;
				ctx.strokeStyle = strokeStyle(rt);
				ctx.fillStyle = fillStyle(rt);

				ctx.stroke();
				ctx.fill();
			};

			const shapes = [
				[90_000, 0.2, 0.08, 4],
				[95_000, 0.4, 0.07, 5],
				[115_000, 0.6, 0.06, 3],
				[102_000, 0.8, 0.05, 6]
			];

			for (const shape of shapes) {
				ctx.save();
				drawShape(...shape);
				ctx.restore();
			}

			requestAnimationFrame(update);
		};

		update();
	}
};

export {
	init
};