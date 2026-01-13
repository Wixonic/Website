import extraHeaderMutation from "./mutations/extra-header.js";
import footerMutation from "./mutations/footer.js";
import headerMutation from "./mutations/header.js";
import inputDateMutation from "./mutations/input-date.js";
import linkSecurityMutation from "./mutations/link-security.js";
import navMutation from "./mutations/nav.js";
import tableSortingMutation from "./mutations/table-sorting.js";

import storage from "./script/storage.js";


/**
 * @typedef {{added: (node: HTMLElement) => void; removed: (node: HTMLElement) => void; changed: (node: HTMLElement, attribute: string, oldValue: string | null) => void}} Mutation
 */

const init = async () => {
	const mutationSelectors = {};
	/** @param {Record<string, Mutation>} mutations */
	const addMutations = (mutations) => {
		for (const selector in mutations) {
			if (!mutationSelectors[selector]) {
				mutationSelectors[selector] = [];
			}

			mutationSelectors[selector].push(mutations[selector]);
		}
	};


	addMutations(extraHeaderMutation);
	addMutations(footerMutation);
	addMutations(headerMutation);
	addMutations(inputDateMutation);
	addMutations(linkSecurityMutation);
	addMutations(navMutation);
	addMutations(tableSortingMutation);


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

	/**
	 * @param {HTMLElement} node
	 * @param {string} attribute
	 * @param {string} oldValue
	 */
	const changed = (node, attribute, oldValue) => {
		for (const selector in mutationSelectors) {
			if (node.matches(selector)) {
				for (const action of mutationSelectors[selector]) {
					if (action.changed) action.changed(node, attribute, oldValue);
				}
			}
		}
	};

	added(document.documentElement);

	const observer = new MutationObserver((mutations, observer) => {
		for (const mutation of mutations) {
			if (mutation.type === "childList") {
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === 1) added(node);
				});

				mutation.removedNodes.forEach((node) => {
					if (node.nodeType === 1) removed(node);
				});
			} else if (mutation.type === "attributes") {
				if (mutation.target.nodeType === 1) changed(mutation.target, mutation.attributeName, mutation.oldValue);
			}
		}
	});

	observer.observe(document.documentElement, {
		attributes: true,
		childList: true,
		subtree: true
	});

	const analyticScript = document.createElement("script");
	analyticScript.src = "https://www.googletagmanager.com/gtag/js?id=G-Q6C79RDDZX";

	if (storage.getItem("consent") === "true") {
		document.head.append(analyticScript);
	}

	const cookiePopup = document.querySelector("aside.cookie");
	if (!storage.getItem("consent")) cookiePopup.classList.remove("hidden");

	cookiePopup.querySelector("#cookie-accept").addEventListener("click", () => {
		storage.setItem("consent", "true");
		document.head.append(analyticScript);
		cookiePopup.classList.add("hidden");
	});

	cookiePopup.querySelector("#cookie-decline-analytics").addEventListener("click", () => {
		storage.setItem("consent", "features");
		cookiePopup.classList.add("hidden");
	});

	cookiePopup.querySelector("#cookie-decline").addEventListener("click", () => {
		storage.setItem("consent", "false");
		cookiePopup.classList.add("hidden");
	});
};

export {
	init
};