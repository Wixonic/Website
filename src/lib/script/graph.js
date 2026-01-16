export class Graph {
	/**
	 * @param {HTMLCanvasElement} canvas 
	 * @param {{labels: string[] | Date[], values: number[]}} data 
	 * @param {object} options 
	 */
	constructor(canvas, data, options = {}) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.data = data;

		this.options = {
			padding: { top: 20, right: 20, bottom: 30, left: 40 },
			color: "var(--text)",
			accentColor: "var(--primary, #007bff)",
			...options
		};

		this.dates = data.labels.map((l) => new Date(l));
		this.values = data.values;

		this.maxIndex = this.values.length - 1;
		this.totalPoints = this.values.length;

		this.minZoom = 7;
		this.maxZoom = 90;

		const initialZoom = Math.min(this.totalPoints, this.maxZoom);
		this.windowSize = initialZoom;
		this.windowStart = Math.max(0, this.totalPoints - this.windowSize);

		this.width = 0;
		this.height = 0;

		this.isDragging = false;
		this.lastX = 0;
		this.hoverIndex = -1;

		this.resizeObserver = new ResizeObserver(() => this.resize());
		this.resizeObserver.observe(canvas);

		this.attachListeners();

		this.resize();
	}

	attachListeners() {
		this.canvas.addEventListener("mousedown", this.onPointerDown.bind(this));
		this.canvas.addEventListener("mousemove", this.onPointerMove.bind(this));
		this.canvas.addEventListener("mouseup", this.onPointerUp.bind(this));
		this.canvas.addEventListener("mouseleave", this.onPointerUp.bind(this));
		this.canvas.addEventListener("wheel", this.onWheel.bind(this), { passive: false });

		this.canvas.addEventListener("touchstart", this.onTouchStart.bind(this), { passive: false });
		this.canvas.addEventListener("touchmove", this.onTouchMove.bind(this), { passive: false });
		this.canvas.addEventListener("touchend", this.onTouchEnd.bind(this));
	}

	resize() {
		const rect = this.canvas.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;

		this.width = rect.width;
		this.height = rect.height;

		this.canvas.width = this.width * dpr;
		this.canvas.height = this.height * dpr;

		this.ctx.scale(dpr, dpr);

		this.requestDraw();
	}

	requestDraw() {
		if (this.rafId) cancelAnimationFrame(this.rafId);
		this.rafId = requestAnimationFrame(() => this.draw());
	}

	draw() {
		const { width, height, ctx } = this;
		const { padding } = this.options;

		ctx.clearRect(0, 0, width, height);

		const style = getComputedStyle(this.canvas);
		const textColor = style.getPropertyValue("--text").trim() || "#000";
		const gridColor = style.getPropertyValue("--border-color").trim() || "#ccc";

		ctx.font = "10px sans-serif";
		ctx.fillStyle = textColor;
		ctx.strokeStyle = textColor;

		const drawW = width - padding.left - padding.right;
		const drawH = height - padding.top - padding.bottom;

		const startIndex = Math.floor(this.windowStart);
		const endIndex = Math.min(this.totalPoints - 1, Math.ceil(this.windowStart + this.windowSize));

		const visibleValues = [];
		for (let i = startIndex; i <= endIndex; i++) {
			if (this.values[i] !== undefined) visibleValues.push(this.values[i]);
		}

		if (visibleValues.length === 0) return;

		const minY = Math.min(...visibleValues);
		const maxY = Math.max(...visibleValues);
		const rangeY = maxY - minY || 1;
		const displayMinY = minY - rangeY * 0.1;
		const displayMaxY = maxY + rangeY * 0.1;
		const displayRangeY = displayMaxY - displayMinY;

		const mapX = (index) => {
			const activeIndex = index - this.windowStart;
			return padding.left + (activeIndex / (this.windowSize)) * drawW;
		};

		const adjustedMapX = (idx) => {
			const norm = (idx - this.windowStart) / (this.windowSize - 1);
			return padding.left + norm * drawW;
		};

		const mapY = (val) => {
			const norm = (val - displayMinY) / displayRangeY;
			return padding.top + drawH - (norm * drawH);
		};

		ctx.beginPath();
		ctx.strokeStyle = gridColor;
		ctx.lineWidth = 0.5;

		for (let i = 0; i <= 4; i++) {
			const norm = i / 4;
			const y = padding.top + drawH - (norm * drawH);
			const val = displayMinY + norm * displayRangeY;

			ctx.moveTo(padding.left, y);
			ctx.lineTo(width - padding.right, y);

			ctx.fillText(Math.round(val).toString(), 5, y + 3);
		}
		ctx.stroke();

		const stride = Math.ceil(this.windowSize / 5);

		ctx.beginPath();
		for (let i = Math.ceil(this.windowStart); i <= Math.min(this.totalPoints - 1, this.windowStart + this.windowSize); i++) {
			if (i % stride === 0) {
				const x = adjustedMapX(i);
				if (x >= padding.left && x <= width - padding.right) {
					const date = this.dates[i];
					const label = `${date.getDate()}/${date.getMonth() + 1}`;
					ctx.fillText(label, x - 10, height - 5);

					ctx.moveTo(x, padding.top);
					ctx.lineTo(x, padding.top + drawH);
				}
			}
		}
		ctx.stroke();

		ctx.beginPath();
		ctx.lineWidth = 2;
		ctx.strokeStyle = textColor;

		const drawStart = Math.max(0, Math.floor(this.windowStart) - 1);
		const drawEnd = Math.min(this.totalPoints - 1, Math.ceil(this.windowStart + this.windowSize) + 1);

		for (let i = drawStart; i <= drawEnd; i++) {
			const x = adjustedMapX(i);
			const y = mapY(this.values[i]);
			if (i === drawStart) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();

		if (this.hoverIndex !== -1 && this.hoverIndex >= 0 && this.hoverIndex < this.values.length) {
			const x = adjustedMapX(this.hoverIndex);
			const y = mapY(this.values[this.hoverIndex]);

			if (x >= padding.left && x <= width - padding.right) {
				ctx.beginPath();
				ctx.arc(x, y, 4, 0, Math.PI * 2);
				ctx.fillStyle = textColor;
				ctx.fill();

				const date = this.dates[this.hoverIndex];
				const label = `${date.toLocaleDateString()}: ${this.values[this.hoverIndex]}`;
				const textWidth = ctx.measureText(label).width;

				let tx = x - textWidth / 2;
				let ty = y - 10;

				if (tx < padding.left) tx = padding.left;
				if (tx + textWidth > width - padding.right) tx = width - padding.right - textWidth;

				ctx.fillStyle = "rgba(0,0,0,0.7)";
				ctx.fillRect(tx - 5, ty - 12, textWidth + 10, 16);
				ctx.fillStyle = "#fff";
				ctx.fillText(label, tx, ty);
			}
		}
	}

	onPointerDown(e) {
		this.isDragging = true;
		this.lastX = e.clientX || e.touches[0].clientX;
	}

	onPointerMove(e) {
		const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);

		if (this.isDragging) {
			const deltaPx = clientX - this.lastX;
			this.lastX = clientX;

			const drawW = this.width - this.options.padding.left - this.options.padding.right;
			const pxPerUnit = drawW / (this.windowSize - 1);
			const deltaUnits = -deltaPx / pxPerUnit;

			this.windowStart += deltaUnits;
			this.clampWindow();
			this.requestDraw();
		}

		const rect = this.canvas.getBoundingClientRect();
		const x = clientX - rect.left;
		const { padding } = this.options;
		const drawW = this.width - padding.left - padding.right;

		if (x >= padding.left && x <= this.width - padding.right) {
			const norm = (x - padding.left) / drawW;
			const idx = Math.round(norm * (this.windowSize - 1) + this.windowStart);

			if (idx !== this.hoverIndex && idx >= 0 && idx < this.totalPoints) {
				this.hoverIndex = idx;
				this.requestDraw();
			}
		} else {
			if (this.hoverIndex !== -1) {
				this.hoverIndex = -1;
				this.requestDraw();
			}
		}
	}

	onPointerUp() {
		this.isDragging = false;
	}

	onWheel(e) {
		e.preventDefault();

		const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
		const newSize = this.windowSize * zoomFactor;

		if (newSize < this.minZoom || newSize > this.maxZoom) return;
		if (newSize > this.totalPoints) return;

		const center = this.windowStart + this.windowSize / 2;
		const newStart = center - newSize / 2;

		this.windowSize = newSize;
		this.windowStart = newStart;
		this.clampWindow();
		this.requestDraw();
	}

	clampWindow() {
		if (this.windowStart < 0) this.windowStart = 0;
		if (this.windowStart + this.windowSize > this.totalPoints - 1) {
			this.windowStart = this.totalPoints - 1 - this.windowSize + 1;

			if (this.windowStart + this.windowSize > this.totalPoints - 1) {
				this.windowStart = Math.max(0, this.totalPoints - 1 - (this.windowSize - 1));
				if (this.windowStart > this.totalPoints - 1 - this.windowSize) {
					this.windowStart = this.totalPoints - 1 - this.windowSize;
				}
			}
		}
		if (this.windowStart < 0) this.windowStart = 0;
	}

	onTouchStart(e) {
		if (e.touches.length === 1) {
			this.isDragging = true;
			this.lastX = e.touches[0].clientX;
		} else if (e.touches.length === 2) {
			this.isDragging = false;
			const t1 = e.touches[0];
			const t2 = e.touches[1];
			this.lastPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
		}
	}

	onTouchMove(e) {
		if (e.touches.length === 1 && this.isDragging) {
			e.preventDefault();
			const clientX = e.touches[0].clientX;
			const deltaPx = clientX - this.lastX;
			this.lastX = clientX;

			const drawW = this.width - this.options.padding.left - this.options.padding.right;
			const pxPerUnit = drawW / (this.windowSize - 1);
			const deltaUnits = -deltaPx / pxPerUnit;

			this.windowStart += deltaUnits;
			this.clampWindow();
			this.requestDraw();
		} else if (e.touches.length === 2) {
			e.preventDefault();
			const t1 = e.touches[0];
			const t2 = e.touches[1];
			const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

			if (this.lastPinchDist > 0) {
				const zoomFactor = this.lastPinchDist / dist;
				const newSize = this.windowSize * zoomFactor;

				if (newSize >= this.minZoom && newSize <= this.maxZoom && newSize <= this.totalPoints) {
					const center = this.windowStart + this.windowSize / 2;
					this.windowSize = newSize;
					this.windowStart = center - newSize / 2;
					this.clampWindow();
					this.requestDraw();
				}
			}

			this.lastPinchDist = dist;
		}
	}

	onTouchEnd(e) {
		if (e.touches.length === 0) {
			this.isDragging = false;
		} else if (e.touches.length === 1) {
			this.isDragging = true;
			this.lastX = e.touches[0].clientX;
		}
	}
}
