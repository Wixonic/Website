export default {
	"nav": {
		added: (node) => {
			const button = document.createElement("button");
			button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16Zm176,112H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"></path></svg>`;

			button.classList.add("nav-toggle");

			button.addEventListener("click", () => {
				node.classList.toggle("hidden");
			});

			const header = document.querySelector("body > header");
			if (header) header.prepend(button);

			node.querySelectorAll("a").forEach((link) => {
				link.addEventListener("click", () => {
					node.classList.add("hidden");
				});
			});
		},
		removed: (node) => {
			const button = document.querySelector("body > header > .nav-toggle");
			if (button) button.remove();
		}
	}
};