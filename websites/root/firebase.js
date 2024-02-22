import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator, collection, doc, query, where, getDoc, getDocs, getDocFromCache, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
const storage = getStorage(app);

if (location.hostname == "localhost") {
	console.warn("Running in local environment");
	connectAuthEmulator(auth, "http://localhost:2001");
	connectFirestoreEmulator(firestore, "localhost", 2002);
	connectStorageEmulator(storage, "localhost", 2003);
	setStatus({
		gravity: "log",
		message: "Running in local emulated environment."
	});
} else if (location.hostname == "qvkq66-2004.csb.app") {
	console.warn("Running in shared environment");
	connectAuthEmulator(auth, "https://qvkq66-2001.csb.app");
	connectFirestoreEmulator(firestore, "qvkq66-2002.csb.app", 443);
	connectStorageEmulator(storage, "qvkq66-2003.csb.app", 443);
	setStatus({
		gravity: "warn",
		message: "Running in shared emulated environment."
	});
}

const init = async () => {
	const statusDoc = await getDoc(doc(firestore, "status", "current").withConverter({
		/**
		 * @returns {import("./status").Status}
		 */
		fromFirestore: (snapshot, options) => {
			const data = snapshot.data(options);
			return {
				message: data.message,
				gravity: data.gravity,
				startDate: data.startDate?.toDate(),
				endDate: data.endDate?.toDate()
			};
		}
	}));

	if (statusDoc.exists()) {
		/**
		 * @type {import("./status").Status}
		 */
		const status = statusDoc.data();
		setStatus(status);
	}
};

export default {
	app,
	auth,
	firestore,
	storage,
	init
};