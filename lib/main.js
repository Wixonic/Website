addEventListener("DOMContentLoaded", () => {


	const mutationSelectors = {};
	const addMutations = (mutations) => {
		for (const selector in mutations) {
			if (!mutationSelectors[selector]) {
				mutationSelectors[selector] = [];
			}

			mutationSelectors[selector].push(mutations[selector]);
		}
	};



	/** @param {HTMLElement} node */
	const added = (node) => {
		for (const selector in mutationSelectors) {
			if (node.matches(selector)) {
				for (const action of mutationSelectors[selector]) {
					if (action.added) action.added(node);
				}
			}

			const childs = node.querySelectorAll(selector);
			for (const child of childs) {
				for (const action of mutationSelectors[selector]) {
					if (action.added) action.added(child);
				}
			}
		}
	};

	/** @param {HTMLElement} node */
	const removed = (node) => {
		for (const selector in mutationSelectors) {
			if (node.matches(selector)) {
				for (const action of mutationSelectors[selector]) {
					if (action.removed) action.removed(node);
				}
			}

			const childs = node.querySelectorAll(selector);
			for (const child of childs) {
				for (const action of mutationSelectors[selector]) {
					if (action.removed) action.removed(child);
				}
			}
		}
	};

	added(document.documentElement);

	const observer = new MutationObserver((mutations, observer) => {
		for (const mutation of mutations) {
			if (mutation.type === "childList") {
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === 1) {
						added(node);
					}
				});

				mutation.removedNodes.forEach((node) => {
					if (node.nodeType === 1) {
						removed(node);
					}
				});
			} else if (mutation.type === "attributes") {

			}
		}
	});

	observer.observe(document.documentElement, {
		attributes: true,
		childList: true,
		subtree: true
	});
});