import { request } from "/script/request.js";

const main = async () => {
	const indexRequest = await request("GET", "/index.json", "json");

	if (indexRequest.status == 200) {
		const index = indexRequest.response;

		const assetIndexPath = index[location.pathname];

		if (assetIndexPath) {
			const assetRequest = await request("GET", new URL(assetIndexPath, location.origin), "json");

			if (assetRequest.status == 200) {
				const asset = assetRequest.response;

				console.log(asset);

				const path = document.querySelector(".path");
				const canvas = document.querySelector(".canvas");
				const name = document.querySelector(".name");
				const description = document.querySelector(".description");

				path.innerHTML = location.pathname;
				if (asset.name) { name.innerHTML = asset.name; } else name.classList.add("hidden");
				if (asset.description) { description.innerHTML = asset.description; } else description.classList.add("hidden");

				switch (asset.type) {
					default:
						{
							canvas.innerHTML = `Oh no! It looks like previewing this type of asset (${asset.type}) isn't supported yet.`;
						}
				}
			} else {
				console.warn("Failed to load asset index for this page. Falling back to default assets.");
			}
		} else {
			console.warn("No asset index found for this page.");
		}
	}
};

main();