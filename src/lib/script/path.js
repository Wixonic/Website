/**
 * Combine paths, similar to {@link https://nodejs.org/api/path.html#pathjoinpaths Node.js path.join} method
 * @param  {...string} parts 
 * @returns {string}
 */
const joinPath = (...parts) => {
	return parts.map((part, index) => {
		part = String(part);

		if (index === 0) return part.trim().replace(/[\/]*$/g, "");
		else return part.trim().replace(/^[\/]*|[\/]*$/g, "");
	}).filter(Boolean).join("/");
};

/**
 * @param {URL} url
 */
const updateURL = (url) => {
	try {
		if (history.pushState) history.pushState({ path: url.pathname }, "", url);
	} catch (e) {
		console.warn("Failed to update URL:", e);
	}
};

export {
	joinPath,
	updateURL
};