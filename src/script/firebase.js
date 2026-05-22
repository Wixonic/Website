import { initializeApp } from "https://www.gstatic.com/firebasejs/{{ path.firebase.version }}/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/{{ path.firebase.version }}/firebase-app-check.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/{{ path.firebase.version }}/firebase-firestore.js";

const firebaseConfig = {
	apiKey: "AIzaSyDMQD5VThHrWB5tEBq0esj-X-jczerT5zA",
	authDomain: "wixonic-v5-website.firebaseapp.com",
	projectId: "wixonic-v5-website",
	storageBucket: "wixonic-v5-website.firebasestorage.app",
	messagingSenderId: "1003826782945",
	appId: "1:1003826782945:web:6e98bc32f5028310b2cda0"
};

const app = initializeApp(firebaseConfig);

if (path.firebase.isEmulator) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

const appCheck = initializeAppCheck(app, {
	provider: new ReCaptchaV3Provider("6Le5pvIsAAAAAMreSY0JgCDt0kiCWW5BAZlcljml"),
	isTokenAutoRefreshEnabled: true
});

const db = getFirestore(app);

if (path.firebase.isEmulator) connectFirestoreEmulator(db, path.firebase.firestore.domain, path.firebase.firestore.port);

export { app, appCheck, db };