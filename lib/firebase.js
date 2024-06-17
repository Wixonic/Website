import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore, connectFirestoreEmulator, memoryLocalCache } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { getStorage, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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
const functions = getFunctions(app, window.localEnvironment ? "http://localhost:2014" : "https://functions.wixonic.fr");
const storage = getStorage(app);

if (window.localEnvironment) {
	connectAuthEmulator(auth, "http://localhost:2001");
	connectFirestoreEmulator(firestore, "localhost", 2002);
	connectFunctionsEmulator(functions, "localhost", 2014);
	connectStorageEmulator(storage, "localhost", 2004);
}