import { init } from "/lib/main.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	const sections = document.querySelectorAll("section");
	const separator = document.querySelector("separator");

	separator.addEventListener("click", () => {
		sections[1].scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	});

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				document.body.classList.toggle("dark", entry.target.classList.contains("wixiland"));
			}
		});
	}, {
		root: null,
		threshold: 0.5
	});

	sections.forEach((section) => observer.observe(section));
});