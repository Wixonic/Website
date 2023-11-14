const canvas = document.getElementById("cursor");
const ctx = canvas.getContext("2d");

const cursor = {
	cache: [],
	cacheLength: 25,
	hidden: true,
	stopped: true,
	size: 5,

	in(e) {
		cursor.hidden = false;

		while (cursor.cache.unshift({
			x: e.clientX,
			y: e.clientY,
			size: cursor.size,
			alpha: 1
		}) < cursor.cacheLength) { }

		if (cursor.stopped) cursor.draw();
	},

	draw() {
		cursor.stopped = false;
		cursor.cache.pop();

		canvas.width = innerWidth * devicePixelRatio;
		canvas.height = innerHeight * devicePixelRatio;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		for (let i = 0; i < cursor.cache.length; ++i) {
			const dot = cursor.cache[i];

			const x = dot.x * devicePixelRatio;
			const y = dot.y * devicePixelRatio;
			const s = dot.size * devicePixelRatio;
			const a = dot.alpha;

			ctx.fillStyle = getComputedStyle(canvas).color;
			ctx.globalAlpha = a;

			ctx.beginPath();
			ctx.ellipse(x, y, s, s, 0, 0, Math.PI * 2);
			ctx.fill();

			if (i > 0 || cursor.hidden) cursor.cache[i].alpha *= 0.4;
		}

		if (cursor.cache.length > 1 || cursor.hidden) requestAnimationFrame(() => cursor.draw());
		else cursor.stopped = true;
	},

	out(e) {
		cursor.hidden = true;

		cursor.cache.unshift({
			x: e.clientX,
			y: e.clientY,
			size: cursor.size,
			alpha: 1
		});

		if (cursor.stopped) cursor.draw();
	}
};

canvas.addEventListener("mouseenter", cursor.in);
canvas.addEventListener("mousemove", cursor.in);
canvas.addEventListener("mouseout", cursor.out);
canvas.addEventListener("mouseleave", cursor.out);

window.addEventListener("resize", cursor.draw);