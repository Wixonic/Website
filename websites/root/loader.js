/**
 * @typedef {Object} InternalLoader
 * @property {number?} inactiveTimeout
 * @property {number?} hideTimeout
 * @property {Element?} section
 * @property {boolean} visible
 * @private
 */

/**
 * @type {InternalLoader}
 */
const internal = {
	inactiveTimeout: null,
	hideTimeout: null,
	section: null,
	visible: true
};

const loader = {
	show: () => {
		if (!internal.visible && internal.section) {
			clearTimeout(internal.inactiveTimeout);
			clearTimeout(internal.hideTimeout);

			internal.section.setAttribute("active", "true");
			internal.section.removeAttribute("hidden");

			internal.visible = true;
		}
	},

	hide: () => {
		if (internal.visible && internal.section) {
			clearTimeout(internal.inactiveTimeout);
			clearTimeout(internal.hideTimeout);

			internal.inactiveTimeout = setTimeout(() => internal.section.removeAttribute("active"), 500);
			internal.hideTimeout = setTimeout(() => internal.section.setAttribute("hidden", "true"), 1000);

			internal.visible = false;
		}
	}
};

window.addEventListener("DOMContentLoaded", () => internal.section = document.querySelector("section#loader"));

export default loader;