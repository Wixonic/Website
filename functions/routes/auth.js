const { randomUUID } = require("crypto");
const express = require("express");
const fs = require("fs");

const { adminAuth, adminFirestore, clientAuth, clientAuthLibrary, localEnvironment } = require("../firebase.js");
const transporter = require("../mailer.js");

const config = require("../config.json");
const request = require("../request.js");

const router = express.Router();

const sendVerificationEmail = async (email, newEmail) => {
	const url = new URL("/verify/", localEnvironment ? "http://localhost:2010" : "https://accounts.wixonic.fr");
	const verificationLink = new URL(newEmail ? await adminAuth.generateVerifyAndChangeEmailLink(email, newEmail) : await adminAuth.generateEmailVerificationLink(email));
	url.searchParams.set("mode", verificationLink.searchParams.get("mode"));
	url.searchParams.set("oobCode", verificationLink.searchParams.get("oobCode"));

	await transporter.sendMail({
		from: "Wixonic Network <contact@wixonic.fr>",
		to: email,
		subject: "Verify your email",
		html: fs.readFileSync("./emails/verify.html", "utf-8")
			.replaceAll("%EMAIL%", email)
			.replaceAll("%VERIFICATION_LINK%", url.toString())
	});
};

router.get(["/token", "/token/"], async (req, res) => {
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
	} catch (e) {
		req.logger.error("Failed to verify token:", e);
		return res.status(403).json({
			error: "Invalid or expired token"
		});
	}
});

router.post(["/session", "/session/"], async (req, res) => {
	try {
		const { idToken } = JSON.parse(req.body);
		const expiresIn = 2 * 7 * 24 * 60 * 60 * 1000;
		const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

		res.cookie("__session", sessionCookie, {
			domain: localEnvironment ? undefined : ".wixonic.fr",
			maxAge: expiresIn,
			httpOnly: true,
			secure: !localEnvironment,
			sameSite: localEnvironment ? "lax" : "none"
		});

		res.status(204).end();
	} catch (e) {
		req.logger.warn("Failed to create session cookie:", e);
		res.status(401).json({ error: "Unauthorized request" });
	}
});

router.post(["/discord", "/discord/"], async (req, res) => {
	try {
		const { discord, wixkey } = req.body;

		if (!discord || !discord.id || !discord.username || !wixkey) {
			return res.status(400).json({
				error: "Missing Discord payload"
			});
		}

		let user;
		try {
			if (wixkey != config.server.wixkey) return res.status(403).end();
			user = await adminAuth.getUserByEmail(`discord_${discord.id}@wixonic.fr`);
			if (!user.customClaims.discord) throw "Invalid User";
		} catch (e) {
			if (e.code == "auth/user-not-found") {
				const displayName = discord.displayName ?? discord.username;
				user = await adminAuth.createUser({
					email: `discord_${discord.id}@wixonic.fr`,
					emailVerified: true,
					displayName,
					password: randomUUID()
				});

				await adminAuth.setCustomUserClaims(user.uid, {
					discord: true
				});

				await adminFirestore.collection("users").doc(user.uid).set({
					displayName,
					createdAt: new Date().toISOString()
				});

				await adminFirestore.collection("users").doc(user.uid).collection("links").doc("discord").set({
					username: discord.username,
					id: discord.id
				});
			} else throw e;
		}

		const customToken = await adminAuth.createCustomToken(user.uid);
		res.status(200).json({
			customToken
		});
	} catch (e) {
		req.logger.warn(e);
		res.status(400).json({
			error: "Failed to authenticate with Discord"
		});
	}
});

router.post(["/revoke", "/revoke/"], async (req, res) => {
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
	} catch (e) {
		req.logger.warn("Failed to revoke refresh tokens:", e);
		res.status(500).end();
	}
});

router.post(["/join", "/join/"], async (req, res) => {
	try {
		const { email, password, confirm } = JSON.parse(req.body);

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
			const displayName = credentials.user.email == "contact@wixonic.fr" ? "Admin" : "user_" + credentials.user.uid.slice(-16, -1);

			if (credentials.user.email == "contact@wixonic.fr") {
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
			const expiresIn = 2 * 7 * 24 * 60 * 60 * 1000;
			const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

			res.cookie("__session", sessionCookie, {
				domain: localEnvironment ? undefined : ".wixonic.fr",
				maxAge: expiresIn,
				httpOnly: true,
				secure: !localEnvironment,
				sameSite: localEnvironment ? "lax" : "none"
			});

			res.status(204).end();
		} catch (e) {
			req.logger.warn(e);
			res.status(400).json({
				error: "Failed to create account"
			});
		}
	} catch (e) {
		req.logger.warn(e);
		res.status(400).json({
			error: `Failed to parse JSON: ${e}`
		});
	}
});

router.post(["/delete", "/delete/"], async (req, res) => {
	const sessionCookie = req.cookies.__session;

	if (!sessionCookie) {
		req.logger.warn("Session cookie is missing");
		return res.status(401).json({
			error: "Session cookie is missing"
		});
	}

	try {
		const decoded = await adminAuth.verifySessionCookie(sessionCookie);

		const discordLink = await adminFirestore.collection("users").doc(decoded.uid).collection("links").doc("discord").get();

		if (discordLink.exists) {
			try {
				const discordData = discordLink.data();
				const response = await request(req.logger, {
					url: new URL("/discord/link/delete/", localEnvironment ? "http://localhost:999" : "https://router.wixonic.fr"),
					method: "POST",
					type: "text",
					auth: config.server.wixkey,
					headers: {
						"Content-Type": "text/plain"
					},
					secure: !localEnvironment,
					body: discordData.id
				});
				if (response.error) throw "Failed: " + response.error;
			} catch (e) {
				req.logger.error("Failed to delete Discord link:", e);
				return res.status(500).end();
			}
		}

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
	} catch (e) {
		req.logger.warn("Failed to delete account:", e);
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
	} catch (e) {
		req.logger.warn("Failed to verify token:", e);
		return res.status(403).json({
			error: "Invalid or expired token"
		});
	}
});

module.exports = router;