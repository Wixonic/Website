import firebase from "/lib/firebase.js";
import { init } from "/lib/main.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	const user = await firebase.getUser();
	if (!user.valid) location.href = `/login/?redirect=${encodeURIComponent(window.location.href)}`;

	console.log(user);
});