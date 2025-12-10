export const config = {
	htmlTemplateEngine: "njk"
};

export default (config) => {
	const isEmulator = process.env.dev == "true";

	const pathConfig = isEmulator ? {
		root: "http://localhost:2005",
		accounts: "http://localhost:2010",
		admin: "http://localhost:2011",
		assets: "http://localhost:2012",
		kcmaths: "http://localhost:2013",
		git: "http://localhost:2014",
		redirects: "http://localhost:2015",
		server: "http://localhost:999"
	} : {
		root: "https://wixonic.fr",
		accounts: "https://accounts.wixonic.fr",
		admin: "https://admin.wixonic.fr",
		assets: "https://assets.wixonic.fr",
		kcmaths: "https://kcmaths.wixonic.fr",
		git: "https://git.wixonic.fr",
		redirects: "https://go.wixonic.fr",
		server: "https://server.wixonic.fr"
	};

	config.addGlobalData("path", pathConfig);

	config.setOutputDirectory("../build");
	config.addPassthroughCopy("./websites/lib/");
	config.addPassthroughCopy("./websites/**/*.css");
	config.addPassthroughCopy("./websites/**/*.js");

	config.addFilter("cleanPath", (filePath) => {
		if (!filePath) return pathConfig.root;

		try {
			const target = filePath.match(/\/websites\/([^\/]+)/)[1];
			const origin = {
				"root": pathConfig.root,
				"accounts": pathConfig.accounts,
				"admin": pathConfig.admin,
				"assets": pathConfig.assets,
				"kcmaths": pathConfig.kcmaths,
				"git": pathConfig.git,
				"redirects": pathConfig.redirects,
				"server": pathConfig.server
			};
			const cleanPath = filePath.replace(/\/websites\/[^\/]+\/?/, "/");

			return origin[target] + cleanPath;
		} catch (e) {
			console.warn(`Failed to clean path for "${filePath}": `, e.message);
			return pathConfig.root;
		}
	});

	config.addFilter("json", (content) => JSON.stringify(content));
};