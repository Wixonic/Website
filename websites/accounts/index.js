import firebase from "/lib/firebase.js";
import { init } from "/lib/main.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	const user = await firebase.getUser();
	if (!user.valid) location.href = `/login/?redirect=${encodeURIComponent(window.location.href)}`;

	const main = document.querySelector("main");

	const signout = document.createElement("button");
	signout.classList.add("button", "signout");
	signout.innerHTML = "Sign out";
	signout.addEventListener("click", async () => await firebase.signOut());

	// Private account switch

	// Connect Discord

	// Change email, verify email, add public email

	// Change display name

	// Log out from ALL devices (security)

	// Delete account

	main.append(signout);
});