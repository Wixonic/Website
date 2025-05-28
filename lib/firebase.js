import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-functions.js";
import { getStorage, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-storage.js";

import { path, emulator } from "/lib/path.js";
import request from "/lib/request.js";

window.localEnvironment = location.hostname == "localhost";

if (localEnvironment) console.warn("Running in local environment");

const firebase = {
	app: initializeApp({
		apiKey: "AIzaSyAoAl-09tw3K0i8N2PnYKAjjZb19e4zEBk",
		projectId: "wixonic-website-2",
		appId: "1:6198929588:web:3e2650dacec00b1bf90fe1",

		authDomain: "wixonic-website-2.firebaseapp.com",
		messagingSenderId: "6198929588",
		storageBucket: "wixonic-website-2.appspot.com"
	})
};

firebase.auth = getAuth(firebase.app);
firebase.firestore = getFirestore(firebase.app);
firebase.functions = getFunctions(firebase.app, window.localEnvironment ? path.local.functions : path.functions);
firebase.storage = getStorage(firebase.app);

if (window.localEnvironment) {
	connectAuthEmulator(firebase.auth, emulator.auth);
	connectFirestoreEmulator(firebase.firestore, emulator.firestore.domain, emulator.firestore.port);
	connectFunctionsEmulator(firebase.functions, emulator.functions.domain, emulator.functions.port);
	connectStorageEmulator(firebase.storage, emulator.storage.domain, emulator.storage.port);
}

firebase.getUser = async (force) => {
	await setPersistence(firebase.auth, browserLocalPersistence);

	if (firebase.auth.currentUser) return {
		user: firebase.auth.currentUser,
		valid: true
	};
	else if (firebase.auth.fetchedUser && !force) {
		firebase.auth.fetchedUser.cached = true;
		return firebase.auth.fetchedUser;
	}

	console.log(firebase.auth.currentUser, firebase.auth.fetchedUser);

	try {
		const req = await request("GET", new URL(`${localEnvironment ? "/wixonic-website-2/europe-west1/httpServer" : ""}/auth/token/`, window.localEnvironment ? path.local.functions : path.functions), "json", "application/json", null, -1, true);
		const token = req.response.token;

		if (token) {
			const credentials = await signInWithCustomToken(firebase.auth, token);

			firebase.auth.fetchedUser = {
				user: credentials.user,
				valid: true
			};

			return firebase.auth.fetchedUser;
		}
	} catch (e) {
		console.warn("Failed to auth with custom token:", e);
	}

	firebase.auth.fetchedUser = {
		user: null,
		valid: false
	};

	return firebase.auth.fetchedUser;
};

export default firebase;