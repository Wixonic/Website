import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
	getAuth, connectAuthEmulator,
	signInWithEmailAndPassword, createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js";
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
import { getStorage, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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
const functions = getFunctions(app);
const storage = getStorage(app);

if (location.hostname == "localhost") {
	window.localEnvironment = true;

	connectAuthEmulator(auth, "http://localhost:2001");
	connectFirestoreEmulator(firestore, "localhost", 2002);
	connectStorageEmulator(functions, "localhost", 2003);
	connectFunctionsEmulator(storage, "localhost", 2004);
}

const authEngine = {
	object: auth,

	signInWithEmail: (email, password) => signInWithEmailAndPassword(auth, email, password),
	signUpWithEmail: async (email, password, confirm) => {
		if (password !== confirm) throw {
			code: "auth/invalid-confirmation-password"
		};

		await createUserWithEmailAndPassword(email, password);
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

const init = async () => { };

export default {
	auth: authEngine,
	firestore: firestoreEngine,
	init
};