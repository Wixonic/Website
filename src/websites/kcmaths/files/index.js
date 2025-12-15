import { init } from "/lib/main.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	document.querySelector(".extra-header .overview").addEventListener("click", () => location.href = path.kcmaths);
	document.querySelector(".extra-header .leaderboard").addEventListener("click", () => location.href = new URL("/leaderboard/", path.kcmaths));
});