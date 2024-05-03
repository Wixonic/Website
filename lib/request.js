import storage from "/lib/storage.js";

const request = (method, url, type = "", mimeType = "text/plain", body, cache = 180, credentials = false) => new Promise((resolve, reject) => {
	try {
		const cachedResponse = storage.getItem(`request-cache|${url}`);
		if (cachedResponse) {
			const data = JSON.parse(cachedResponse);
			if (type == "json") data.response = JSON.parse(data.response);

			if (Date.now() - data.timestamp < cache * 1000) resolve(data);
			else throw "Expired";
		} else throw "Uncached";
	} catch {
		const xhr = new XMLHttpRequest();
		xhr.open(method, url, true);
		xhr.withCredentials = credentials;
		xhr.responseType = type;
		xhr.overrideMimeType(mimeType);

		xhr.addEventListener("load", async () => {
			if (String(xhr.status).startsWith("3")) resolve(await request(method, xhr.getResponseHeader("location"), type, mimeType, cache));
			else {
				const headers = {};
				xhr.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach((line) => {
					const parts = line.split(": ");
					headers[parts.shift()] = parts.join(": ");
				});

				const response = {
					headers,
					response: xhr.response,
					status: xhr.status,
					timestamp: Date.now()
				};

				storage.setItem(`request-cache|${url}`, JSON.stringify(response));
				resolve(response);
			}
		});
		xhr.addEventListener("error", () => reject({}));
		xhr.send(body);
	}
});

export default request;