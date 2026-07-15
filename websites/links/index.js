addEventListener("DOMContentLoaded", () => {
	const container = document.querySelector("main");

	if (container.getBoundingClientRect().width > 1024) {
		for (const image of container.querySelectorAll("img")) image.src = image.src.replace(".min", "");
		console.log("Switched to full-size images.");
	}

	const links = container.querySelectorAll("a");
	const ratios = new Map();

	const observer = new IntersectionObserver((entries) => {
		for (const entry of entries) ratios.set(entry.target, entry.intersectionRatio);

		let maxRatio = -1;
		let activeLink = null;

		for (const [link, ratio] of ratios) {
			if (ratio > maxRatio) {
				maxRatio = ratio;
				activeLink = link;
			}
		}

		for (const link of links) {
			if (link === activeLink && maxRatio > 0) link.classList.add("active");
			else link.classList.remove("active");
		}
	}, {
		root: container,
		threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 1.0]
	});

	for (const link of links) observer.observe(link);
});