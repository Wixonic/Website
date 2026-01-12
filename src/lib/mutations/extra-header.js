export default {
	".extra-header": {
		added: (node) => {
			const footer = document.querySelector("footer");

			if (!footer) return;

			let defaultBottom = 0;
			let offset = 0;

			const measure = () => {
				const prev = node.style.bottom;
				node.style.bottom = "";
				defaultBottom = parseFloat(getComputedStyle(node).bottom);
				offset = parseFloat(getComputedStyle(footer).paddingTop);
				node.style.bottom = prev;
			};

			const update = () => {
				if (!window.matchMedia("(max-width: 50rem)").matches) {
					node.style.bottom = "";
					return;
				}

				const footerRect = footer.getBoundingClientRect();
				const windowHeight = window.innerHeight;

				const overlap = windowHeight - footerRect.top;
				const target = overlap - offset;

				if (target > defaultBottom) node.style.bottom = `${target}px`;
				else node.style.bottom = "";
			};

			window.addEventListener("resize", () => {
				measure();
				update();
			});

			window.addEventListener("scroll", update);

			measure();
			update();
		}
	}
};