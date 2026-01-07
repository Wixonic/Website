export default {
	"nav": {
		added: (node) => {
			const button = document.querySelector(".nav-toggle");
			button.classList.add("active");

			button.addEventListener("click", () => {
				node.classList.toggle("visible");
			});

			node.querySelectorAll("a").forEach((link) => {
				link.addEventListener("click", () => {
					node.classList.remove("visible");
				});
			});
		},
		removed: (node) => {
			const button = document.querySelector(".nav-toggle");
			button.classList.remove("active");
		}
	}
};