import logger from "/src/script/logger.js";
import storage from "/src/script/storage.js";

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
 * @param {XMLHttpRequestResponseType} [type="text"]
 * @param {string | null} [mimeType=null]
 * @param {Document | XMLHttpRequestBodyInit | null} [body=null]
 * @param {number} [cache=-1] - Cache duration in seconds. 0 = permanent, -1 = disabled (always fetch).
 * @param {boolean} [credentials=false]
 * @returns {Promise<Response>}
 */
const request = (method, url, type = "text", mimeType = null, body = null, cache = -1, credentials = false) => {
	return new Promise((resolve, reject) => {
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
					} catch (unsafeError) {
						const e = unsafeError instanceof Error ? unsafeError : new Error(unsafeError);
						logger.warn("Failed to parse cached response", e.message, e.stack);
					}
				}
			}

			const xhr = new XMLHttpRequest();
			xhr.open(method, url, true);
			xhr.responseType = type;

			if (mimeType) {
				xhr.overrideMimeType(mimeType);
				xhr.setRequestHeader("Content-Type", mimeType);
			}

			xhr.withCredentials = credentials;

			xhr.addEventListener("load", () => {
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
					} catch (unsafeError) {
						const e = unsafeError instanceof Error ? unsafeError : new Error(unsafeError);
						logger.warn("[Request] Quota exceeded or storage error", e.message, e.stack);
					}
				}

				if (xhr.status >= 200 && xhr.status < 300) resolve(responseData);
				else reject(new Error(`[Request] Code ${xhr.status}`));
			});

			xhr.addEventListener("error", () => reject(new Error("Network error")));

			xhr.send(body);
		} catch (unsafeError) {
			const e = unsafeError instanceof Error ? unsafeError : new Error(unsafeError);
			reject(e);
		}
	});
};

export { request };