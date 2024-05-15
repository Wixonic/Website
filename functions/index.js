const adminAppLibrary = require("firebase-admin/app");
const adminAuthLibrary = require("firebase-admin/auth");
const adminFirestoreLibrary = require("firebase-admin/firestore");

const adminFunctionsLibrary = require("firebase-functions");

const clientAppLibrary = require("firebase/app");
const clientAuthLibrary = require("firebase/auth");

const localEnvironment = process.env.FUNCTIONS_EMULATOR === "true";

const adminApp = adminAppLibrary.initializeApp({
	credential: adminAppLibrary.cert(require("./config")),

	apiKey: "AIzaSyAoAl-09tw3K0i8N2PnYKAjjZb19e4zEBk",
	projectId: "wixonic-website-2",
	appId: "1:6198929588:web:3e2650dacec00b1bf90fe1",

	authDomain: "wixonic-website-2.firebaseapp.com",
	messagingSenderId: "6198929588",
	storageBucket: "wixonic-website-2.appspot.com"
}, "admin");
const adminAuth = adminAuthLibrary.getAuth(adminApp);
const adminFirestore = adminFirestoreLibrary.getFirestore(adminApp);

const adminFunctionsDefaultParams = adminFunctionsLibrary.runWith({
	memory: "128MB",
	timeoutSeconds: 30
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


const server = require("express")();

server.use(require("cors")({
	credentials: true,
	origin: (origin, callback) => {
		if (localEnvironment && origin.match(/localhost:\d{4,6}$/m)) return callback(null, true);
		else if (origin.endsWith("wixonic.fr")) return callback(null, true);

		return callback(new Error("Origin not allowed"));
	},
	optionsSuccessStatus: 200
}));

server.use(require("cookie-parser")());

server.get("/", (_, res) => {
	res.writeHead(200, {
		"content-type": "text/plain"
	}).write("pong");

	res.end();
});

server.get("/session", async (req, res) => {
	const sessionCookie = req.cookies.session;

	if (sessionCookie) {
		try {
			const idToken = await adminAuth.verifySessionCookie(sessionCookie, true);

			try {
				const token = await adminAuth.createCustomToken(idToken.uid);

				res.writeHead(200);
				res.write(token);
			} catch (reason) {
				reason = `Failed to create token: ${reason.code ?? reason ?? "Unknown reason"}`;
				console.error(reason);

				res.writeHead(500);
				res.write(reason);
			}
		} catch (reason) {
			reason = `Failed to verify cookie: ${reason.code ?? reason ?? "Unknown reason"}`;
			console.error(reason);

			res.writeHead(500);
			res.write(reason);
		}
	} else {
		const reason = "Session cookie not provided";
		console.error(reason);

		res.writeHead(401);
		res.write(reason);
	}

	res.end();
});

server.post("/email", async (req, res) => {
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

					res.cookie("session", sessionCookie, {
						httpOnly: true,
						maxAge: cookieDuration,
						sameSite: "none",
						secure: !localEnvironment
					});

					res.writeHead(204);
				} catch (reason) {
					reason = reason.code || reason || "Unknown reason";
					console.error(reason);

					res.writeHead(500);
					res.write(reason);
				}
			} catch (reason) {
				reason = reason.code || reason || "Unknown reason";
				console.error(reason);

				res.writeHead(500);
				res.write(reason);
			}
		} catch (reason) {
			reason = reason.code || reason || "Unknown reason";
			console.error(reason);

			res.writeHead(500);
			res.write(reason);
		}
	} catch (reason) {
		console.error(`Failed to authenticate: auth/missing-params - ${reason}`);

		res.writeHead(401);
		res.write("auth/missing-params");
	}

	res.end();
});

server.post("/email/change", async (req, res) => {
	// try {
	const email = atob(req?.body?.email);

	if (/^[\w\.-]+@([\w-]+\.)+[\w-]{2,}$/.test(email)) {
		const sessionCookie = req.cookies.session;

		if (sessionCookie) {
			// try {
			const idToken = await adminAuth.verifySessionCookie(sessionCookie, true);

			// try {
			const token = await adminAuth.createCustomToken(idToken.uid);

			// try {
			const user = await clientAuthLibrary.signInWithCustomToken(clientAuth, token);

			// try {
			await clientAuthLibrary.updateEmail(user, email);

			// try {
			await adminFirestore.collection("private-users").doc(data.user.uid).update({
				email: user.email
			});

			res.writeHead(204);
			/* } catch (reason) {
				reason = `Failed to change email: ${reason.code ?? reason ?? "Unknown reason"} - Step 2`;
				console.error(reason);

				res.writeHead(500);
				res.write(reason);
			}
		} catch (reason) {
			reason = `Failed to change email: ${reason.code ?? reason ?? "Unknown reason"} - Step 1`;
			console.error(reason);

			res.writeHead(500);
			res.write(reason);
		}
	} catch (reason) {
		reason = `Failed to authenticate: ${reason.code ?? reason ?? "Unknown reason"}`;
		console.error(reason);

		res.writeHead(500);
		res.write(reason);
	}
} catch (reason) {
	reason = `Failed to create token: ${reason.code ?? reason ?? "Unknown reason"}`;
	console.error(reason);

	res.writeHead(500);
	res.write(reason);
}
} catch (reason) {
reason = `Failed to verify cookie: ${reason.code ?? reason ?? "Unknown reason"}`;
console.error(reason);

res.writeHead(500);
res.write(reason);
} */
		} else {
			const reason = "Session cookie not provided";
			console.error(reason);

			res.writeHead(401);
			res.write(reason);
		}
	} else {
		console.error(`Failed to authenticate: auth/invalid-email`);

		res.writeHead(401);
		res.write("auth/invalid-email");
	}
	/* } catch (reason) {
		console.error(`Failed to authenticate: auth/missing-params - ${reason ?? "Unknown reason"}`);
	
		res.writeHead(401);
		res.write("auth/missing-params");
	} */

	res.end();
});

exports.httpServer = require("firebase-functions/v2/https").onRequest({
	memory: "128MB",
	region: "europe-west1",
	timeoutSeconds: 30
}, server);