export const config = {
	htmlTemplateEngine: "njk"
};

export default (config) => {
	config.setOutputDirectory("../build");
	config.addPassthroughCopy("./websites/lib/");
	config.addPassthroughCopy("./websites/**/*.css");
	config.addPassthroughCopy("./websites/**/*.js");

	config.addFilter("cleanPath", (filePath) => {
		if (!filePath) return "https://wixonic.fr";

		try {
			const target = filePath.match(/\/websites\/([^\/]+)/)[1];
			const origin = {
				"root": "https://wixonic.fr",
				"accounts": "https://accounts.wixonic.fr",
				"admin": "https://admin.wixonic.fr",
				"assets": "https://assets.wixonic.fr",
				"kcmaths": "https://kcmaths.wixonic.fr"
			};
			const cleanPath = filePath.replace(/\/websites\/[^\/]+\/?/, "/");

			return origin[target] + cleanPath;
		} catch (e) {
			console.warn(`Failed to clean path for "${filePath}": `, e.message);
			return "https://wixonic.fr";
		}
	});
};