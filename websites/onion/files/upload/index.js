import logger from "/script/logger.js";
import { join } from "/script/path.js";
import { request, RequestError } from "/script/request.js";

addEventListener("DOMContentLoaded", async () => {
	const pathParts = location.pathname.split("/").filter(Boolean);
	const id = pathParts[pathParts.indexOf("upload") + 1];
	const key = new URLSearchParams(location.search).get("key");

	if (!id) return open(path.onion, "_self");

	const input = document.getElementById("upload");
	input.addEventListener("change", async () => {
		const file = input.files[0];
		if (!file) return;

		try {
			const req = await request("POST", `${join(path.server.onion, id, "upload")}?key=${key}&name=${encodeURIComponent(file.name)}`, "json", file.type || "application/octet-stream", file);
			if (req.status === 200) open(join(path.onion, "files/download", id) + `?key=${key}`, "_self");
			else logger.fatalError("Failed to upload file", `Status: ${req.status}`, undefined, `The server refused the file: ${req.status} - ${req.response}`);
		} catch (error) {
			if (error instanceof RequestError) logger.fatalError("Failed to upload file", error.message, error.stack, `The server refused the file: ${error.status} - ${error.response?.error || error.response}`);
			else logger.fatalError("Failed to upload file", error.message, error.stack);
		}
	});
});