const path = {
	root: new URL("https://wixonic.fr"),
	accounts: new URL("https://accounts.wixonic.fr"),
	admin: new URL("https://admin.wixonic.fr"),
	assets: new URL("https://assets.wixonic.fr"),
	discord: new URL("https://discord.wixonic.fr"),
	redirects: new URL("https://redirects.wixonic.fr"),
	functions: new URL("https://functions.wixonic.fr"),

	local: {
		root: new URL("http://localhost:2005"),
		accounts: new URL("http://localhost:2010"),
		admin: new URL("http://localhost:2011"),
		assets: new URL("http://localhost:2012"),
		discord: new URL("http://localhost:2013"),
		redirects: new URL("http://localhost:2014"),
		functions: new URL("http://localhost:2015")
	}
};

const emulator = {
	auth: "http://localhost:2001",
	firestore: {
		domain: "localhost",
		port: 2002
	},
	storage: {
		domain: "localhost",
		port: 2003
	},
	functions: {
		domain: "localhost",
		port: 2004
	}
};

export {
	path,
	emulator
};