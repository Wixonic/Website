const adminAppLibrary = require("firebase-admin/app");
const adminAuthLibrary = require("firebase-admin/auth");
const adminFirestoreLibrary = require("firebase-admin/firestore");

const clientAppLibrary = require("firebase/app");
const clientAuthLibrary = require("firebase/auth");

const config = require("./config.json");

const localEnvironment = process.env.FUNCTIONS_EMULATOR == "true";

const adminApp = adminAppLibrary.initializeApp({
	credential: adminAppLibrary.cert(config.firebase),

	apiKey: "AIzaSyDMQD5VThHrWB5tEBq0esj-X-jczerT5zA",
	appId: "1:1003826782945:web:6e98bc32f5028310b2cda0",
	projectId: "wixonic-v5-website",

	authDomain: "wixonic-v5-website.firebaseapp.com",
	messagingSenderId: "1003826782945",
	storageBucket: "wixonic-v5-website.firebasestorage.app"
}, "admin");
const adminAuth = adminAuthLibrary.getAuth(adminApp);
const adminFirestore = adminFirestoreLibrary.getFirestore(adminApp);

const clientApp = clientAppLibrary.initializeApp({
	apiKey: "AIzaSyDMQD5VThHrWB5tEBq0esj-X-jczerT5zA",
	appId: "1:1003826782945:web:6e98bc32f5028310b2cda0",
	projectId: "wixonic-v5-website",

	authDomain: "wixonic-v5-website.firebaseapp.com",
	messagingSenderId: "1003826782945",
	storageBucket: "wixonic-v5-website.firebasestorage.app"
}, "client");

const clientAuth = clientAuthLibrary.getAuth(clientApp);
if (localEnvironment) clientAuthLibrary.connectAuthEmulator(clientAuth, "http://localhost:2001");

module.exports = {
	adminAuth,
	adminFirestore,
	clientApp,
	clientAppLibrary,
	clientAuth,
	clientAuthLibrary,
	localEnvironment
};