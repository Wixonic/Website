import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js";
import {
	getFirestore, connectFirestoreEmulator, persistentLocalCache, persistentMultipleTabManager,
	collection, doc, getDoc, getDocs, setDoc,
	query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

import { setStatus } from "/status.js"

const app = initializeApp({
	apiKey: "AIzaSyAoAl-09tw3K0i8N2PnYKAjjZb19e4zEBk",
	projectId: "wixonic-website-2",
	appId: "1:6198929588:web:3e2650dacec00b1bf90fe1",

	authDomain: "wixonic-website-2.firebaseapp.com",
	messagingSenderId: "6198929588",
	storageBucket: "wixonic-website-2.appspot.com"
});

const auth = getAuth(app);
const firestore = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

if (location.hostname == "localhost") {
	connectAuthEmulator(auth, "http://localhost:2001");
	connectFirestoreEmulator(firestore, "localhost", 2002);
	connectStorageEmulator(functions, "localhost", 2003);
	connectFunctionsEmulator(storage, "localhost", 2004);

	setStatus({
		gravity: "log",
		message: "Running in local environment."
	});
}

/**
 * @typedef {Object} FirestoreEngine
 */

/**
 * @type {FirestoreEngine}
 */
const firestoreEngine = {
	getDoc: async (converter, ...pathSegments) => {
		const ref = doc(firestore, ...pathSegments).withConverter({
			fromFirestore: (snapshot, options) => converter(snapshot.data(options))
		});
		const document = await getDoc(ref);

		if (document.exists()) return document.data();
		else return null;
	},

	getDocs: async (converter, ...pathSegments) => {
		const ref = collection(firestore, ...pathSegments).withConverter({
			fromFirestore: (snapshot, options) => converter(snapshot.data(options))
		});

		const data = {};

		const documents = await getDocs(ref);
		documents.forEach((snapshot) => data[snapshot.id] = snapshot.data());

		console.log(data);

		return data;
	},

	query: async (converter, options, ...pathSegments) => {
		const ref = collection(firestore, ...pathSegments).withConverter({
			fromFirestore: (snapshot, options) => converter(snapshot.data(options))
		});
	},

	where,
	orderBy,
	limit
};

const init = async () => {
	/**
	 * @type {import("./status").Status?}
	 */
	const status = await firestoreEngine.getDoc((data) => {
		return {
			message: data.message,
			gravity: data.gravity,
			startDate: data.startDate?.toDate(),
			endDate: data.endDate?.toDate()
		};
	}, "status", "current");

	if (status) setStatus(status);
};

export default {
	firestore: firestoreEngine,
	init
};