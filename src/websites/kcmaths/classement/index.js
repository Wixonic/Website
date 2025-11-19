import { init } from "/lib/main.js";

import { path, updateURL } from "/lib/script/path.js";
import request from "/lib/script/request.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	let entries = await request("GET", new URL("/kcmaths/entries/", path.server), "json", "application/json", null, 600);

	if ([200, 204].includes(entries.status)) entries = entries.response;
	else entries = [];

	document.querySelector(".input.date").setAttribute("dates", entries.join(", "));

	for (let i = 0; i < entries.length; ++i) entries[i] = new Date(entries[i]);
	entries = entries.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
});