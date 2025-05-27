const adminAppLibrary = require("firebase-admin/app");
const adminAuthLibrary = require("firebase-admin/auth");
const adminFirestoreLibrary = require("firebase-admin/firestore");

const adminFunctionsLibrary = require("firebase-functions/v1");

const clientAppLibrary = require("firebase/app");
const clientAuthLibrary = require("firebase/auth");

const server = require("./server.js");

const localEnvironment = process.env.FUNCTIONS_EMULATOR === "true";

const adminApp = adminAppLibrary.initializeApp({
	credential: adminAppLibrary.cert(require("./config.json")),

	apiKey: "AIzaSyAoAl-09tw3K0i8N2PnYKAjjZb19e4zEBk",
	projectId: "wixonic-website-2",
	appId: "1:6198929588:web:3e2650dacec00b1bf90fe1",

	authDomain: "wixonic-website-2.firebaseapp.com",
	messagingSenderId: "6198929588",
	storageBucket: "wixonic-website-2.appspot.com"
}, "admin");
const adminAuth = adminAuthLibrary.getAuth(adminApp);
const adminFirestore = adminFirestoreLibrary.getFirestore(adminApp);

const adminFunctionsDefaultLibrary = adminFunctionsLibrary.runWith({
	memory: "128MB",
	timeoutSeconds: 15
}).region("europe-west1");

const clientApp = clientAppLibrary.initializeApp({
	apiKey: "AIzaSyAoAl-09tw3K0i8N2PnYKAjjZb19e4zEBk",
	projectId: "wixonic-website-2",
	appId: "1:6198929588:web:3e2650dacec00b1bf90fe1",

	authDomain: "wixonic-website-2.firebaseapp.com",
	messagingSenderId: "6198929588",
	storageBucket: "wixonic-website-2.appspot.com"
}, "client");
const clientAuth = clientAuthLibrary.getAuth(clientApp);
if (localEnvironment) clientAuthLibrary.connectAuthEmulator(clientAuth, "http://localhost:2001");

exports.httpServer = require("firebase-functions/v2/https").onRequest({
	memory: "256MiB",
	region: "europe-west1",
	timeoutSeconds: 10
}, server);