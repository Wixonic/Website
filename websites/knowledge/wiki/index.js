import { getDownloadURL, ref } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";

import { join } from "/script/path.js";
import { request } from "/script/request.js";

const display = (content, assets) => {
	const loader = document.querySelector(".loader");
	const container = document.querySelector(".content");

	container.innerHTML = content;

	container.querySelectorAll("code").forEach((element) => {
		const preElement = document.createElement("pre");
		element.replaceWith(preElement);
		preElement.append(element);

		hljs.highlightElement(element);
	});

	container.querySelectorAll("math").forEach((element) => {
		const spanElement = document.createElement("span");
		spanElement.classList.add("math");
		spanElement.textContent = element.textContent;
		const isBlock = element.classList.contains("block");
		element.replaceWith(spanElement);
		katex.render(spanElement.textContent, spanElement, {
			throwOnError: false,
			displayMode: isBlock
		});
	});
	loader.remove();

	container.querySelectorAll("img").forEach((element) => {
		const src = element.getAttribute("src");
		if (assets[src]) element.src = URL.createObjectURL(assets[src]);
		else element.src = new URL("/raw/icon/image_not_found.png", path.assets).href;
	});
};

const load = async (asset, format = "blob") => {
	const document = ref(firebase.default.storage, join("knowledge", location.pathname, asset));

	const url = await getDownloadURL(document);

	const req = await request("GET", url, format, null, null, 86400, false);
	if (req.status === 200) return req.response;
	else throw new Error(`Received code ${req.status} ${req.statusText}`);
};

addEventListener("DOMContentLoaded", async () => {
	const auth = await firebase.getUser();

	if (!auth.user) location.href = new URL("/login?redirect=" + encodeURIComponent(location.href), path.accounts).href;
	else {
		console.log("Logged in as " + auth.user.displayName);

		try {
			const metadatas = await load("index.json", "json");
			const content = await load(metadatas.content, "text");

			const assetsRequests = metadatas.assets.map((asset) => load(asset));
			const assetsList = await Promise.all(assetsRequests);

			const assets = {};
			metadatas.assets.forEach((assetName, index) => assets[assetName] = assetsList[index]);

			display(content, assets);
		} catch (error) {
			if (error.code === "storage/unauthorized") display("<h1>Oops!</h1> <p>You don't have permission to access this content.</p>");
			else if (error.code === "storage/object-not-found") display("<h1>Oops!</h1> <p>It seems this content doesn't exist.</p>");
			else {
				display(`<h1>Oops!</h1> <p>An unexpected error occurred while fetching the content.</p> <code>${error.message}</code>`);
				console.error("Error while fetching content:", error.code);
			}
		}
	}
});