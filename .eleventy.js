import esbuild from "esbuild";
import * as fsp from "fs/promises";
import path from "path";
import htmlMinifier from "html-minifier";
import { generateAndCheckIndexes } from "./indexer.js";

export const config = {
	htmlTemplateEngine: "njk",
};

const findFiles = async (dir, extensions) => {
	const results = [];

	try {
		const entries = await fsp.readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);

			if (entry.isDirectory()) {
				results.push(...await findFiles(fullPath, extensions));
			} else if (extensions.some(ext => entry.name.endsWith(ext))) {
				results.push(fullPath);
			}
		}
	} catch (error) { }

	return results;
};

export default (config) => {
	const isEmulator = process.env.dev === "true";
	const isClear = process.env.clear === "true";

	const pathConfig = isEmulator ? {
		root: "http://localhost:2005",
		assets: "http://localhost:2010",
		redirects: "http://localhost:2011",
		server: "http://localhost:999",
	} : {
		root: "https://wixonic.fr",
		assets: "https://assets.wixonic.fr",
		redirects: "https://go.wixonic.fr",
		server: "https://server.wixonic.fr",
	};

	const esbuildOptions = {
		bundle: !isClear,
		minify: !isClear,
		sourcemap: !isClear,
		splitting: !isClear,
		format: "esm",
		target: ["es2020"],
	};

	// --- Directories ---
	config.setInputDirectory("websites/");
	config.setOutputDirectory("build/");
	config.setIncludesDirectory("../src");

	// --- Templates ---
	config.setTemplateFormats(["njk", "html"]);

	// --- Passthrough ---
	for (const ext of ["svg", "png", "webp", "webm", "mov", "mp3", "woff2"]) {
		config.addPassthroughCopy(`websites/**/*.${ext}`);
	}

	// --- Global data ---
	config.addGlobalData("path", pathConfig);
	config.addGlobalData("eleventyComputed", {
		permalink: (data) => {
			if (data.permalink) return data.permalink;

			const fallbackStem = data.page.filePathStem || "";
			if (fallbackStem.endsWith("/main")) return fallbackStem + ".html";
			return fallbackStem + "/main.html";
		}
	});

	// --- Filters ---
	config.addFilter("cleanPath", (filePath) => {
		if (!filePath) return pathConfig.root;
		return pathConfig.root + filePath;
	});

	config.addFilter("json", (content) => JSON.stringify(content));

	// --- Esbuild ---
	config.on("eleventy.before", async () => {
		await generateAndCheckIndexes();
		const cleanPath = {
			name: "clean-path",
			setup(build) {
				build.onLoad({ filter: /\.(css|js)$/ }, async (args) => {
					let source = await fsp.readFile(args.path, "utf8");

					source = source.replace(
						/\{\{\s*path\.(\w+)\s*\}\}/g,
						(match, key) => {
							if (pathConfig[key]) return pathConfig[key];
							console.warn(`[Build] Unknown path key "{{ path.${key} }}" in ${args.path}`);
							return match;
						}
					);

					return {
						contents: source,
						loader: args.path.endsWith(".css") ? "css" : "js"
					};
				});
			}
		};

		const createResolveRootPlugin = (siteDirectory) => ({
			name: "resolve-root",
			setup(build) {
				build.onResolve({ filter: /^\// }, async (args) => {
					if (args.kind === "entry-point") return;

					const relativePath = args.path.replace(/^\//, "").replace(/^src\//, "");

					const sitePath = path.join(siteDirectory, relativePath);
					try {
						await fsp.access(sitePath);
						return {
							path: sitePath,
							external: false
						};
					} catch (error) {
						return {
							path: path.join(process.cwd(), "src", relativePath),
							external: false
						};
					}
				});
			}
		});

		console.log("[Esbuild] Starting build...");

		const websites = await fsp.readdir("websites", { withFileTypes: true });

		for (const site of websites) {
			if (!site.isDirectory()) continue;

			const siteDir = path.resolve(`websites/${site.name}`);
			const plugins = [cleanPath, createResolveRootPlugin(siteDir)];

			// Shared src/ entry points
			await esbuild.build({
				...esbuildOptions,
				entryPoints: [
					"src/main.js",
					"src/main.css",
					"src/404.js",
					"src/script/**/*.js",
					"src/style/**/*.css",
				],
				outdir: `build/${site.name}`,
				outbase: "src",
				plugins
			});

			// Site-specific JS/CSS
			const siteEntryPoints = await findFiles(siteDir, [".js", ".css"]);

			if (siteEntryPoints.length > 0) {
				await esbuild.build({
					...esbuildOptions,
					entryPoints: siteEntryPoints,
					outdir: `build/${site.name}`,
					outbase: siteDir,
					plugins
				});
			}
		}

		console.log("[Esbuild] Build completed.");
	});

	// --- HTML minification ---
	if (!isClear) {
		config.addTransform("htmlmin", function (content) {
			if ((this.page.outputPath || "").endsWith(".html")) {
				return htmlMinifier.minify(content, {
					useShortDoctype: true,
					removeComments: true,
					collapseWhitespace: true
				});
			}

			return content;
		});
	}
};