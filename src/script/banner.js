/** @type {HTMLElement | null} */
let currentBanner = null;

/** @type {((value: any) => void) | null} */
let currentResolve = null;

/**
 * Displays a banner with a message and action buttons.
 * @param {import("/src/types.d.ts").BannerOptions} options
 * @returns {Promise<any>} Resolves with the value of the chosen action.
 */
const showBanner = ({ message, actions }) => {
	hideBanner();

	return new Promise((resolve) => {
		currentResolve = resolve;

		const banner = document.createElement("div");
		banner.classList.add("banner");

		const inner = document.createElement("div");
		inner.classList.add("banner-inner");

		const messageEl = document.createElement("span");
		messageEl.classList.add("banner-message");
		messageEl.textContent = message;

		const actionsEl = document.createElement("div");
		actionsEl.classList.add("banner-actions");

		for (const action of actions) {
			const button = document.createElement("button");
			button.classList.add("banner-action");
			button.textContent = action.label;
			button.disabled = true;

			button.addEventListener(
				"click",
				() => {
					const res = currentResolve;
					currentResolve = null;
					hideBanner();
					if (res) res(action.value);
				},
				{ once: true },
			);

			actionsEl.appendChild(button);
		}

		inner.appendChild(messageEl);
		inner.appendChild(actionsEl);
		banner.appendChild(inner);

		document.body.appendChild(banner);
		currentBanner = banner;

		setTimeout(() => {
			for (const button of /** @type {NodeListOf<HTMLButtonElement>} */ (
				actionsEl.querySelectorAll(".banner-action")
			)) {
				button.disabled = false;
			}
		}, 250);
	});
};

/**
 * Hides and removes the current banner after a delay.
 * Resolves the pending Promise with `null` immediately.
 */
const hideBanner = () => {
	if (currentBanner) {
		const bannerToRemove = currentBanner;
		currentBanner = null;
		bannerToRemove.classList.add("banner-hiding");
		setTimeout(() => bannerToRemove.remove(), 250);
	}

	if (currentResolve) {
		const res = currentResolve;
		currentResolve = null;
		res(null);
	}
};

export { showBanner, hideBanner };
