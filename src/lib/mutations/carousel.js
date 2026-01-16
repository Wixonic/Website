export default {
	".caroussel": {
		added: (node) => {
			const track = node.querySelector(".track");
			const prevBtn = document.createElement("div");
			const nextBtn = document.createElement("div");
			const dotsContainer = document.createElement("div");

			prevBtn.classList.add("arrow", "prev");
			nextBtn.classList.add("arrow", "next");
			dotsContainer.classList.add("dots");

			prevBtn.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM149.66,93.66,115.31,128l34.35,34.34a8,8,0,0,1-11.32,11.32l-40-40a8,8,0,0,1,0-11.32l40-40a8,8,0,0,1,11.32,11.32Z"></path></svg>`;
			nextBtn.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm29.66-93.66a8,8,0,0,1,0,11.32l-40,40a8,8,0,0,1-11.32-11.32L140.69,128,106.34,93.66a8,8,0,0,1,11.32-11.32Z"></path></svg>`;

			node.append(prevBtn, nextBtn, dotsContainer);

			const items = Array.from(track.children);
			let currentIndex = items.findIndex(item => item.classList.contains("active"));
			if (currentIndex === -1) currentIndex = 0;

			if (dotsContainer.children.length === 0) {
				items.forEach((_, index) => {
					const dot = document.createElement("div");
					dot.classList.add("dot");
					dot.addEventListener("click", (e) => {
						e.preventDefault();
						goTo(index);
					});
					dot.addEventListener("touchstart", (e) => {
						e.preventDefault();
						goTo(index);
					});
					dotsContainer.appendChild(dot);
				});
			}

			const dots = Array.from(dotsContainer.querySelectorAll(".dot"));
			dots.forEach((dot, index) => {
				dot.onclick = (e) => {
					e.preventDefault();
					goTo(index);
				};
				dot.ontouchstart = (e) => {
					e.preventDefault();
					goTo(index);
				};
			});

			const update = () => {
				items.forEach((section, index) => {
					if (index === currentIndex) section.classList.add("active");
					else section.classList.remove("active");
				});

				if (dots.length > 0) {
					dots.forEach((dot, index) => {
						if (index === currentIndex) dot.classList.add("active");
						else dot.classList.remove("active");
					});
				}

				const section = items[0];

				const sectionWidth = section.offsetWidth;
				const gap = parseFloat(getComputedStyle(track).gap) || 0;
				const containerWidth = node.offsetWidth;

				const distanceToSectionLeft = currentIndex * (sectionWidth + gap);

				const offset = (containerWidth - sectionWidth) / 2;

				const translateX = -distanceToSectionLeft + offset;

				track.style.transform = `translateX(${translateX}px)`;
			};

			const goTo = (index) => {
				if (index < 0) index = items.length - 1;
				if (index >= items.length) index = 0;
				currentIndex = index;
				update();
			};

			prevBtn.addEventListener("click", (e) => {
				e.preventDefault();
				goTo(currentIndex - 1);
			});
			prevBtn.addEventListener("touchstart", (e) => {
				e.preventDefault();
				goTo(currentIndex - 1);
			});

			nextBtn.addEventListener("click", (e) => {
				e.preventDefault();
				goTo(currentIndex + 1);
			});
			nextBtn.addEventListener("touchstart", (e) => {
				e.preventDefault();
				goTo(currentIndex + 1);
			});

			requestAnimationFrame(update);

			window.addEventListener("resize", update);
		}
	}
};
