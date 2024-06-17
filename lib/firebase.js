import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { getStorage, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import { path, emulator } from "/lib/path.js";

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
const firestore = getFirestore(app);
const functions = getFunctions(app, window.localEnvironment ? path.local.functions : path.functions);
const storage = getStorage(app);

if (window.localEnvironment) {
	connectAuthEmulator(auth, emulator.auth);
	connectFirestoreEmulator(firestore, emulator.firestore.domain, emulator.firestore.port);
	connectFunctionsEmulator(functions, emulator.functions.domain, emulator.functions.port);
	connectStorageEmulator(storage, emulator.storage.domain, emulator.storage.port);
}

export default {
	app,
	auth,
	firestore,
	functions,
	storage
};