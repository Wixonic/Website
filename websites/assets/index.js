import { request } from "/script/request.js";

/** @type {import("/types.d.ts").Module["components"]} */
const components = [];

/** @type {import("/types.d.ts").Module["metadata"]} */
const metadata = {
	title: "Asset Viewer - Wixonic",
	description: ""
};

/** @type {import("/types.d.ts").Module["init"]} */
const init = async () => {
	const indexRequest = await request("GET", "/index.json", "json");

	if (indexRequest.status == 200) {
		const index = indexRequest.response;
		const pathname = location.pathname.endsWith("/") ? location.pathname.slice(0, -1) : location.pathname;

		const assetIndexPath = index[pathname];

		if (assetIndexPath) {
			const assetRequest = await request("GET", new URL(assetIndexPath, location.origin), "json");

			if (assetRequest.status == 200) {
				const directory = assetIndexPath.replace("raw/", "").split("/").slice(0, -1).join("/") + "/";
				const currentFilePath = pathname.replace(directory, "");

				const asset = assetRequest.response;

				const canvasElement = document.querySelector(".canvas");
				const nameElement = document.querySelector(".name");
				const filesElement = document.querySelector(".files");
				const downloadElement = document.querySelector(".toolbox .download");
				const linkElement = document.querySelector(".toolbox .website");
				const descriptionElement = document.querySelector(".description");
				const detailsElement = document.querySelector(".details");

				const currentFile = asset.files.find((file) => file.path == currentFilePath);

				console.log(asset, currentFile);

				if (asset.name) { nameElement.innerHTML = asset.name; } else nameElement.classList.add("hidden");
				if (asset.description) { descriptionElement.innerHTML = asset.description; } else descriptionElement.classList.add("hidden");
				if (asset.download) downloadElement.addEventListener("click", () => open(new URL(directory + currentFile.path, location.origin), "_blank"));
				else downloadElement.classList.add("hidden");
				if (asset.link) linkElement.addEventListener("click", () => open(asset.link, "_blank"));
				else linkElement.classList.add("hidden");

				const details = {};

				switch (asset.type) {
					case "image":
						{
							details["Dimensions"] = `${currentFile.width}<span class="subtle">x</span>${currentFile.height}`;
							details["Codec"] = currentFile.codec;
						}
						break;

					default:
						{
							canvasElement.innerHTML = `Oh no! It looks like previewing this type of asset (${asset.type}) isn't supported yet.`;
						}
				}

				for (const key in details) {
					const element = document.createElement("div");
					element.innerHTML = `<span class="key">${key}</span><span class="subtle">:</span> ${details[key]}`;
					detailsElement.append(element);
				}
			} else console.warn("Failed to load asset index for this page.");
		} else console.warn("No asset index found for this page.");
	}
};

export {
	components,
	init,
	metadata
};