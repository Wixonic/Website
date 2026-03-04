import esbuild from "esbuild";
import * as fsp from "fs/promises";
import path from "path";
import htmlMinifier from "html-minifier";

export const config = {
	htmlTemplateEngine: "njk",
};

export default (config) => {
	const isEmulator = process.env.dev === "true";
	const isClear = process.env.clear === "true";

	const pathConfig = isEmulator
		? {
				root: "http://localhost:2005",
				assets: "http://localhost:2010",
				redirects: "http://localhost:2011",
				server: "http://localhost:999",
			}
		: {
				root: "https://wixonic.fr",
				assets: "https://assets.wixonic.fr",
				redirects: "https://go.wixonic.fr",
				server: "https://server.wixonic.fr",
			};

	config.addGlobalData("path", pathConfig);
	config.addGlobalData("eleventyComputed", {
		permalink: (data) => {
			if (data.permalink) return data.permalink;

			const fallbackStem = data.page.filePathStem || "";
			if (fallbackStem.endsWith("/main")) {
				return fallbackStem + ".html";
			}
			return fallbackStem + "/main.html";
		},
	});
	config.setOutputDirectory("../build/");

	config.on("eleventy.before", async () => {
		const nunjucksPathPlugin = {
			name: "nunjucks-path",
			setup(build) {
				build.onLoad({ filter: /\.(css|js)$/ }, async (args) => {
					let source = await fsp.readFile(args.path, "utf8");

					source = source.replace(
						/\{\{\s*path\.(\w+)\s*\}\}/g,
						(match, key) => {
							if (pathConfig[key]) {
								return pathConfig[key];
							}

							console.warn(
								`[Build] Unknown path key "{{ path.${key} }}" in ${args.path}`,
							);
							return match;
						},
					);

					return {
						contents: source,
						loader: args.path.endsWith(".css") ? "css" : "js",
					};
				});
			},
		};

		const resolveRootPlugin = {
			name: "resolve-root",
			setup(build) {
				build.onResolve({ filter: /^\// }, (args) => {
					const fullPath = path.join(
						process.cwd(),
						args.path.replace(/^\//, "").replace(/^src\//, ""),
					);
					return { path: fullPath, external: false };
				});
			},
		};

		console.log("[Esbuild] Starting src build...");

		await esbuild.build({
			entryPoints: [
				"./main.js",
				"./main.css",
				"./404.js",
				"./script/**/*.js",
				"./style/**/*.css",
			],
			outdir: "../build",
			bundle: !isClear,
			minify: !isClear,
			sourcemap: !isClear,
			splitting: !isClear,
			format: "esm",
			target: ["es2020"],
			outbase: ".",
			plugins: [nunjucksPathPlugin, resolveRootPlugin],
		});

		console.log(`[Esbuild] Build completed.`);
	});

	config.addFilter("cleanPath", (filePath) => {
		if (!filePath) return pathConfig.root;
		return pathConfig.root + filePath;
	});

	config.addFilter("json", (content) => JSON.stringify(content));

	if (!isClear) {
		config.addTransform("htmlmin", function (content) {
			if ((this.page.outputPath || "").endsWith(".html")) {
				let minified = htmlMinifier.minify(content, {
					useShortDoctype: true,
					removeComments: true,
					collapseWhitespace: true,
				});
				return minified;
			}
			return content;
		});
	}
};
