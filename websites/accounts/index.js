import firebase from "/lib/firebase.js";
import { init } from "/lib/main.js";
import { path } from "/lib/path.js";
import request from "/lib/request.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	const credentials = await firebase.getUser();
	if (!credentials.valid) return location.href = `/login/?redirect=${encodeURIComponent(window.location.href)}`;
	const user = credentials.user;
	console.log(user);

	const main = document.querySelector("main");

	const signout = document.createElement("button");
	signout.classList.add("button", "signout");
	signout.innerHTML = "Sign out";
	signout.addEventListener("click", async () => await firebase.signOut());

	if (!user.emailVerified) {
		const banner = document.createElement("div");
		banner.classList.add("banner");

		const text = document.createElement("div");
		text.innerHTML = "Your email address has not yet been verified.<br />To help protect both your account and the platform, and to ensure full access to all available features, please verify your email address by clicking the button below.<br />A verification email will be sent to your registered address.";

		const button = document.createElement("button");
		button.classList.add("button");
		button.innerHTML = "Send verification email";
		button.addEventListener("click", async () => {
			if (!button.disabled) {
				button.disabled = true;
				await request("POST", new URL(`${localEnvironment ? "/wixonic-website-2/europe-west1/httpServer" : ""}/auth/verify/`, window.localEnvironment ? path.local.functions : path.functions), "json", "application/json", null, -1, true);
				button.disabled = false;
			}
		});

		banner.append(text, button);
		main.append(banner);
	}

	const discordArea = document.createElement("div");

	if (await firebase.isLinked("discord")) {
		const discordSubtext = document.createElement("div");
		discordSubtext.classList.add("subtext");
		discordSubtext.innerHTML = `To unlink your Discord account, you may delete your account, or <a href="${new URL("/contact/", window.localEnvironment ? path.local.root : path.root)}">contact us</a> to keep it active.`;

		discordArea.append(discordSubtext);
	} else {
		const discord = document.createElement("button");
		discord.classList.add("button", "discord");
		discord.innerHTML = `Link your account to ${(await request("GET", new URL("/icon/discord.text.svg", window.localEnvironment ? path.local.assets : path.assets), "text", "image/svg+xml")).response}`;
		discord.addEventListener("click", async () => {
			if (!discord.disabled) {
				discord.disabled = true;
				const response = await request("POST", new URL(`${localEnvironment ? "/wixonic-website-2/europe-west1/httpServer" : ""}/link/discord/`, window.localEnvironment ? path.local.functions : path.functions), "json", "application/json", JSON.stringify({
					uid: user.uid
				}), -1, true);
				if (response.status != 401) discord.disabled = false;
			}
		});

		const discordSubtext = document.createElement("div");
		discordSubtext.classList.add("subtext");
		discordSubtext.innerHTML = `Linking your Discord account unlocks exclusive features and rewards. <b>1,000 points</b> will be credited to your account after linking.`;

		discordArea.append(discord, discordSubtext);
	}

	const email = document.createElement("input");
	// Change email

	const emailSubtext = document.createElement("div");
	emailSubtext.classList.add("subtext");
	emailSubtext.innerHTML = "";

	const displayName = document.createElement("input");
	// Change display name

	const displayNameSubtext = document.createElement("div");
	displayNameSubtext.classList.add("subtext");
	displayNameSubtext.innerHTML = "";

	// Delete account
	const deleteAccountSubtext = document.createElement("div");
	deleteAccountSubtext.classList.add("subtext");
	deleteAccountSubtext.innerHTML = "";

	main.append(signout, discordArea, email, emailSubtext, displayName, displayNameSubtext, deleteAccountSubtext);
});