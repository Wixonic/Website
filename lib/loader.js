import request from "/lib/request.js";

/**
 * Loads images asynchronously
 * @param {URL | string} url
 * @returns {Promise<HTMLImageElement>}
 */
const image = (url) => new Promise((resolve) => {
	const el = document.createElement("img");
	el.src = url.toString();
	el.addEventListener("load", () => resolve(el));
	el.addEventListener("error", (e) => resolve(el));
});

/**
 * Loads fonts asynchronously
 * @param {string} name
 * @param {URL | string} url
 * @param {FontFaceDescriptors?} descriptors
 * @returns {Promise<FontFace>}
 */
const font = (name, url, descriptors) => {
	const font = new FontFace(name, `url("${url.toString()}")`, descriptors);
	document.fonts.add(font);
	return font.load();
};

export default {
	image,
	font
};