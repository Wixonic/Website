import firebase from "/lib/firebase.js";
import { init } from "/lib/main.js";
import { path } from "/lib/path.js";
import request from "/lib/request.js";

addEventListener("DOMContentLoaded", async () => {
	await init();

	const redirectData = new URLSearchParams(location.search).get("redirect");
	const redirect = redirectData ? decodeURIComponent(redirectData) : (localEnvironment ? path.local.accounts : path.accounts);

	const toggleForm = (event) => {
		event.preventDefault();
		document.querySelector("#signin").classList.toggle("visible");
		document.querySelector("#signup").classList.toggle("visible");
	};

	const main = document.querySelector("main");

	await (async () => {
		const form = document.createElement("form");
		form.classList.add("fade", "slide", "visible");
		form.id = "signin";

		const title = document.createElement("h1");
		title.classList.add("slide");
		title.innerHTML = "Sign in";

		const discordButton = document.createElement("button");
		discordButton.classList.add("button", "discord");
		discordButton.innerHTML = `Continue with ${(await request("GET", new URL("/icon/discord.text.svg", localEnvironment ? path.local.assets : path.assets), "text", "image/svg+xml", null, 3600)).response}`;
		discordButton.type = "button";

		discordButton.addEventListener("click", (event) => {
			event.preventDefault();

			for (const child of form.children) {
				if (typeof child.blur == "function") child.blur();
			}

			submit.disabled = true;
			switchMode.disabled = true;
			form.classList.add("loading");

			const discordLinkURL = new URL("/discord/link/join/", localEnvironment ? path.local.server : path.server);
			discordLinkURL.searchParams.set("redirect", redirect);
			location.href = discordLinkURL.toString();
		});

		const separator = document.createElement("separator");

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
		emailInput.addEventListener("input", () => resetStatus());

		emailWrapper.append(emailInput);
		email.append(emailWrapper, emailLabel);

		const password = document.createElement("div");
		password.classList.add("input");

		const passwordLabel = document.createElement("label");
		passwordLabel.innerText = "Password";

		const passwordWrapper = document.createElement("div");
		passwordWrapper.classList.add("wrapper");

		const passwordInput = document.createElement("input");
		passwordInput.type = "password";
		passwordInput.minLength = 8;
		passwordInput.maxLength = 32;
		passwordInput.pattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d]).{8,32}$";
		passwordInput.addEventListener("input", () => resetStatus());

		passwordWrapper.append(passwordInput);
		password.append(passwordWrapper, passwordLabel);

		const isValid = () => !(!(emailInput.validity.valid && passwordInput.validity.valid) || (emailInput.value.length == 0 || passwordInput.value.length == 0));

		const resetStatus = () => {
			for (const child of form.children) {
				void child.offsetWidth;
				child.classList.remove("invalid");
			}

			submit.classList.toggle("invalid", !isValid());
		};

		const submit = document.createElement("button");
		submit.classList.add("button", "invalid", "slide");
		submit.innerHTML = "Submit";
		submit.type = "submit";
		submit.addEventListener("click", async (event) => {
			event.preventDefault();

			for (const child of form.children) {
				if (typeof child.blur == "function") child.blur();
			}

			if (isValid() && !submit.disabled) {
				discordButton.disabled = true;
				submit.disabled = true;
				switchMode.disabled = true;
				form.classList.add("loading");

				try {
					const success = await firebase.signInWithEmail(emailInput.value, passwordInput.value);

					if (success) location.href = redirect;
					else throw "Failed to authenticate";
				} catch (e) {
					const message = e.error ?? e;

					switch (message) {
						case "Missing email or password":
							if (emailInput.value.length > 0) email.classList.add("invalid");
							if (passwordInput.value.length > 0) password.classList.add("invalid");
							break;

						default:
							email.classList.add("invalid");
							password.classList.add("invalid");
							passwordInput.value = "";
							break;
					}

					discordButton.disabled = false;
					submit.disabled = false;
					switchMode.disabled = false;
					form.classList.remove("loading");
				}
			}
		});

		const switchMode = document.createElement("button");
		switchMode.classList.add("link", "switchMode", "slide");
		switchMode.innerHTML = "Don't have an account?";
		switchMode.addEventListener("click", (event) => {
			if (!switchMode.disabled) toggleForm(event);
		});

		form.append(title, discordButton, separator, email, password, submit, switchMode);

		main.append(form);

		resetStatus();
	})();

	await (async () => {
		const form = document.createElement("form");
		form.classList.add("fade", "slide");
		form.id = "signup";

		const title = document.createElement("h1");
		title.classList.add("slide");
		title.innerHTML = "Sign up";

		const discordButton = document.createElement("button");
		discordButton.classList.add("button", "discord");
		discordButton.innerHTML = `Continue with ${(await request("GET", new URL("/icon/discord.text.svg", localEnvironment ? path.local.assets : path.assets), "text", "image/svg+xml", null, 3600)).response}`;
		discordButton.type = "button";

		discordButton.addEventListener("click", (event) => {
			event.preventDefault();

			for (const child of form.children) {
				if (typeof child.blur == "function") child.blur();
			}

			submit.disabled = true;
			switchMode.disabled = true;
			form.classList.add("loading");

			const discordLinkURL = new URL("/discord/link/join/", localEnvironment ? path.local.server : path.server);
			discordLinkURL.searchParams.set("redirect", redirect);
			location.href = discordLinkURL.toString();
		});

		const separator = document.createElement("separator");

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
		emailInput.addEventListener("input", () => resetStatus(email));

		emailWrapper.append(emailInput);
		email.append(emailWrapper, emailLabel);

		const password = document.createElement("div");
		password.classList.add("input");

		const passwordLabel = document.createElement("label");
		passwordLabel.innerText = "Password";

		const passwordWrapper = document.createElement("div");
		passwordWrapper.classList.add("wrapper");

		const passwordInput = document.createElement("input");
		passwordInput.type = "password";
		passwordInput.minLength = 8;
		passwordInput.maxLength = 32;
		passwordInput.title = "8 to 32 characters, including at least one lowercase letter, one uppercase letter, one number, and one special character.";
		passwordInput.pattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d]).{8,32}$";
		passwordInput.addEventListener("input", () => resetStatus(password));

		passwordWrapper.append(passwordInput);
		password.append(passwordWrapper, passwordLabel);

		const confirmPassword = document.createElement("div");
		confirmPassword.classList.add("input");

		const confirmPasswordLabel = document.createElement("label");
		confirmPasswordLabel.innerText = "Confirm Password";

		const confirmPasswordWrapper = document.createElement("div");
		confirmPasswordWrapper.classList.add("wrapper");

		const confirmPasswordInput = document.createElement("input");
		confirmPasswordInput.type = "password";
		confirmPasswordInput.minLength = 8;
		confirmPasswordInput.maxLength = 32;
		confirmPasswordInput.title = "Must match the password exactly.";
		confirmPasswordInput.pattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d]).{8,32}$";
		confirmPasswordInput.addEventListener("input", () => resetStatus(password));

		confirmPasswordWrapper.append(confirmPasswordInput);
		confirmPassword.append(confirmPasswordWrapper, confirmPasswordLabel);

		const isValid = () => !(!(emailInput.validity.valid && passwordInput.validity.valid) || (emailInput.value.length == 0 || passwordInput.value.length == 0) || (passwordInput.value != confirmPasswordInput.value));

		const resetStatus = () => {
			for (const child of form.children) {
				void child.offsetWidth;
				child.classList.remove("invalid");
			}

			submit.classList.toggle("invalid", !isValid());
		};

		const submit = document.createElement("button");
		submit.classList.add("button", "invalid", "slide");
		submit.innerHTML = "Submit";
		submit.type = "submit";
		submit.addEventListener("click", async (event) => {
			event.preventDefault();

			for (const child of form.children) {
				if (typeof child.blur == "function") child.blur();
			}

			if (isValid() && !submit.disabled) {
				discordButton.disabled = true;
				submit.disabled = true;
				switchMode.disabled = true;
				form.classList.add("loading");

				try {
					const req = await request("POST", new URL(`${localEnvironment ? "/wixonic-website-2/europe-west1/httpServer" : ""}/auth/join/`, localEnvironment ? path.local.functions : path.functions), "json", "application/json", JSON.stringify({
						email: emailInput.value,
						password: passwordInput.value,
						confirm: confirmPasswordInput.value
					}), -1, true);

					if (req.status != 204) throw req.response;

					const user = await firebase.getUser(true);
					if (user.valid) location.href = redirect;
					else throw "Invalid user";
				} catch (e) {
					const message = e.error ?? e;

					switch (message) {
						case "Missing email, password or password confirmation":
							if (emailInput.value.length > 0) email.classList.add("invalid");
							if (passwordInput.value.length > 0) password.classList.add("invalid");
							if (confirmPasswordInput.value.length > 0) confirmPassword.classList.add("invalid");
							break;

						case "Password and confirmation do not match":
							password.classList.add("invalid");
							passwordInput.value = "";
							confirmPassword.classList.add("invalid");
							confirmPasswordInput.value = "";
							break;

						default:
							console.error(`Failed to join: ${message}`);

							email.classList.add("invalid");
							emailInput.value = "";
							password.classList.add("invalid");
							passwordInput.value = "";
							confirmPassword.classList.add("invalid");
							confirmPasswordInput.value = "";
							break;
					}

					discordButton.disabled = false;
					submit.disabled = false;
					switchMode.disabled = false;
					form.classList.remove("loading");
				}
			}
		});

		const switchMode = document.createElement("button");
		switchMode.classList.add("link", "switchMode", "slide");
		switchMode.innerHTML = "Already have an account?";
		switchMode.type = "button";
		switchMode.addEventListener("click", (event) => {
			if (!switchMode.disabled) toggleForm(event);
		});

		form.append(title, discordButton, separator, email, password, confirmPassword, submit, switchMode);

		main.append(form);
	})();
});