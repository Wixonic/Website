const adminAppLibrary = require("firebase-admin/app");
const adminAuthLibrary = require("firebase-admin/auth");
const adminFirestoreLibrary = require("firebase-admin/firestore");

const adminFunctionsLibrary = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");

const clientAppLibrary = require("firebase/app");
const clientAuthLibrary = require("firebase/auth");

const localEnvironment = process.env.FUNCTIONS_EMULATOR == "true";
// if (localEnvironment) process.env.FIRESTORE_EMULATOR_HOST = "localhost:2000";

const adminApp = adminAppLibrary.initializeApp({
	credential: adminAppLibrary.cert(require("./config")),

	apiKey: "AIzaSyAoAl-09tw3K0i8N2PnYKAjjZb19e4zEBk",
	projectId: "wixonic-website-2",
	appId: "1:6198929588:web:3e2650dacec00b1bf90fe1",

	authDomain: "wixonic-website-2.firebaseapp.com",
	messagingSenderId: "6198929588",
	storageBucket: "wixonic-website-2.appspot.com"
});
const adminAuth = adminAuthLibrary.getAuth(adminApp);
const adminFirestore = adminFirestoreLibrary.getFirestore(adminApp);


const adminFunctionsDefaultParams = adminFunctionsLibrary.runWith({
	memory: "128MB",
	timeoutSeconds: 30
}).region("europe-west1");
const adminHttpsFunctionsDefaultParams = {
	cors: localEnvironment ? /^localhost:[0-9]{2,6}$/ : /\.wixonic\.fr$/,
	memory: "128MB",
	region: "europe-west1",
	timeoutSeconds: 30
};


const clientApp = clientAppLibrary.initializeApp({
	apiKey: "AIzaSyAoAl-09tw3K0i8N2PnYKAjjZb19e4zEBk",
	projectId: "wixonic-website-2",
	appId: "1:6198929588:web:3e2650dacec00b1bf90fe1",

	authDomain: "wixonic-website-2.firebaseapp.com",
	messagingSenderId: "6198929588",
	storageBucket: "wixonic-website-2.appspot.com"
});
const clientAuth = clientAuthLibrary.initializeAuth(clientApp);
if (localEnvironment) clientAuthLibrary.connectAuthEmulator(clientAuth, "http://localhost:2001");


exports.createAccount = adminFunctionsDefaultParams.auth.user().onCreate(async (user, ctx) => {
	const username = `user-${new Date(ctx.timestamp).getTime().toString(36)}`;

	try {
		await adminAuth.setCustomUserClaims(user.uid, {
			admin: user.email === "contact@wixonic.fr",
			comment: true,
			moderate: user.email === "contact@wixonic.fr",
			status: user.email === "contact@wixonic.fr"
		});
	} catch (e) {
		console.error("Failed to set custom claims: " + e);
	}

	try {
		await adminFirestore.collection("users").doc(user.uid).set({
			joined: adminFirestoreLibrary.Timestamp.fromDate(new Date(ctx.timestamp)),
			username
		});
	} catch (e) {
		console.error("Failed to create public user document: " + e);
	}

	try {
		await adminFirestore.collection("private-users").doc(user.uid).set({
			email: user.email
		});
	} catch (e) {
		console.error("Failed to create private user document: " + e);
	}
});

exports.deleteAccount = adminFunctionsDefaultParams.auth.user().onDelete(async (user) => {
	try {
		await adminFirestore.collection("users").doc(user.uid).delete();
	} catch (e) {
		console.error("Failed to delete public user docuement: " + e);
	}

	try {
		await adminFirestore.collection("private-users").doc(user.uid).delete();
	} catch (e) {
		console.error("Failed to delete private user document: " + e);
	}
});


exports.test = onRequest(adminHttpsFunctionsDefaultParams, async (_, res) => {
	res.send((await adminFirestore.collection("private-users").doc("test").set({
		foo: "bar"
	})));
});


exports.ping = onRequest(adminHttpsFunctionsDefaultParams, (_, res) => {
	res.writeHead(200, {
		"content-type": "text/plain"
	}).write("pong");

	res.end();
});

exports.signInWithEmailAndPassword = onRequest(adminHttpsFunctionsDefaultParams, async (req, res) => {
	try {
		const email = atob(req?.body?.email);
		const password = atob(req?.body?.password);

		const cookieDuration = 14 * 24 * 60 * 60 * 1000;

		try {
			const data = await clientAuthLibrary.signInWithEmailAndPassword(clientAuth, email, password)

			try {
				const idToken = await data.user.getIdToken()

				try {
					const sessionCookie = await adminAuth.createSessionCookie(idToken, {
						expiresIn: cookieDuration
					});

					res.writeHead(204);
					res.cookie("session", sessionCookie, {
						maxAge: cookieDuration,
						secure: !localEnvironment
					});
					const date = new Date();
					date.setTime(Date.now() + cookieDuration);
					res.write("Cookie valid until: " + date.toISOString());
					res.end();
				} catch (reason) {
					res.writeHead(500, {
						"content-type": "text/plain"
					}).write(`Failed to create cookie: ${reason.code || reason || "Unknown reason"}`);

					res.end();
				}
			} catch (reason) {
				res.writeHead(500, {
					"content-type": "text/plain"
				}).write(`Failed to create token: ${reason.code || reason || "Unknown reason"}`);

				res.end();
			}
		} catch (reason) {
			res.writeHead(401, {
				"content-type": "text/plain"
			});

			res.write(`Failed to authenticate: ${reason.code || reason || "Unknown reason"}`);
		}
	} catch {
		res.writeHead(401, {
			"content-type": "text/plain"
		});

		res.write(`Failed to authenticate: invalid params`);
	}

	res.end();
});