import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
	getAuth, connectAuthEmulator,
	createUserWithEmailAndPassword, signInWithCustomToken
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
	initializeFirestore, connectFirestoreEmulator, memoryLocalCache,
	getDoc, getDocs, setDoc, updateDoc, deleteDoc,
	getCountFromServer, getAggregateFromServer, count, sum, average,
	collection, doc,
	onSnapshot,
	query, where, or, orderBy, limit, startAt, startAfter, endAt, endBefore,
	arrayUnion, arrayRemove, deleteField, increment, serverTimestamp,
	disableNetwork, enableNetwork
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js";

import { getStorage, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";


import error from "/lib/error.js";
import request from "/lib/request.js";


window.localEnvironment = location.hostname == "localhost";

const app = initializeApp({
	apiKey: "AIzaSyAoAl-09tw3K0i8N2PnYKAjjZb19e4zEBk",
	projectId: "wixonic-website-2",
	appId: "1:6198929588:web:3e2650dacec00b1bf90fe1",

	authDomain: "wixonic-website-2.firebaseapp.com",
	messagingSenderId: "6198929588",
	storageBucket: "wixonic-website-2.appspot.com"
});

const auth = getAuth(app);
const firestore = initializeFirestore(app, {
	localCache: memoryLocalCache()
});
const functions = getFunctions(app, localEnvironment ? "http://localhost:2013" : "https://functions.wixonic.fr");
const storage = getStorage(app);

if (localEnvironment) {
	connectAuthEmulator(auth, "http://localhost:2001");
	connectFirestoreEmulator(firestore, "localhost", 2002);
	connectFunctionsEmulator(functions, "localhost", 2003);
	connectStorageEmulator(storage, "localhost", 2004);
}

const authEngine = {
	object: auth,
	createUserWithEmail: (email, password, confirm) => {
		if (password !== confirm) {
			return new Promise((_, reject) => reject({
				code: "auth/passwords-dont-match"
			}));
		} else return createUserWithEmailAndPassword(auth, email, password);
	},
	signInWithEmail: (email, password) => {
		const body = new URLSearchParams();
		body.set("email", btoa(email));
		body.set("password", btoa(password));

		return new Promise(async (resolve, reject) => {
			const data = await request("POST", new URL("/email", functions.customDomain), "text", null, body, 0, true);
			if (data.response.startsWith("Failed to authenticate: auth/")) reject(data.response.split(" ").at(-1));
			else if (data.status == 200) resolve();
			else reject(data.response);
		});
	},
	signInWithSession: async () => {
		try {
			const data = await request("GET", new URL("/session", functions.customDomain), "text", null, null, 0, true);
			if (data.status == 200) return await signInWithCustomToken(auth, data.response);
			else return false;
		} catch (e) {
			error(e);
		}
	},
	user: auth.currentUser
};

auth.onAuthStateChanged((user) => authEngine.user = user);

const firestoreEngine = {
	getDoc: async (target) => {
		const document = await getDoc(target);
		return document.exists() ? document.data() : null;
	},

	getDocs: async (target) => {
		const data = {};

		const documents = await getDocs(target);
		documents.forEach((snapshot) => data[snapshot.id] = snapshot.data());

		return data;
	},

	setDoc,
	updateDoc,
	deleteDoc,

	getCountFromServer,
	getAggregateFromServer,
	count,
	sum,
	average,

	doc: (...pathSegments) => doc(firestore, ...pathSegments),
	collection: (...pathSegments) => collection(firestore, ...pathSegments),

	onSnapshot,

	query,
	where,
	or,
	orderBy,
	limit,
	startAt,
	startAfter,
	endAt,
	endBefore,

	arrayUnion,
	arrayRemove,
	deleteField,
	increment,
	serverTimestamp,

	disableNetwork,
	enableNetwork
};

const init = async () => {
	if (!auth.currentUser) await authEngine.signInWithSession();
};

export default {
	auth: authEngine,
	firestore: firestoreEngine,
	init
};