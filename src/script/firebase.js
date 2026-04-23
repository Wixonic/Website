import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence, signInWithCustomToken, signInWithEmailAndPassword, updateProfile, signOut, applyActionCode } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
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

firebase.auth = getAuth(firebase.app);
firebase.firestore = getFirestore(firebase.app);
firebase.functions = getFunctions(firebase.app, path.functions);
firebase.storage = getStorage(firebase.app);

if (firebase.localEnvironment) {
	console.warn("Running in local environment");

	connectAuthEmulator(firebase.auth, path.firebase.auth);
	connectFirestoreEmulator(firebase.firestore, path.firebase.firestore.domain, path.firebase.firestore.port);
	connectFunctionsEmulator(firebase.functions, path.firebase.functions.domain, path.firebase.functions.port);
	connectStorageEmulator(firebase.storage, path.firebase.storage.domain, path.firebase.storage.port);
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
		const req = await request("GET", new URL("/auth/token/", path.functions), "json", "application/json", null, -1, true);
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
	} catch (error) {
		console.warn("Failed to auth with custom token:", error);
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
		const credentials = await signInWithCustomToken(firebase.auth, customToken);
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
		await request("DELETE", new URL("/auth/token/", path.functions), "text", null, null, -1, true);
		if (reload) location.reload();
	} catch (error) {
		console.warn("Failed to sign out:", error);
	}
};

firebase.applyActionCode = (...any) => applyActionCode(firebase.auth, ...any);