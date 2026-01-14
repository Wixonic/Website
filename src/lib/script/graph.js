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

		// Options
		this.options = {
			padding: { top: 20, right: 20, bottom: 30, left: 40 },
			color: "var(--text)",
			accentColor: "var(--primary, #007bff)",
			...options
		};

		// Parse dates if needed
		this.dates = data.labels.map(l => new Date(l));
		this.values = data.values;

		// Viewport State (indices)
		// Default: Show last month (approx 30 days)
		this.maxIndex = this.values.length - 1;
		this.totalPoints = this.values.length;

		// Zoom limits (in number of points/days)
		// 1 week = 7, 1 month = 30
		this.minZoom = 7;
		this.maxZoom = 30;

		// Initial View: Last 30 days or all data if less
		const initialZoom = Math.min(this.totalPoints, this.maxZoom);
		this.windowSize = initialZoom;
		this.windowStart = Math.max(0, this.totalPoints - this.windowSize);

		this.width = 0;
		this.height = 0;

		// Interaction State
		this.isDragging = false;
		this.lastX = 0;
		this.hoverIndex = -1;

		// Resize observer
		this.resizeObserver = new ResizeObserver(() => this.resize());
		this.resizeObserver.observe(canvas);

		// Event Listeners
		this.attachListeners();

		// Initial Draw
		this.resize();
	}

	attachListeners() {
		// Mouse / Touch
		this.canvas.addEventListener("mousedown", this.onPointerDown.bind(this));
		this.canvas.addEventListener("mousemove", this.onPointerMove.bind(this));
		this.canvas.addEventListener("mouseup", this.onPointerUp.bind(this));
		this.canvas.addEventListener("mouseleave", this.onPointerUp.bind(this));
		this.canvas.addEventListener("wheel", this.onWheel.bind(this), { passive: false });

		// Touch
		this.canvas.addEventListener("touchstart", this.onTouchStart.bind(this), { passive: false });
		this.canvas.addEventListener("touchmove", this.onTouchMove.bind(this), { passive: false });
		this.canvas.addEventListener("touchend", this.onPointerUp.bind(this));
	}

	resize() {
		const rect = this.canvas.getBoundingClientRect();
		// Handle DPI
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

		// Clear
		ctx.clearRect(0, 0, width, height);

		// Resolve Colors
		const style = getComputedStyle(this.canvas);
		const textColor = style.getPropertyValue("--text").trim() || "#000";
		const gridColor = style.getPropertyValue("--border-color").trim() || "#ccc";

		ctx.font = "10px sans-serif";
		ctx.fillStyle = textColor;
		ctx.strokeStyle = textColor;

		// Drawing Area
		const drawW = width - padding.left - padding.right;
		const drawH = height - padding.top - padding.bottom;

		// Visible Data
		// windowStart can be fractional, but for data access we need indices
		const startIndex = Math.floor(this.windowStart);
		const endIndex = Math.min(this.totalPoints - 1, Math.ceil(this.windowStart + this.windowSize));

		// Get visible slice for Y-scaling
		// We use exact windowStart/end for X-axis mapping, but integer indices for Y-min/max
		const visibleValues = [];
		for (let i = startIndex; i <= endIndex; i++) {
			if (this.values[i] !== undefined) visibleValues.push(this.values[i]);
		}

		if (visibleValues.length === 0) return;

		const minY = Math.min(...visibleValues);
		const maxY = Math.max(...visibleValues);
		// Add some padding to Y
		const rangeY = maxY - minY || 1; // avoid div by 0
		const displayMinY = minY - rangeY * 0.1;
		const displayMaxY = maxY + rangeY * 0.1;
		const displayRangeY = displayMaxY - displayMinY;

		// MapX function: maps index (float) to pixel
		const mapX = (index) => {
			const activeIndex = index - this.windowStart; // 0 to windowSize
			return padding.left + (activeIndex / (this.windowSize)) * drawW; // n-1 ? 
			// if windowSize is 7 (7 days), we want 0..6 to fit? 
			// usually we want 0 to windowSize-1 to be the range.
			// Let's say windowSize=7. indices 0 to 6.
			// activeIndex / (windowSize - 1) * drawW
		};

		// Adjusted MapX for continuous scroll
		const adjustedMapX = (idx) => {
			// normalized 0..1 inside window
			const norm = (idx - this.windowStart) / (this.windowSize - 1);
			return padding.left + norm * drawW;
		};

		const mapY = (val) => {
			const norm = (val - displayMinY) / displayRangeY;
			return padding.top + drawH - (norm * drawH);
		};

		// Draw Grid & Axes
		ctx.beginPath();
		ctx.strokeStyle = gridColor;
		ctx.lineWidth = 0.5;

		// Y Axis Lines (e.g. 5 lines)
		for (let i = 0; i <= 4; i++) {
			const norm = i / 4;
			const y = padding.top + drawH - (norm * drawH);
			const val = displayMinY + norm * displayRangeY;

			ctx.moveTo(padding.left, y);
			ctx.lineTo(width - padding.right, y);

			// Y Label
			ctx.fillText(Math.round(val).toString(), 5, y + 3);
		}
		ctx.stroke();

		// X Axis
		// We want to draw Date labels. Determine stride based on windowSize
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

		// Draw Line
		ctx.beginPath();
		ctx.lineWidth = 2;
		ctx.strokeStyle = textColor; // or accent via options

		// We draw from floor(windowStart)-1 to ceil(windowStart+size)+1 to cover edges
		const drawStart = Math.max(0, Math.floor(this.windowStart) - 1);
		const drawEnd = Math.min(this.totalPoints - 1, Math.ceil(this.windowStart + this.windowSize) + 1);

		for (let i = drawStart; i <= drawEnd; i++) {
			const x = adjustedMapX(i);
			const y = mapY(this.values[i]);
			if (i === drawStart) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();

		// Draw Hover Point
		if (this.hoverIndex !== -1 && this.hoverIndex >= 0 && this.hoverIndex < this.values.length) {
			const x = adjustedMapX(this.hoverIndex);
			const y = mapY(this.values[this.hoverIndex]);

			// Only draw if visible
			if (x >= padding.left && x <= width - padding.right) {
				ctx.beginPath();
				ctx.arc(x, y, 4, 0, Math.PI * 2);
				ctx.fillStyle = textColor;
				ctx.fill();

				// Tooltip
				const date = this.dates[this.hoverIndex];
				const label = `${date.toLocaleDateString()}: ${this.values[this.hoverIndex]}`;
				const textWidth = ctx.measureText(label).width;

				let tx = x - textWidth / 2;
				let ty = y - 10;

				// Clamp tooltip
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

			// Convert px to index units
			const drawW = this.width - this.options.padding.left - this.options.padding.right;
			// 1 unit = drawW / (windowSize - 1) px
			const pxPerUnit = drawW / (this.windowSize - 1);
			const deltaUnits = -deltaPx / pxPerUnit; // Drag right -> move window left

			this.windowStart += deltaUnits;
			this.clampWindow();
			this.requestDraw();
		}

		// Hover calculation
		const rect = this.canvas.getBoundingClientRect();
		const x = clientX - rect.left;
		const { padding } = this.options;
		const drawW = this.width - padding.left - padding.right;

		if (x >= padding.left && x <= this.width - padding.right) {
			// Inverse mapX
			// x = padding.left + norm * drawW
			// norm = (x - padding.left) / drawW
			// idx = norm * (windowSize - 1) + windowStart
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
		e.preventDefault(); // Stop page scroll

		const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
		const newSize = this.windowSize * zoomFactor;

		// Clamp zoom
		if (newSize < this.minZoom || newSize > this.maxZoom) return;
		if (newSize > this.totalPoints) return; // Can't zoom out more than data

		// Zoom around center of view (or mouse position if complex) - simple: center
		const center = this.windowStart + this.windowSize / 2;
		const newStart = center - newSize / 2;

		this.windowSize = newSize;
		this.windowStart = newStart;
		this.clampWindow();
		this.requestDraw();
	}

	clampWindow() {
		if (this.windowStart < 0) this.windowStart = 0;
		if (this.windowStart + this.windowSize > this.totalPoints - 1) { // -1? 
			this.windowStart = this.totalPoints - 1 - this.windowSize + 1; // Align to end
			// Wait, if 10 points (0..9). Window 5. 
			// Max start is 9 - 5 = 4? indices 4,5,6,7,8,9? length 6?
			// windowSize is number of intervals or points? 
			// Let's say windowSize is "number of visible points - 1" (intervals). 
			// Current logic: norm * (windowSize - 1). 
			// If minZoom=7, we see 7 points. Interval span is 6.

			// Let's stick effectively to:
			if (this.windowStart + this.windowSize > this.totalPoints - 1) {
				this.windowStart = Math.max(0, this.totalPoints - 1 - (this.windowSize - 1)); // ?
				// Actually let's simplify. windowSize is explicitly "span in index units"
				if (this.windowStart > this.totalPoints - 1 - this.windowSize) {
					this.windowStart = this.totalPoints - 1 - this.windowSize;
				}
			}
		}
		if (this.windowStart < 0) this.windowStart = 0; // double check
	}

	onTouchStart(e) {
		if (e.touches.length === 1) {
			this.isDragging = true;
			this.lastX = e.touches[0].clientX;
		} else if (e.touches.length === 2) {
			this.isDragging = false;
			// Pinch start logic could go here
		}
	}

	onTouchMove(e) {
		if (e.touches.length === 1 && this.isDragging) {
			e.preventDefault(); // Stop scroll
			this.onPointerMove(e);
		}
	}
}
