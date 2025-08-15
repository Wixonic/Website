import firebase from "/lib/firebase.js";
import { init } from "/lib/main.js";
import { path } from "/lib/path.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	const params = new URLSearchParams(location.search);
	const mode = params.get("mode");
	const oobCode = params.get("oobCode");
	const token = params.get("token");
	const redirect = params.get("redirect") ?? (localEnvironment ? path.local.accounts : path.accounts);

	const main = document.querySelector("main");

	const title = document.createElement("h2");
	title.classList.add("fade");
	title.innerHTML = "Verifying...";

	const subtext = document.createElement("p");
	subtext.classList.add("fade");
	subtext.innerHTML = "";

	const button = document.createElement("a");
	button.classList.add("button", "fade");
	button.innerHTML = "Return to home";
	button.href = localEnvironment ? path.local.accounts : path.accounts;

	main.append(title, subtext, button);

	if (mode == "verifyEmail" && oobCode) {
		try {
			await firebase.applyActionCode(oobCode);
			title.innerText = "Email verified";
			subtext.innerText = "Your email has been verified.";
		} catch (e) {
			console.error(e);
			title.innerText = "Failed to verified";
		}
	} else if (mode == "verifyAndChangeEmail" && oobCode) {
		try {
			await firebase.applyActionCode(oobCode);
			await firebase.signOut(false);
			title.innerText = "Changed email";
			subtext.innerText = "Your new email has been verified.";
		} catch (e) {
			console.error(e);
			title.innerText = "Failed to change email";
		}
	} else if (mode == "finalizeDiscord" && token) {
		try {
			const success = await firebase.signInWithCustomToken(token);
			if (!success) throw "Failed to finalize Discord";
			location.href = redirect;
		} catch (e) {
			console.error(e);
			title.innerText = "Failed to change email";
		}
	} else title.innerText = "Invalid parameters";
});