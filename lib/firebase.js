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
	changeEmail: (email) => {
		const body = new URLSearchParams();
		body.set("email", btoa(email));

		return new Promise(async (resolve, reject) => {
			const data = await request("POST", new URL("/email/change", functions.customDomain), "text", null, body, 0, true);
			if (data.status == 204) resolve();
			else reject(data.response);
		});
	},
	createUserWithEmail: (email, password, confirm) => new Promise(async (resolve, reject) => {
		if (password !== confirm) {
			reject({
				code: "auth/passwords-dont-match"
			})
		} else {
			createUserWithEmailAndPassword(auth, email, password)
				.then(async () => {
					try {
						await authEngine.signInWithEmail(email, password);
						resolve();
					} catch (reason) {
						reject(reason);
					}
				}).catch((reason) => {
					reject(reason);
				});
		}
	}),
	signInWithEmail: (email, password) => {
		const body = new URLSearchParams();
		body.set("email", btoa(email));
		body.set("password", btoa(password));

		return new Promise(async (resolve, reject) => {
			const data = await request("POST", new URL("/email", functions.customDomain), "text", null, body, 0, true);
			if (data.status == 204) resolve(await authEngine.signInWithSession());
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
	if (!authEngine.user) await authEngine.signInWithSession();
};

export default {
	auth: authEngine,
	firestore: firestoreEngine,
	init
};