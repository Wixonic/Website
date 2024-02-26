const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

const functions = require("firebase-functions");

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
	const doc = firestore.doc(`/users/${user.uid}`);
	const username = `user-${new Date(ctx.timestamp).getTime().toString(36)}`;

	await doc.create({
		creationDate: Timestamp.fromDate(new Date(ctx.timestamp)),
		email: user.email,
		permissions: [],
		privacy: {
			public: {
				account: true,
				email: false
			}
		},
		username
	})

	await firestore.doc(`/usernames/${username}`).create({
		user: doc
	});
});

exports.deleteAccount = functions.auth.user().onDelete(async (user) => {
	const doc = firestore.doc(`/users/${user.uid}`);
	const data = (await doc.get()).data();

	await doc.delete();
	await firestore.doc(`/usernames/${data.username}`).delete();
});