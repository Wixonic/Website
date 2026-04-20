import { formatDuration, formatSize } from "/script/format.js";
import { request } from "/script/request.js";

/** @type {import("/types.d.ts").Module["components"]} */
const components = [];

/** @type {import("/types.d.ts").Module["metadata"]} */
const metadata = {
	title: "Asset Viewer | Wixonic",
	description: ""
};

/**
 * @param {string} url
 * @param {string?} fileName
 */
const downloadFile = (url, fileName) => {
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName || "download";
	document.body.append(link);
	link.click();
	link.remove();
};

const notFound = () => {

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
				if (asset.download) {
					downloadElement.querySelector(".content").innerHTML += currentFile.size == null ? "" : ` (${formatSize(currentFile.size)})`;
					downloadElement.addEventListener("click", () => downloadFile(new URL("raw" + directory + currentFile.path, location.origin), asset.name));
				}
				else downloadElement.classList.add("hidden");
				if (asset.link) linkElement.addEventListener("click", () => open(asset.link, "_blank"));
				else linkElement.classList.add("hidden");

				const details = {};

				switch (asset.type) {
					case "audio":
						{
							details["Format"] = currentFile.format;
							details["Duration"] = formatDuration(asset.duration, 3);
							details["Sample Rate"] = formatSize(currentFile.sampleRate, "Hz", 1);
							details["Bitrate"] = formatSize(currentFile.bitrate);
							details["Codec"] = currentFile.codec;
							details["MIME"] = currentFile.mime ?? "Unknown";
						}
						break

					case "video":
						{
							details["Format"] = currentFile.format;
							details["Dimensions"] = `${currentFile.width}<span class="subtle">x</span>${currentFile.height}`;
							details["Duration"] = formatDuration(asset.duration, 3);
							details["FPS"] = currentFile.fps;
							details["Bitrate"] = `${currentFile.audioBitrate == null ? "No audio" : formatSize(currentFile.audioBitrate)}<span class="subtle"> - </span>${currentFile.videoBitrate == null ? "No video" : formatSize(currentFile.videoBitrate)}`;
							details["Codec"] = `${currentFile.audioCodec ?? "No audio"}<span class="subtle"> - </span>${currentFile.videoCodec ?? "No video"}`;
							details["MIME"] = `${currentFile.audioMime ?? "No audio"}<span class="subtle"> - </span>${currentFile.videoMime ?? "No video"}`;

							const audioDetails = [];
							if (currentFile.channels != null) audioDetails.push(`${currentFile.channels}ch`);
							if (currentFile.channelLayout) audioDetails.push(currentFile.channelLayout);
							if (currentFile.sampleRate != null) audioDetails.push(formatSize(currentFile.sampleRate, "Hz", 1));
							if (audioDetails.length) details["Audio"] = audioDetails.join(`<span class="subtle"> - </span>`);
						}
						break

					case "image":
						{
							details["Dimensions"] = `${currentFile.width}<span class="subtle">x</span>${currentFile.height}`;
							details["Codec"] = currentFile.codec;
							details["MIME"] = currentFile.mime ?? "Unknown";
						}
						break;

					case "font":
						{
							details["Style"] = currentFile.style;
						}
						break

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
			} else {
				console.warn("Failed to load asset index for this page.");
				notFound();
			}
		} else {
			console.warn("No asset index found for this page.");
			notFound();
		}
	} else {
		console.warn("Failed to load main index.");
		notFound();
	}
};

export {
	components,
	init,
	metadata
};