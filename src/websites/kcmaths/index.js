import { init } from "/lib/main.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	document.querySelector(".extra-header .leaderboard").addEventListener("click", () => location.href = new URL("/leaderboard/", path.kcmaths));
	document.querySelector(".extra-header .files").addEventListener("click", () => location.href = new URL("/files/", path.kcmaths));
});