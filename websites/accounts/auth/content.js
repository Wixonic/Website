import error from "/lib/error.js";
import firebase from "/lib/firebase.js";
import pages from "/lib/pages.js";

let creatingAccount = false;

const redirect = () => {
	const searchParams = new URLSearchParams(location.search);
	const redirectUrl = searchParams.get("redirect");

	if (redirectUrl) location.href = decodeURIComponent(redirectUrl);
	else location.href = "/";
};

const init = async () => {
	if (firebase.user) redirect();

	document.querySelector("#signUpView").addEventListener("click", () => pages.display("signUp"));
	document.querySelector("#signInView").addEventListener("click", () => pages.display("signIn"));

	const signInSubmitButton = document.querySelector("#signInSubmit");
	signInSubmitButton.addEventListener("click", () => {
		if (!signInSubmitButton.classList.contains("disabled")) {
			signInSubmitButton.classList.add("disabled");

			const emailField = document.querySelector("#signInEmail");
			const passwordField = document.querySelector("#signInPassword");

			const invalid = (...fields) => {
				passwordField.value = "";

				for (const field of fields) {
					field.classList.add("invalid");
					field.addEventListener("input", () => field.classList.remove("invalid"), { once: true });
				}
			};

			firebase.auth.signInWithEmail(emailField.value, passwordField.value)
				.then(redirect)
				.catch((e) => {
					switch (e) {
						case "auth/invalid-credential":
							invalid(emailField, passwordField);
							break;

						case "auth/invalid-email":
							invalid(emailField);
							break;

						case "auth/missing-password":
							invalid(passwordField);
							break;

						case "auth/wrong-password":
							invalid(passwordField);
							break;

						case "auth/user-disabled":
							invalid(emailField, passwordField);
							break;

						default:
							error({
								title: "Failed to sign-in",
								details: {
									message: e
								}
							});
							break;
					}
				}).finally(() => signInSubmitButton.classList.remove("disabled"));
		}
	});

	const signUpSubmitButton = document.querySelector("#signUpSubmit");
	signUpSubmitButton.addEventListener("click", () => {
		if (!signUpSubmitButton.classList.contains("disabled")) {
			signUpSubmitButton.classList.add("disabled");
			creatingAccount = true;

			const emailField = document.querySelector("#signUpEmail");
			const passwordField = document.querySelector("#signUpPassword");
			const confirmField = document.querySelector("#signUpConfirmPassword");

			const invalid = (...fields) => {
				passwordField.value = "";
				confirmField.value = "";

				for (const field of fields) {
					field.classList.add("invalid");
					field.addEventListener("input", () => field.classList.remove("invalid"), { once: true });
				}
			};

			firebase.auth.createUserWithEmail(emailField.value, passwordField.value, confirmField.value)
				.catch((e) => {
					switch (e.code) {
						case "auth/invalid-email":
							invalid(emailField);
							break;

						case "auth/missing-password":
							invalid(passwordField);
							break;

						case "auth/weak-password":
							invalid(passwordField, confirmField);
							break;

						case "auth/passwords-dont-match":
							invalid(passwordField, confirmField);
							break;

						case "auth/email-already-in-use":
							invalid(emailField);
							break;

						default:
							error({
								title: "Failed to sign-up",
								details: {
									message: e.code ?? e
								}
							});
							break;
					}
				}).finally(redirect);
		}
	});

	firebase.auth.object.onAuthStateChanged((user) => {
		if (user && !creatingAccount) redirect();
	});
};

export default {
	init
};