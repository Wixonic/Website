import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence, signInWithCustomToken, signInWithEmailAndPassword, updateProfile, signOut, applyActionCode } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-functions.js";
import { getStorage, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

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
firebase.functions = getFunctions(firebase.app, localEnvironment ? path.local.functions : path.functions);
firebase.storage = getStorage(firebase.app);

if (localEnvironment) {
	connectAuthEmulator(firebase.auth, emulator.auth);
	connectFirestoreEmulator(firebase.firestore, emulator.firestore.domain, emulator.firestore.port);
	connectFunctionsEmulator(firebase.functions, emulator.functions.domain, emulator.functions.port);
	connectStorageEmulator(firebase.storage, emulator.storage.domain, emulator.storage.port);
}

firebase.getUser = async (force) => {
	await setPersistence(firebase.auth, browserLocalPersistence);

	if (firebase.auth.fetchedUser && !force) {
		firebase.auth.fetchedUser.cached = true;
		return firebase.auth.fetchedUser;
	} else if (firebase.auth.currentUser) {
		const claims = (await firebase.auth.currentUser.getIdTokenResult()).claims;

		firebase.auth.fetchedUser = {
			cached: false,
			claims,
			user: firebase.auth.currentUser,
			valid: true
		};

		return firebase.auth.fetchedUser;
	}

	try {
		const req = await request("GET", new URL(`${localEnvironment ? "/wixonic-website-2/europe-west1/httpServer" : ""}/auth/token/`, localEnvironment ? path.local.functions : path.functions), "json", "application/json", null, -1, true);
		const customToken = req.response.customToken;

		if (customToken) {
			const credentials = await signInWithCustomToken(firebase.auth, customToken);
			const claims = (await credentials.user.getIdTokenResult()).claims;

			firebase.auth.fetchedUser = {
				cached: false,
				claims,
				user: credentials.user,
				valid: true
			};

			return firebase.auth.fetchedUser;
		}
	} catch (e) {
		console.warn("Failed to auth with custom token:", e);
	}

	firebase.auth.fetchedUser = {
		claims: {},
		user: null,
		valid: false
	};

	return firebase.auth.fetchedUser;
};

firebase.signInWithEmail = async (email, password) => {
	try {
		const credentials = await signInWithEmailAndPassword(firebase.auth, email, password);
		const idToken = await credentials.user.getIdToken();

		const response = await request("POST", new URL(`${localEnvironment ? "/wixonic-website-2/europe-west1/httpServer" : ""}/auth/session/`, localEnvironment ? path.local.functions : path.functions), "json", "application/json", JSON.stringify({
			idToken
		}), -1, true);
		return response.status == 204;
	} catch (e) {
		console.error("Failed to sign-in with email:", e);
		return false;
	}
};

firebase.signInWithCustomToken = async (customToken) => {
	try {
		const credentials = await signInWithCustomToken(firebase.auth, customToken);
		const idToken = await credentials.user.getIdToken();

		const response = await request("POST", new URL(`${localEnvironment ? "/wixonic-website-2/europe-west1/httpServer" : ""}/auth/session/`, localEnvironment ? path.local.functions : path.functions), "json", "application/json", JSON.stringify({
			idToken
		}), -1, true);
		return response.status == 204;
	} catch (e) {
		console.error("Failed to sign-in with custom token:", e);
		return false;
	}
};

firebase.updateProfile = async (data) => {
	const ref = doc(firebase.firestore, "users", firebase.auth.currentUser.uid);
	await updateDoc(ref, data);

	if (data.displayName) await updateProfile(firebase.auth.currentUser, {
		displayName: data.displayName
	});
};

firebase.updatePrivateProfile = async (data) => {
	const ref = doc(firebase.firestore, "privateUsers", firebase.auth.currentUser.uid);
	await updateDoc(ref, data);
};

firebase.isLinked = async (platform, uid) => {
	try {
		const ref = doc(firebase.firestore, "users", uid ?? firebase.auth.currentUser.uid, "links", platform);
		const snap = await getDoc(ref);
		return snap.data();
	} catch {
		return null;
	}
};

firebase.link = async (platform, data = {}) => {
	const ref = doc(firebase.firestore, "users", firebase.auth.currentUser.uid, "links", platform);
	await setDoc(ref, data);
};

firebase.signOut = async (reload = true) => {
	try {
		await signOut(firebase.auth);
		await request("POST", new URL(`${localEnvironment ? "/wixonic-website-2/europe-west1/httpServer" : ""}/auth/revoke/`, localEnvironment ? path.local.functions : path.functions), "json", "application/json", null, -1, true);
		if (reload) location.reload();
	} catch (e) {
		console.warn("Failed to sign out:", e);
	}
};

firebase.applyActionCode = (...any) => applyActionCode(firebase.auth, ...any);

export default firebase;