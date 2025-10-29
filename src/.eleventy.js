export const config = {
	htmlTemplateEngine: "njk"
};

export default (config) => {
	config.setOutputDirectory("../build");
	config.addPassthroughCopy("./websites/lib/");
	config.addPassthroughCopy("./websites/**/*.css");
	config.addPassthroughCopy("./websites/**/*.js");

	config.addFilter("cleanPathPrefix", (path) => {
		if (!path) return "/";
		return path.replace(/^\/websites\/[^\/]+\/?/, "/");
	});
};