const express = require("express");
const fs = require("fs");

const { adminAuth, adminFirestore, clientAuth, clientAuthLibrary, localEnvironment } = require("../firebase.js");
const transporter = require("../mailer.js");

const router = express.Router();

const sendVerificationEmail = async (email, newEmail) => {
	const url = new URL("/verify/", localEnvironment ? "http://localhost:2010" : "https://accounts.wixonic.fr");
	const verificationLink = new URL(newEmail ? await adminAuth.generateVerifyAndChangeEmailLink(email, newEmail) : await adminAuth.generateEmailVerificationLink(email));
	url.searchParams.set("mode", verificationLink.searchParams.get("mode"));
	url.searchParams.set("oobCode", verificationLink.searchParams.get("oobCode"));

	await transporter.sendMail({
		from: "Wixonic <contact@wixonic.fr>",
		replyTo: "contact@wixonic.fr",
		to: email,
		subject: "Verify your email",
		html: fs.readFileSync("./emails/verify.html", "utf-8")
			.replaceAll("%EMAIL%", email)
			.replaceAll("%VERIFICATION_LINK%", url.toString())
	});
};

router.route(["/token", "/token/"])
	.get(async (req, res) => {
		const sessionCookie = req.cookies.__session;

		if (!sessionCookie) {
			req.logger.warn("Session cookie is missing");
			return res.status(401).json({
				error: "Session cookie is missing"
			});
		}

		try {
			const user = await adminAuth.verifySessionCookie(sessionCookie, true);

			const customToken = await adminAuth.createCustomToken(user.uid);
			res.status(200).json({
				customToken
			});
		} catch (error) {
			req.logger.error("Failed to verify token:", error);
			return res.status(403).json({
				error: "Invalid or expired token"
			});
		}
	})
	.post(async (req, res) => {
		const { idToken } = req.body;

		if (!idToken) {
			req.logger.warn("Missing idToken");
			return res.status(400).json({
				error: "Missing idToken"
			});
		}

		try {
			const expiresIn = 2 * 7 * 24 * 60 * 60 * 1000; // 2 weeks
			const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

			res.cookie("__session", sessionCookie, {
				domain: localEnvironment ? undefined : ".wixonic.fr",
				maxAge: expiresIn,
				httpOnly: true,
				secure: !localEnvironment,
				sameSite: localEnvironment ? "lax" : "none"
			});

			res.status(204).end();
		} catch (error) {
			req.logger.warn("Failed to create session cookie:", error);
			res.status(401).json({ error: "Unauthorized request" });
		}
	})
	.delete(async (req, res) => {
		const sessionCookie = req.cookies.__session;

		if (!sessionCookie) {
			req.logger.warn("Session cookie is missing");
			return res.status(401).json({
				error: "Session cookie is missing"
			});
		}

		res.clearCookie("__session", {
			domain: localEnvironment ? undefined : ".wixonic.fr",
			httpOnly: true,
			secure: !localEnvironment,
			sameSite: localEnvironment ? "lax" : "none"
		});

		try {
			const decoded = await adminAuth.verifySessionCookie(sessionCookie);
			await adminAuth.revokeRefreshTokens(decoded.uid);
			res.status(204).end();
		} catch (error) {
			req.logger.warn("Failed to revoke refresh tokens:", error);
			res.status(500).end();
		}
	});

router.post(["/join", "/join/"], async (req, res) => {
	const { email, password, confirm } = req.body;

	if (!email || !password || !confirm) {
		req.logger.warn("Missing email, password or password confirmation");
		return res.status(400).json({
			error: "Missing email, password or password confirmation"
		});
	}

	if (password != confirm) {
		req.logger.warn("Password and confirmation do not match");
		return res.status(400).json({
			error: "Password and confirmation do not match",
		});
	}

	try {
		const credentials = await clientAuthLibrary.createUserWithEmailAndPassword(clientAuth, email, password);
		const displayName = credentials.user.email == "internal@wixonic.fr" ? "Admin" : "user_" + credentials.user.uid.slice(-16, -1);

		if (credentials.user.email == "internal@wixonic.fr") {
			await adminAuth.setCustomUserClaims(credentials.user.uid, {
				admin: true
			});
		}

		await adminAuth.updateUser(credentials.user.uid, { displayName });
		await adminFirestore.collection("users").doc(credentials.user.uid).set({
			displayName,
			createdAt: new Date().toISOString()
		});

		await sendVerificationEmail(email);

		const idToken = await credentials.user.getIdToken();
		const expiresIn = 2 * 7 * 24 * 60 * 60 * 1000; // 2 weeks
		const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

		res.cookie("__session", sessionCookie, {
			domain: localEnvironment ? undefined : ".wixonic.fr",
			maxAge: expiresIn,
			httpOnly: true,
			secure: !localEnvironment,
			sameSite: localEnvironment ? "lax" : "none"
		});

		res.status(204).end();
	} catch (error) {
		req.logger.warn(error);
		res.status(400).json({
			error: "Failed to create account"
		});
	}
});

router.delete(["/delete", "/delete/"], async (req, res) => {
	const sessionCookie = req.cookies.__session;

	if (!sessionCookie) {
		req.logger.warn("Session cookie is missing");
		return res.status(401).json({
			error: "Session cookie is missing"
		});
	}

	try {
		const decoded = await adminAuth.verifySessionCookie(sessionCookie);

		await adminFirestore.recursiveDelete(adminFirestore.collection("users").doc(decoded.uid));

		await adminAuth.revokeRefreshTokens(decoded.uid);
		await adminAuth.deleteUser(decoded.uid);

		res.clearCookie("__session", {
			path: "/",
			domain: localEnvironment ? undefined : ".wixonic.fr",
			httpOnly: true,
			secure: !localEnvironment,
			sameSite: localEnvironment ? "lax" : "none"
		});

		res.status(204).end();
	} catch (error) {
		req.logger.warn("Failed to delete account:", error);
		res.status(500).end();
	}
});

router.post(["/verify", "/verify/"], async (req, res) => {
	const sessionCookie = req.cookies.__session;

	if (!sessionCookie) {
		req.logger.warn("Session cookie is missing");
		return res.status(401).json({
			error: "Session cookie is missing"
		});
	}

	try {
		const user = await adminAuth.verifySessionCookie(sessionCookie, true);
		const newEmail = req.query.email ? decodeURIComponent(req.query.email) : null;

		if (newEmail) await sendVerificationEmail(user.email, newEmail);
		else if (user.email_verified) throw "Email already verified";
		else await sendVerificationEmail(user.email);
		res.status(204).end();
	} catch (error) {
		req.logger.warn("Failed to verify token:", error);
		return res.status(403).json({
			error: "Invalid or expired token"
		});
	}
});

module.exports = router;