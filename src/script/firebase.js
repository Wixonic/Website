import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence, signInWithCustomToken, signInWithEmailAndPassword, updateProfile, signOut, applyActionCode } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-functions.js";
import { getStorage, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";

import { request } from "/script/request.js";

window.firebase = {
	app: initializeApp({
		apiKey: "AIzaSyDMQD5VThHrWB5tEBq0esj-X-jczerT5zA",
		appId: "1:1003826782945:web:6e98bc32f5028310b2cda0",
		projectId: "wixonic-v5-website",

		authDomain: "wixonic-v5-website.firebaseapp.com",
		messagingSenderId: "1003826782945",
		storageBucket: "wixonic-v5-website.firebasestorage.app"
	}),
	localEnvironment: location.hostname == "localhost"
};

if (firebase.localEnvironment) console.warn("Running in local environment");

firebase.getAuth = (...args) => {
	const auth = getAuth(firebase.app, ...args);
	if (firebase.localEnvironment) connectAuthEmulator(auth, path.firebase.auth);
	return auth;
};

firebase.getFirestore = (...args) => {
	const firestore = getFirestore(firebase.app, ...args);
	if (firebase.localEnvironment) connectFirestoreEmulator(firestore, path.firebase.firestore.domain, path.firebase.firestore.port);
	return firestore;
};

firebase.getFunctions = (...args) => {
	const functions = getFunctions(firebase.app, path.functions, ...args);
	if (firebase.localEnvironment) connectFunctionsEmulator(functions, path.firebase.functions.domain, path.firebase.functions.port);
	return functions;
};

firebase.getStorage = (...args) => {
	const storage = getStorage(firebase.app, ...args);
	if (firebase.localEnvironment) connectStorageEmulator(storage, path.firebase.storage.domain, path.firebase.storage.port);;
	return storage;
};

firebase.default = {
	auth: firebase.getAuth(),
	firestore: firebase.getFirestore(),
	functions: firebase.getFunctions(),
	storage: firebase.getStorage()
};

firebase.getUser = async (force) => {
	await setPersistence(firebase.default.auth, browserLocalPersistence);

	if (firebase.default.auth.fetchedUser && !force) {
		firebase.default.auth.fetchedUser.cached = true;
		return firebase.default.auth.fetchedUser;
	} else if (firebase.default.auth.currentUser) {
		const claims = (await firebase.default.auth.currentUser.getIdTokenResult()).claims;

		firebase.default.auth.fetchedUser = {
			cached: false,
			claims,
			user: firebase.default.auth.currentUser,
			valid: true
		};

		return firebase.default.auth.fetchedUser;
	}

	try {
		const req = await request("GET", new URL("/auth/token/", path.functions), "json", "application/json", null, -1, true);
		const customToken = req.response.customToken;

		if (customToken) {
			const credentials = await signInWithCustomToken(firebase.default.auth, customToken);
			const claims = (await credentials.user.getIdTokenResult()).claims;

			firebase.default.auth.fetchedUser = {
				cached: false,
				claims,
				user: credentials.user,
				valid: true
			};

			return firebase.default.auth.fetchedUser;
		}
	} catch (error) {
		console.warn("Failed to auth with custom token:", error);
	}

	firebase.default.auth.fetchedUser = {
		claims: {},
		user: null,
		valid: false
	};

	return firebase.default.auth.fetchedUser;
};

firebase.signInWithEmail = async (email, password) => {
	try {
		const credentials = await signInWithEmailAndPassword(firebase.default.auth, email, password);
		const idToken = await credentials.user.getIdToken();

		const response = await request("POST", new URL("/auth/token/", path.functions), "json", "application/json", JSON.stringify({
			idToken
		}), -1, true);
		return response.status == 204;
	} catch (error) {
		console.error("Failed to sign-in with email:", error);
		return false;
	}
};

firebase.signInWithCustomToken = async (customToken) => {
	try {
		const credentials = await signInWithCustomToken(firebase.default.auth, customToken);
		const idToken = await credentials.user.getIdToken();

		const response = await request("POST", new URL("/auth/token/", path.functions), "json", "application/json", JSON.stringify({
			idToken
		}), -1, true);
		return response.status == 204;
	} catch (e) {
		console.error("Failed to sign-in with custom token:", e);
		return false;
	}
};

firebase.updateProfile = async (data) => {
	const ref = doc(firebase.default.firestore, "users", firebase.default.auth.currentUser.uid);
	await updateDoc(ref, data);

	if (data.displayName) await updateProfile(firebase.default.auth.currentUser, {
		displayName: data.displayName
	});
};

firebase.updatePrivateProfile = async (data) => {
	const ref = doc(firebase.default.firestore, "privateUsers", firebase.default.auth.currentUser.uid);
	await updateDoc(ref, data);
};

firebase.signOut = async (reload = true) => {
	try {
		await signOut(firebase.default.auth);
		await request("DELETE", new URL("/auth/token/", path.functions), "text", null, null, -1, true);
		if (reload) location.reload();
	} catch (error) {
		console.warn("Failed to sign out:", error);
	}
};

firebase.applyActionCode = (...any) => applyActionCode(firebase.default.auth, ...any);