/**
 * 
 * @private
 */
const internal = {
	hideTimeout: null,
	section: null,
	visible: true
};

/**
 * 
 */
const loader = {
	show: () => {
		if (!internal.visible && internal.section) {
			clearTimeout(internal.hideTimeout);
			internal.section.setAttribute("active", "true");
			section.removeAttribute("hidden");
		}
	},

	hide: () => {
		if (internal.visible && internal.section) {
			clearTimeout(internal.hideTimeout);
			internal.section.removeAttribute("active");
			internal.hideTimeout = setTimeout(() => section.setAttribute("hidden", "true"), 500);
		}
	}
};

window.addEventListener("DOMContentLoaded", () => internal.section = document.querySelector("section#loader"));

export {
	loader
};