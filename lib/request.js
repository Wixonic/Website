const request = (method, url, type = "", mimeType = "text/plain") => new Promise((resolve, reject) => {
	const xhr = new XMLHttpRequest();
	xhr.open(method, url, true);
	xhr.responseType = type;
	xhr.overrideMimeType(mimeType);

	xhr.addEventListener("load", () => resolve(xhr));
	xhr.addEventListener("error", () => reject(xhr));
	xhr.send();
});

export default request;