import { init } from "/lib/main.js";
import { path } from "/lib/script/path.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	document.querySelector(".extra-header .leaderboard").addEventListener("click", () => location.href = new URL("/leaderboard/", path.kcmaths));
});