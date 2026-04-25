/**
 * Combine paths, similar to {@link https://nodejs.org/api/path.html#pathjoinpaths Node.js path.join} method
 * @param  {...string} parts 
 * @returns {string}
 */
const join = (...parts) => {
	return parts.map((part, index) => {
		part = String(part);

		if (index === 0) return part.trim().replace(/[\/]*$/g, "");
		else return part.trim().replace(/^[\/]*|[\/]*$/g, "");
	}).filter(Boolean).join("/");
};

export { join };
export default { join };