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

	const main = document.querySelector("main");

	await (async () => {
		const form = document.createElement("form");
		form.classList.add("fade", "slide", "visible");
		form.id = "signin";

		const title = document.createElement("h1");
		title.innerHTML = "Sign In";

		const email = document.createElement("input");
		email.type = "email";
		email.required = true;

		const password = document.createElement("input");
		password.type = "password";
		password.required = true;

		const submit = document.createElement("button");
		submit.classList.add("button");
		submit.innerHTML = "Submit";
		submit.addEventListener("click", async (event) => {
			event.preventDefault();

			try {
				const req = await request("POST", new URL(`${localEnvironment ? "/wixonic-website-2/europe-west1/httpServer" : ""}/auth/token/`, window.localEnvironment ? path.local.functions : path.functions), "json", "application/json", JSON.stringify({
					email: email.value,
					password: password.value
				}), -1, true);

				if (req.status != 200) throw req.response;

				const user = await firebase.getUser(true);
				if (user.valid) location.href = redirect;
				else throw "Invalid user";
			} catch (e) {
				console.error("Failed to auth:", e);
			}
		});

		const changeMode = document.createElement("button");
		changeMode.classList.add("link", "changeMode");
		changeMode.innerHTML = "Don't have an account?";
		changeMode.addEventListener("click", toggleForm);

		form.append(title, email, password, submit, changeMode);

		main.append(form);
	})();

	await (async () => {
		const form = document.createElement("form");
		form.classList.add("fade", "slide");
		form.id = "signup";

		const title = document.createElement("h1");
		title.innerHTML = "Sign Up";

		const changeMode = document.createElement("button");
		changeMode.classList.add("link", "changeMode");
		changeMode.innerHTML = "Already have an account?";
		changeMode.addEventListener("click", toggleForm);

		form.append(title, changeMode);

		main.append(form);
	})();
});