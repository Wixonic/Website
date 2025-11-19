const isEmulator = location.href.includes("localhost:");

const path = isEmulator ? {
	root: new URL("http://localhost:2005"),
	accounts: new URL("http://localhost:2010"),
	admin: new URL("http://localhost:2011"),
	assets: new URL("http://localhost:2012"),
	kcmaths: new URL("http://localhost:2013"),
	git: new URL("http://localhost:2014"),
	redirects: new URL("http://localhost:2015"),
	server: new URL("http://localhost:999")
} : {
	root: new URL("https://wixonic.fr"),
	accounts: new URL("https://accounts.wixonic.fr"),
	admin: new URL("https://admin.wixonic.fr"),
	assets: new URL("https://assets.wixonic.fr"),
	kcmaths: new URL("https://kcmaths.wixonic.fr"),
	git: new URL("https://git.wixonic.fr"),
	redirects: new URL("https://go.wixonic.fr"),
	server: new URL("https://server.wixonic.fr")
};

const emulator = {
	auth: "http://localhost:2001",
	firestore: {
		domain: "localhost",
		port: 2002
	}
};

/**
 * Combine paths, similar to {@link https://nodejs.org/api/path.html#pathjoinpaths Node.js path.join} method
 * @param  {...string} parts 
 * @returns {string}
 */
const joinPath = (...parts) => {
	return parts.map((part, index) => {
		part = String(part);

		if (index === 0) return part.trim().replace(/[\/]*$/g, "");
		else return part.trim().replace(/^[\/]*|[\/]*$/g, "");
	}).filter(Boolean).join("/");
};

/**
 * @param {URL} url
 */
const updateURL = (url) => {
	try {
		if (history.pushState) history.pushState({ path: url.pathname }, "", url);
	} catch (e) {
		console.warn("Failed to update URL:", e);
	}
};

export {
	path,
	emulator,
	joinPath,
	updateURL
};