const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

const functions = require("firebase-functions");

if (process.env.FUNCTIONS_EMULATOR == true) {
	console.log("Running in local environment");
	process.env["FIRESTORE_EMULATOR_HOST"] = "localhost:2000";
}

const app = admin.initializeApp({
	credential: admin.credential.cert(require("./config")),

	apiKey: "AIzaSyAoAl-09tw3K0i8N2PnYKAjjZb19e4zEBk",
	projectId: "wixonic-website-2",
	appId: "1:6198929588:web:3e2650dacec00b1bf90fe1",

	authDomain: "wixonic-website-2.firebaseapp.com",
	messagingSenderId: "6198929588",
	storageBucket: "wixonic-website-2.appspot.com"
});

const auth = getAuth();
const firestore = getFirestore();
const storage = getStorage();

exports.createAccount = functions.auth.user().onCreate(async (user, ctx) => {
	const username = `user-${new Date(ctx.timestamp).getTime().toString(36)}`;

	await auth.setCustomUserClaims(user.uid, {
		comment: true,
		moderate: false,
		status: false
	});

	await firestore.doc(`/users/${user.uid}`).create({
		joined: Timestamp.fromDate(new Date(ctx.timestamp)),
		username
	});

	await firestore.doc(`/private-users/${user.uid}`).create({
		email: user.email
	});
});

exports.deleteAccount = functions.auth.user().onDelete(async (user) => {
	await firestore.doc(`/users/${user.uid}`).delete();
	await firestore.doc(`/private-users/${user.uid}`).delete();
});