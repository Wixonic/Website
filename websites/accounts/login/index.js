import firebase from "/lib/firebase.js";
import { init } from "/lib/main.js";
import { path } from "/lib/path.js";
import request from "/lib/request.js";

addEventListener("DOMContentLoaded", async (e) => {
	await init();

	const redirectData = new URLSearchParams(window.location.search).get("redirect");
	const redirect = redirectData ? decodeURIComponent(redirectData) : (window.localEnvironment ? path.local.accounts : path.accounts);

	const toggleForm = (event) => {
		event.preventDefault();
		document.querySelector("#signin").classList.toggle("visible");
		document.querySelector("#signup").classList.toggle("visible");
	};

	const main = document.querySelector("main"); $;

	let processing = false;

	await (async () => {
		const form = document.createElement("form");
		form.classList.add("fade", "slide", "visible");
		form.id = "signin";

		const title = document.createElement("h1");
		title.innerHTML = "Sign in";

		const email = document.createElement("div");
		email.classList.add("input");

		const emailLabel = document.createElement("label");
		emailLabel.innerText = "Email";

		const emailInput = document.createElement("input");
		emailInput.type = "email";
		emailInput.minLength = 6;
		emailInput.placeholder = " ";
		emailInput.addEventListener("input", () => resetStatus(email));

		email.append(emailInput, emailLabel);

		const password = document.createElement("div");
		password.classList.add("input");

		const passwordLabel = document.createElement("label");
		passwordLabel.innerText = "Password";

		const passwordInput = document.createElement("input");
		passwordInput.type = "password";
		passwordInput.minLength = 8;
		passwordInput.maxLength = 32;
		passwordInput.pattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{,32}$";
		passwordInput.placeholder = " ";
		passwordInput.addEventListener("input", () => resetStatus(password));

		password.append(passwordInput, passwordLabel);

		const isValid = () => !(!(emailInput.validity.valid && passwordInput.validity.valid) || (emailInput.value.length == 0 || passwordInput.value.length == 0));

		const resetStatus = () => {
			for (const child of form.children) {
				void child.offsetWidth;
				child.classList.remove("invalid");
			}

			submit.classList.toggle("invalid", !isValid());
		};

		const submit = document.createElement("button");
		submit.classList.add("button", "invalid");
		submit.innerHTML = "Submit";
		submit.addEventListener("click", async (event) => {
			event.preventDefault();

			if (isValid() && !processing) {
				processing = true;
				submit.classList.add("invalid");

				try {
					const req = await request("POST", new URL(`${localEnvironment ? "/wixonic-website-2/europe-west1/httpServer" : ""}/auth/token/`, window.localEnvironment ? path.local.functions : path.functions), "json", "application/json", JSON.stringify({
						email: emailInput.value,
						password: passwordInput.value
					}), -1, true);

					if (req.status != 200) throw req.response;

					const user = await firebase.getUser(true);
					if (user.valid) location.href = redirect;
					else throw "Invalid user";
				} catch (e) {
					const message = e.error ?? e;

					switch (message) {
						case "Missing email or password":
							if (emailInput.value.length > 0) email.classList.add("invalid");
							if (passwordInput.value.length > 0) password.classList.add("invalid");
							break;

						case "Failed to authenticate":
							email.classList.add("invalid");
							password.classList.add("invalid");
							passwordInput.value = "";
							break;

						default:
							console.error(`Failed to auth: ${message}`);
							break;
					}

					processing = false;
					submit.classList.toggle("invalid", !isValid());
				}
			}
		});

		const switchMode = document.createElement("button");
		switchMode.classList.add("link", "switchMode");
		switchMode.innerHTML = "Don't have an account?";
		switchMode.addEventListener("click", toggleForm);

		form.append(title, email, password, submit, switchMode);

		main.append(form);

		resetStatus();
	})();

	await (async () => {
		const form = document.createElement("form");
		form.classList.add("fade", "slide");
		form.id = "signup";

		const title = document.createElement("h1");
		title.innerHTML = "Sign up";

		const email = document.createElement("div");
		email.classList.add("input");

		const emailLabel = document.createElement("label");
		emailLabel.innerText = "Email";

		const emailInput = document.createElement("input");
		emailInput.type = "email";
		emailInput.minLength = 6;
		emailInput.placeholder = " ";
		emailInput.addEventListener("input", () => resetStatus(email));

		email.append(emailInput, emailLabel);

		const password = document.createElement("div");
		password.classList.add("input");

		const passwordLabel = document.createElement("label");
		passwordLabel.innerText = "Password";

		const passwordInput = document.createElement("input");
		passwordInput.type = "password";
		passwordInput.minLength = 8;
		passwordInput.maxLength = 32;
		passwordInput.pattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{,32}$";
		passwordInput.placeholder = " ";
		passwordInput.addEventListener("input", () => resetStatus(password));

		password.append(passwordInput, passwordLabel);

		const confirmPassword = document.createElement("div");
		confirmPassword.classList.add("input");

		const confirmPasswordLabel = document.createElement("label");
		confirmPasswordLabel.innerText = "Confirm Password";

		const confirmPasswordInput = document.createElement("input");
		confirmPasswordInput.type = "password";
		confirmPasswordInput.minLength = 8;
		confirmPasswordInput.maxLength = 32;
		confirmPasswordInput.pattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{,32}$";
		confirmPasswordInput.placeholder = " ";
		confirmPasswordInput.addEventListener("input", () => resetStatus(password));

		confirmPassword.append(confirmPasswordInput, confirmPasswordLabel);

		const isValid = () => !(!(emailInput.validity.valid && passwordInput.validity.valid) || (emailInput.value.length == 0 || passwordInput.value.length == 0) || (passwordInput.value != confirmPasswordInput.value));

		const resetStatus = () => {
			for (const child of form.children) {
				void child.offsetWidth;
				child.classList.remove("invalid");
			}

			submit.classList.toggle("invalid", !isValid());
		};

		const submit = document.createElement("button");
		submit.classList.add("button", "invalid");
		submit.innerHTML = "Submit";
		submit.addEventListener("click", async (event) => {
			event.preventDefault();

			if (isValid() && !processing) {
				processing = true;
				submit.classList.add("invalid");

				try {
					const req = await request("POST", new URL(`${localEnvironment ? "/wixonic-website-2/europe-west1/httpServer" : ""}/auth/join/`, window.localEnvironment ? path.local.functions : path.functions), "json", "application/json", JSON.stringify({
						email: emailInput.value,
						password: passwordInput.value,
						confirm: confirmPasswordInput.value
					}), -1, true);

					if (req.status != 200) throw req.response;

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

					processing = false;
					submit.classList.toggle("invalid", !isValid());
				}
			}
		});

		const switchMode = document.createElement("button");
		switchMode.classList.add("link", "switchMode");
		switchMode.innerHTML = "Already have an account?";
		switchMode.addEventListener("click", toggleForm);

		form.append(title, email, password, confirmPassword, submit, switchMode);

		main.append(form);
	})();
});