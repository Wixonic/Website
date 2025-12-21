import storage from "./storage.js";

/**
 * @typedef {Object} Response
 * @property {Object.<string, string>} headers
 * @property {any} response
 * @property {number} status
 * @property {number} timestamp
 */

/**
 * Performs an XMLHttpRequest with caching support.
 * @param {"GET" | "POST" | "PUT" | "PATCH" | "DELETE"} method
 * @param {URL | string} url
 * @param {XMLHttpRequestResponseType} type
 * @param {string} mimeType
 * @param {Document | XMLHttpRequestBodyInit | null} [body]
 * @param {number} [cache=180] - Cache duration in seconds. 0 = permanent, -1 = disabled (always fetch).
 * @param {boolean} [credentials=false]
 * @returns {Promise<Response>}
 */
const request = (method, url, type = "text", mimeType = null, body = null, cache = 180, credentials = false) => {
	return new Promise((resolve) => {
		try {
			const cacheKey = `request-cache|${url}`;
			const isCacheableType = !["blob", "arraybuffer", "document"].includes(type);

			if (isCacheableType && cache !== -1) {
				const cachedItem = storage.getItem(cacheKey);
				if (cachedItem) {
					try {
						const data = JSON.parse(cachedItem);
						if (cache === 0 || (Date.now() - data.timestamp) < (cache * 1000)) {
							resolve(data);
							return;
						}
					} catch (e) {
						console.warn("Failed to parse cached response", e);
					}
				}
			}

			/* console.log(`${method} ${url} - Cache: ${cache > 0 ? cache + "s" : (cache < 0 ? "disabled" : "permanent")}`); */

			const xhr = new XMLHttpRequest();
			xhr.open(method, url, true);
			xhr.responseType = type;

			if (mimeType) {
				xhr.overrideMimeType(mimeType);
				xhr.setRequestHeader("Content-Type", mimeType);
			}

			xhr.withCredentials = credentials;

			xhr.onload = () => {
				const headers = {};
				const headerStr = xhr.getAllResponseHeaders();
				if (headerStr) {
					headerStr.trim().split(/[\r\n]+/).forEach((line) => {
						const parts = line.split(": ");
						const key = parts.shift();
						const value = parts.join(": ");
						headers[key] = value;
					});
				}

				/** @type {Response} */
				const responseData = {
					headers,
					response: xhr.response,
					status: xhr.status,
					timestamp: Date.now()
				};

				if (cache >= 0 && isCacheableType) {
					try {
						storage.setItem(cacheKey, JSON.stringify(responseData));
					} catch (e) {
						console.warn("Quota exceeded or storage error", e);
					}
				}

				resolve(responseData);
			};

			xhr.onerror = () => {
				resolve({
					headers: {},
					response: null,
					status: 0,
					timestamp: Date.now(),
					error: "Network error"
				});
			};

			xhr.send(body);
		} catch (e) {
			console.error("Request error:", e);
			resolve({
				headers: {},
				response: null,
				status: 0,
				timestamp: Date.now(),
				error: String(e)
			});
		}
	});
};

export default request;