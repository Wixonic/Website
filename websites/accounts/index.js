import { request } from "/script/request.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	const credentials = await firebase.getUser();
	if (!credentials.valid) return location.href = `/login/?redirect=${encodeURIComponent(location.href)}`;
	const user = credentials.user;

	const main = document.querySelector("main");

	const signout = document.querySelector(".signout");
	signout.addEventListener("click", async (e) => {
		e.preventDefault();
		await firebase.signOut();
	});

	if (!user.emailVerified) {
		const banner = document.createElement("div");
		banner.classList.add("banner", "fade", "slide");

		const text = document.createElement("div");
		text.innerHTML = "Your email address has not yet been verified.<br />To help protect both your account and the platform, and to ensure full access to all available features, please verify your email address by clicking the button below.<br />A verification email will be sent to your registered address.";

		const button = document.createElement("button");
		button.classList.add("button", "fade", "slide");
		button.innerHTML = "Send verification email";
		button.addEventListener("click", async () => {
			if (!button.disabled) {
				button.disabled = true;
				await request("POST", new URL("/auth/verify/", localEnvironment ? path.local.functions : path.functions), "json", "application/json", null, -1, true);
				button.disabled = false;
			}
		});

		banner.append(text, button);
		main.append(banner);
	}

	const discordArea = document.createElement("div");

	const discordLink = await firebase.isLinked("discord");
	if (discordLink) {
		// Make Discord link private

		const discordSubtext = document.createElement("div");
		discordSubtext.classList.add("subtext");
		discordSubtext.innerHTML = `To unlink your Discord account, you may delete your account, or <a href="${new URL("/contact/", localEnvironment ? path.local.root : path.root)}">contact us</a> to keep it active.`;

		discordArea.append(discordSubtext);
	} else {
		const discord = document.createElement("button");
		discord.classList.add("button", "discord");
		discord.innerHTML = `Link your account to ${(await request("GET", new URL("/icon/discord.text.svg", localEnvironment ? path.local.assets : path.assets), "text", null, null, 3600)).response}`;
		discord.addEventListener("click", async () => {
			if (!discord.disabled) {
				discord.disabled = true;
				location.href = new URL(`/discord/link/?uid=${user.uid}&redirect=${encodeURIComponent(location.href)}`, localEnvironment ? path.local.server : path.server);
			}
		});

		const discordSubtext = document.createElement("div");
		discordSubtext.classList.add("subtext");
		discordSubtext.innerHTML = `Linking your Discord account unlocks exclusive features and rewards.<br /><b>5,000 points</b> will be credited to your account after linking.`;

		discordArea.append(discord, discordSubtext);
	}

	const section = document.createElement("section");
	section.classList.add("fade", "slide");

	const maskEmail = (email) => {
		const [user, domain] = email.split("@");
		if (user.length <= 2) return email;
		return `${user[0]}${"•".repeat(user.length - 2)}${user.at(-1)}@${domain}`;
	};

	let oldEmail = user.email;
	const email = document.createElement("div");
	email.classList.add("input");

	const emailLabel = document.createElement("label");
	emailLabel.innerText = "Email";

	const emailWrapper = document.createElement("div");
	emailWrapper.classList.add("wrapper");

	const emailInput = document.createElement("input");
	emailInput.type = "email";
	emailInput.minLength = 6;
	emailInput.pattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
	emailInput.placeholder = maskEmail(oldEmail);

	const updateEmail = async () => {
		if (!emailInput.disabled && emailInput.validity.valid && emailInput.value.length > 0 && emailInput.value != oldEmail) {
			emailInput.disabled = true;
			email.classList.add("loading");
			try {
				const newEmail = emailInput.value;
				const response = await request("POST", new URL(`/auth/verify/?email=${encodeURIComponent(newEmail)}`, localEnvironment ? path.local.functions : path.functions), "json", "application/json", null, -1, true);
				if (response.status != 204) throw "Failed: " + response.status;
				oldEmail = newEmail;
				emailInput.placeholder = maskEmail(newEmail);
			} catch (e) {
				console.error(e);
			}

			emailInput.value = "";
			emailInput.disabled = false;
			email.classList.remove("loading");
		}
	};

	emailInput.addEventListener("blur", () => updateEmail());
	emailInput.addEventListener("keydown", (event) => {
		if (event.key == "Enter") emailInput.blur();
	});

	emailWrapper.append(emailInput);

	email.append(emailWrapper, emailLabel);

	const emailSubtext = document.createElement("div");
	emailSubtext.classList.add("subtext");
	emailSubtext.innerHTML = "Change your email address by simply typing the new one. Verification is required before changes take effect.";

	let oldDisplayName = user.displayName;
	const displayName = document.createElement("div");
	displayName.classList.add("input");

	const displayNameLabel = document.createElement("label");
	displayNameLabel.innerText = "Name";

	const displayNameWrapper = document.createElement("div");
	displayNameWrapper.classList.add("wrapper");

	const displayNameInput = document.createElement("input");
	displayNameInput.minLength = 4;
	displayNameInput.maxLength = 20;
	displayNameInput.title = "4 to 20 characters. Letters, numbers, spaces, underscores, and hyphens only.";
	displayNameInput.pattern = "^[\\p{L}\\p{N}_\\- ]{4,20}$";
	displayNameInput.placeholder = oldDisplayName;

	const updateDisplayName = async () => {
		if (!displayNameInput.disabled && displayNameInput.validity.valid && displayNameInput.value.length > 0 && displayNameInput.value != oldDisplayName) {
			displayNameInput.disabled = true;
			displayName.classList.add("loading");

			try {
				const newDisplayName = displayNameInput.value;
				await firebase.updateProfile({
					displayName: newDisplayName
				});

				oldDisplayName = newDisplayName;
				displayNameInput.placeholder = newDisplayName;
			} catch (e) {
				console.error(e);
			}

			displayNameInput.value = "";
			displayNameInput.disabled = false;
			displayName.classList.remove("loading");
		}
	};

	displayNameInput.addEventListener("blur", () => updateDisplayName());
	displayNameInput.addEventListener("keydown", (event) => {
		if (event.key == "Enter") displayNameInput.blur();
	});

	displayNameWrapper.append(displayNameInput);

	displayName.append(displayNameWrapper, displayNameLabel);

	const displayNameSubtext = document.createElement("div");
	displayNameSubtext.classList.add("subtext");
	displayNameSubtext.innerHTML = "Change your display name by simply typing a new one.";

	const deleteAccountButton = document.createElement("button");
	deleteAccountButton.classList.add("button", "delete");
	deleteAccountButton.innerHTML = "Delete account";
	deleteAccountButton.addEventListener("click", async () => {
		if (!deleteAccountButton.disabled) {
			deleteAccountButton.disabled = true;
			deleteAccountButton.classList.add("loading");
			try {
				const response = await request("DELETE", new URL("/auth/delete/", localEnvironment ? path.local.functions : path.functions), "json", "application/json", null, -1, true);
				if (response.status != 204) throw "Failed: " + response.status;
				await firebase.signOut();
			} catch (e) {
				console.error(e);
				deleteAccountButton.disabled = false;
				deleteAccountButton.classList.remove("loading");
			}
		}
	});

	const deleteAccountSubtext = document.createElement("div");
	deleteAccountSubtext.classList.add("subtext");
	deleteAccountSubtext.innerHTML = `Deleting your account is permanent and cannot be undone. All data will be deleted from our servers. To remove data stored on Discord or other providers, follow the instructions <a href="${new URL("/privacy/#rights", localEnvironment ? path.local.root : path.root)}" target="_blank" class="link">here</a>, and to see what data we have about you, click <a href="${new URL("/privacy/", localEnvironment ? path.local.root : path.root)}" target="_blank" class="link">here</a>.`;

	section.append(
		discordArea, document.createElement("space"),
		email, emailSubtext, document.createElement("space"),
		displayName, displayNameSubtext, document.createElement("space"),
		deleteAccountButton, deleteAccountSubtext
	);
	main.append(section);
});