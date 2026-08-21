import { join } from "/script/path.js";
import { request, RequestError } from "/script/request.js";
import { parseDuration } from "/script/utils.js";

const formatBytes = (bytes) => {
	if (!bytes || bytes === 0) return "0 B";
	const kiloBytes = 1024;
	const sizeUnits = ["B", "KB", "MB", "GB", "TB"];
	const sizeUnitIndex = Math.floor(Math.log(bytes) / Math.log(kiloBytes));
	return `${parseFloat((bytes / Math.pow(kiloBytes, sizeUnitIndex)).toFixed(2))} ${sizeUnits[sizeUnitIndex]}`;
};

const setMetaProperty = (property, content) => {
	let metaElement = document.querySelector(`meta[property="${property}"]`);
	if (!metaElement) {
		metaElement = document.createElement("meta");
		metaElement.setAttribute("property", property);
		document.head.appendChild(metaElement);
	}
	metaElement.setAttribute("content", content);
};

addEventListener("DOMContentLoaded", async () => {
	const pathParts = location.pathname.split("/").filter(Boolean);
	const fileIdentifier = pathParts[pathParts.indexOf("download") + 1];
	const accessKey = new URLSearchParams(location.search).get("key");

	if (!fileIdentifier) return open(path.onion, "_self");

	setMetaProperty("og:image", join(path.server.onion, fileIdentifier, "card.webp"));
	setMetaProperty("og:url", location.href);

	try {
		const fileRequest = await request("GET", join(path.server.onion, fileIdentifier), "json", "application/json");
		const fileData = fileRequest.response;

		if (fileRequest.status !== 200 || !fileData || fileData.error) {
			document.getElementById("loading").classList.add("hidden");
			const errorElement = document.getElementById("error");
			const errorMessage = document.getElementById("error-message");
			if (fileData?.error) errorMessage.textContent = fileData.error;
			errorElement.classList.remove("hidden");
			return;
		}

		const fileName = fileData.name || "Untitled";
		const lastDotIndex = fileName.lastIndexOf(".");
		const baseName = lastDotIndex !== -1 ? fileName.slice(0, lastDotIndex) : fileName;
		const extension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex) : "";

		document.title = `${fileName} | Onion Download | Wixonic`;
		setMetaProperty("og:title", `${fileName} | Onion Download`);
		if (fileData.description) setMetaProperty("og:description", fileData.description);

		document.getElementById("file-name").textContent = baseName;
		document.getElementById("file-extension").textContent = extension;
		document.getElementById("file-mime-type").textContent = fileData.mimeType || "Unknown";
		document.getElementById("file-size").textContent = formatBytes(fileData.size);
		document.getElementById("file-fifo-position").textContent = fileData.fifoPosition ? `#${fileData.fifoPosition}` : "N/A";

		if (fileData.uploader?.displayName || fileData.uploader?.username) {
			const uploaderName = fileData.uploader.displayName || fileData.uploader.username;
			const uploaderElement = document.getElementById("file-uploader");
			uploaderElement.textContent = uploaderName;
			uploaderElement.setAttribute("data-username", uploaderName);

			if (fileData.uploader.displayNameStyle) {
				uploaderElement.classList.add(`discord-name-style-font-${fileData.uploader.displayNameStyle.font_id}`, `discord-name-style-effect-${fileData.uploader.displayNameStyle.effect_id}`);
				if (fileData.uploader.displayNameStyle.colors?.[0] !== undefined) uploaderElement.style.setProperty("--discord-name-style-color-1", `#${fileData.uploader.displayNameStyle.colors[0].toString(16).padStart(6, "0")}`);
				if (fileData.uploader.displayNameStyle.colors?.length > 1) uploaderElement.style.setProperty("--discord-name-style-color-2", `#${fileData.uploader.displayNameStyle.colors[1].toString(16).padStart(6, "0")}`);
			}

			const avatarImageElement = document.querySelector("#stat-uploader .avatar image");
			if (fileData.uploader.avatar && avatarImageElement) avatarImageElement.setAttribute("href", fileData.uploader.avatar.replace(/\.gif(\?.*)?$/i, ".webp$1"));

			const decorationSvgElement = document.querySelector("#stat-uploader .avatar-decoration");
			const decorationImageElement = decorationSvgElement?.querySelector("image");
			if (fileData.uploader.avatarDecoration && decorationImageElement) {
				decorationImageElement.setAttribute("href", fileData.uploader.avatarDecoration.replace(/\.gif(\?.*)?$/i, ".webp$1").replace(/\.png(\?.*)?$/i, ".webp$1"));
				decorationSvgElement.classList.remove("hidden");
			}

			document.getElementById("stat-uploader").classList.remove("hidden");
		}

		if (fileData.expiresAt) {
			const remainingDuration = fileData.expiresAt - Date.now();
			if (remainingDuration > 0) {
				document.getElementById("file-expiration").textContent = parseDuration(remainingDuration);
				document.getElementById("stat-expires").classList.remove("hidden");
			}
		}

		if (fileData.maxDownloads) {
			document.getElementById("file-download-count").textContent = `${fileData.downloadCount || 0} / ${fileData.maxDownloads}`;
			document.getElementById("stat-downloads").classList.remove("hidden");
		}

		if (fileData.description) {
			document.getElementById("file-description").textContent = fileData.description;
			document.getElementById("card-description").classList.remove("hidden");
		}

		const downloadUrl = `${join(path.server.onion, fileIdentifier, "download")}${accessKey ? `?key=${encodeURIComponent(accessKey)}` : ""}`;
		const downloadButton = document.getElementById("download-button");
		downloadButton.href = downloadUrl;

		const copyButton = document.getElementById("copy-button");
		copyButton.addEventListener("click", async () => {
			try {
				await navigator.clipboard.writeText(location.href);
				copyButton.textContent = "Copied!";
				setTimeout(() => copyButton.textContent = "Copy Link", 2000);
			} catch {
				copyButton.textContent = "Failed to copy";
				setTimeout(() => copyButton.textContent = "Copy Link", 2000);
			}
		});

		document.getElementById("loading").classList.add("hidden");
		document.getElementById("card").classList.remove("hidden");
	} catch (error) {
		document.getElementById("loading").classList.add("hidden");
		const errorElement = document.getElementById("error");
		const errorMessage = document.getElementById("error-message");
		if (error instanceof RequestError && error.status === 404) errorMessage.textContent = "File not found or has been deleted.";
		else if (error instanceof RequestError && error.status === 403) errorMessage.textContent = "Access denied. A valid key is required.";
		else errorMessage.textContent = "An error occurred while loading file details.";
		errorElement.classList.remove("hidden");
	}
});