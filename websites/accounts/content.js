import error from "/lib/error.js";
import firebase from "/lib/firebase.js";

const init = async () => {
	const usernameField = document.querySelector("#username");
	const emailField = document.querySelector("#email");
	const updateField = document.querySelector("#update");

	if (firebase.auth.user) {
		const publicDoc = firebase.firestore.doc(`/users/${firebase.auth.user.uid}`);
		const privateDoc = firebase.firestore.doc(`/private-users/${firebase.auth.user.uid}`);

		const publicUser = await firebase.firestore.getDoc(publicDoc);
		const privateUser = await firebase.firestore.getDoc(privateDoc);

		const changes = {
			publicUser: {},
			privateUser: {}
		};

		const updateStatus = () => updateField.classList.toggle("disabled", !((Object.values(changes.publicUser).length > 0 || Object.values(changes.privateUser).length > 0 || changes.email) && usernameField.checkValidity() && emailField.checkValidity()));

		if (publicUser) {
			usernameField.value = publicUser.username;

			usernameField.addEventListener("input", () => {
				if (publicUser.username != usernameField.value) changes.publicUser.username = usernameField.value;
				else delete changes.publicUser.username;
				updateStatus();
			});
		} else {
			usernameField.remove();
		}

		if (privateUser) {
			emailField.value = privateUser.email;

			emailField.addEventListener("input", () => {
				if (privateUser.email != emailField.value) changes.email = emailField.value;
				else delete changes.email;
				updateStatus();
			});
		} else {
			emailField.remove();
		}

		updateField.addEventListener("click", async () => {
			if (!updateField.classList.contains("disabled")) {
				updateField.classList.add("disabled");

				try {
					if (Object.values(changes.publicUser).length > 0) await firebase.firestore.updateDoc(publicDoc, changes.publicUser);
					if (Object.values(changes.privateUser).length > 0) await firebase.firestore.updateDoc(privateDoc, changes.privateUser);

					if (changes.email) await firebase.auth.changeEmail(changes.email);

					location.reload();
				} catch (e) {
					error(e);
					if (!localEnvironment) location.reload();
				}
			}
		});

		firebase.auth.object.onAuthStateChanged((user) => {
			if (!user) location.href = `/auth/?redirect=${encodeURIComponent(location.pathname)}`;
		});
	} else location.href = `/auth/?redirect=${encodeURIComponent(location.pathname)}`;
};

export default {
	init
};