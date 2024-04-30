import error from "/lib/error.js";
import firebase from "/lib/firebase.js";
import pages from "/lib/pages.js";

const init = async () => {
	if (firebase.user) location.href = "/";

	document.querySelector("#signUpView").addEventListener("click", () => pages.display("signUp"));
	document.querySelector("#signInView").addEventListener("click", () => pages.display("signIn"));

	const signInSubmitButton = document.querySelector("#signInSubmit");
	signInSubmitButton.addEventListener("click", async () => {
		if (!signInSubmitButton.classList.contains("disabled")) {
			signInSubmitButton.classList.add("disabled");

			const emailField = document.querySelector("#signInEmail");
			const passwordField = document.querySelector("#signInPassword");

			try {
				await firebase.auth.signInWithEmail(emailField.value, passwordField.value);
			} catch (e) {
				const invalid = () => {
					passwordField.value = "";

					emailField.classList.add("invalid");
					passwordField.classList.add("invalid");

					emailField.addEventListener("change", () => emailField.classList.remove("invalid"), { once: true });
					passwordField.addEventListener("change", () => passwordField.classList.remove("invalid"), { once: true });
				};

				switch (e?.code) {
					case "auth/invalid-email":
						invalid();
						break;

					case "auth/missing-password":
						invalid();
						break;

					case "auth/user-not-found":
						invalid();
						break;

					case "auth/invalid-credential":
						invalid();
						break;

					default:
						error(e);
						break;
				}
			}

			signInSubmitButton.classList.remove("disabled");
		}
	});

	const signUpSubmitButton = document.querySelector("#signUpSubmit");
	signUpSubmitButton.addEventListener("click", async () => {
		if (!signUpSubmitButton.classList.contains("disabled")) {
			signUpSubmitButton.classList.add("disabled");



			signUpSubmitButton.classList.remove("disabled");
		}
	});

	firebase.auth.object.onAuthStateChanged((user) => {
		if (user) {
			const searchParams = new URLSearchParams(location.search);
			const redirectUrl = searchParams.get("redirect");

			if (redirectUrl) location.href = decodeURIComponent(redirectUrl);
			else location.reload();
		}
	});
};

export default {
	init
};