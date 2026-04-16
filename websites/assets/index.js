import { request } from "/script/request.js";

const metadata = {
	title: "Asset Viewer - Wixonic",
	description: ""
};

const components = [];

const init = async () => {
	const indexRequest = await request("GET", "/index.json", "json");

	if (indexRequest.status == 200) {
		const index = indexRequest.response;

		const assetIndexPath = index[location.pathname];

		if (assetIndexPath) {
			const assetRequest = await request("GET", new URL(assetIndexPath, location.origin), "json");

			if (assetRequest.status == 200) {
				const directory = assetIndexPath.replace("raw/", "").split("/").slice(0, -1).join("/") + "/";
				const currentFilePath = location.pathname.replace(directory, "");

				const asset = assetRequest.response;

				const path = document.querySelector(".path");
				const canvas = document.querySelector(".canvas");
				const name = document.querySelector(".name");
				const files = document.querySelector(".files");
				const download = document.querySelector(".toolbox .download");
				const website = document.querySelector(".toolbox .website");
				const description = document.querySelector(".description");
				const details = document.querySelector(".details");

				path.innerHTML = location.pathname;
				if (asset.name) { name.innerHTML = asset.name; } else name.classList.add("hidden");
				if (asset.description) { description.innerHTML = asset.description; } else description.classList.add("hidden");
				if (asset.download) download.addEventListener("click", () => open(asset.url, "_blank"));
				else download.classList.add("hidden");
				if (asset.url) download.addEventListener("click", () => open(asset.url, "_blank"));
				else download.classList.add("hidden");

				const currentFile = asset.files.find((file) => file.path == currentFilePath);
				console.log(currentFile);

				switch (asset.type) {
					case "image":
						{
							const image = document.createElement("image");

						}
						break;

					default:
						{
							canvas.innerHTML = `Oh no! It looks like previewing this type of asset (${asset.type}) isn't supported yet.`;
						}
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