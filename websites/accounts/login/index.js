import { request } from "/script/request.js";

addEventListener("DOMContentLoaded", async () => {
	const redirectData = new URLSearchParams(location.search).get("redirect");
	const redirect = redirectData ? decodeURIComponent(redirectData) : "/";

	// Sign in form
	const signinForm = document.querySelector("#sign-in");
	const signinEmail = signinForm.querySelector("#sign-in_email");
	const signinPassword = signinForm.querySelector("#sign-in_password");
	const signinSubmit = signinForm.querySelector("#sign-in_submit");
	const signinSwitch = signinForm.querySelector("#sign-in_switch");

	const signinIsValid = () => signinEmail.validity.valid && signinPassword.validity.valid && signinEmail.value && signinPassword.value;

	const signinResetStatus = () => {
		signinForm.classList.remove("invalid");
		signinSubmit.classList.toggle("invalid", !signinIsValid());
	};

	signinEmail.addEventListener("input", signinResetStatus);
	signinPassword.addEventListener("input", signinResetStatus);
	signinResetStatus();

	// Sign up form
	const signupForm = document.querySelector("#sign-up");
	const signupEmail = signupForm.querySelector("#sign-up_email");
	const signupPassword = signupForm.querySelector("#sign-up_password");
	const signupConfirm = signupForm.querySelector("#sign-up_confirm");
	const signupSubmit = signupForm.querySelector("#sign-up_submit");
	const signupSwitch = signupForm.querySelector("#sign-up_switch");

	const signupIsValid = () =>
		signupEmail.validity.valid &&
		signupPassword.validity.valid &&
		signupConfirm.validity.valid &&
		signupEmail.value &&
		signupPassword.value &&
		signupConfirm.value &&
		signupPassword.value === signupConfirm.value;

	const signupResetStatus = () => {
		signupForm.classList.remove("invalid");
		signupSubmit.classList.toggle("invalid", !signupIsValid());
	};

	signupEmail.addEventListener("input", signupResetStatus);
	signupPassword.addEventListener("input", signupResetStatus);
	signupConfirm.addEventListener("input", signupResetStatus);
	signupResetStatus();

	// Form toggle
	const toggleForm = (event) => {
		event.preventDefault();
		signinForm.classList.toggle("hidden");
		signupForm.classList.toggle("hidden");
	};

	// Sign in form actions
	signinSubmit.addEventListener("click", async (event) => {
		event.preventDefault();

		for (const child of signinForm.children) {
			if (typeof child.blur === "function") child.blur();
		}

		if (signinIsValid() && !signinSubmit.disabled) {
			signinSubmit.disabled = true;
			signinSwitch.disabled = true;
			signinForm.classList.add("loading");

			try {
				const success = await firebase.signInWithEmail(signinEmail.value, signinPassword.value);

				if (success) location.href = redirect;
				else throw "Failed to authenticate";
			} catch (error) {
				const message = error.error ?? error;

				signinForm.classList.add("invalid");
				signinEmail.classList.add("invalid");
				signinPassword.classList.add("invalid");
				signinPassword.value = "";

				signinSubmit.disabled = false;
				signinSwitch.disabled = false;
				signinForm.classList.remove("loading");
			}
		}
	});

	signinSwitch.addEventListener("click", (event) => {
		if (!signinSwitch.disabled) toggleForm(event);
	});

	// Sign up form actions
	signupSubmit.addEventListener("click", async (event) => {
		event.preventDefault();

		for (const child of signupForm.children) {
			if (typeof child.blur === "function") child.blur();
		}

		if (signupIsValid() && !signupSubmit.disabled) {
			signupSubmit.disabled = true;
			signupSwitch.disabled = true;
			signupForm.classList.add("loading");

			try {
				const req = await request("POST", new URL("/auth/join/", path.functions), "json", "application/json", JSON.stringify({
					email: signupEmail.value,
					password: signupPassword.value,
					confirm: signupConfirm.value,
				}), -1, true);

				if (req.status !== 204) throw req.response;

				const user = await firebase.getUser(true);
				if (user.valid) location.href = redirect;
				else throw "Invalid user";
			} catch (error) {
				const message = error.error ?? error;

				signupForm.classList.add("invalid");
				signupEmail.classList.add("invalid");
				signupEmail.value = "";
				signupPassword.classList.add("invalid");
				signupPassword.value = "";
				signupConfirm.classList.add("invalid");
				signupConfirm.value = "";

				signupSubmit.disabled = false;
				signupSwitch.disabled = false;
				signupForm.classList.remove("loading");
			}
		}
	});

	signupSwitch.addEventListener("click", (event) => {
		if (!signupSwitch.disabled) toggleForm(event);
	});
});