import esbuild from "esbuild";
import * as fsp from "fs/promises";
import path from "path";
import htmlMinifier from "html-minifier";
import { generateAndCheckIndexes } from "./indexer.js";

export const config = {
	htmlTemplateEngine: "njk"
};

const findFiles = async (directory, extensions) => {
	const results = [];

	try {
		const entries = await fsp.readdir(directory, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(directory, entry.name);

			if (entry.isDirectory()) results.push(...await findFiles(fullPath, extensions));
			else if (extensions.some((extension) => entry.name.endsWith(extension))) results.push(fullPath);
		}
	} catch (error) { }

	return results;
};

const createPathTokenPlugin = (pathConfig) => ({
	name: "replace-path-tokens",
	setup(build) {
		build.onLoad({ filter: /\.(css|js)$/ }, async (args) => {
			const source = await fsp.readFile(args.path, "utf8");
			const contents = source.replace(/{{\s*path\.([\w]+)\s*}}/g, (match, key) => {
				if (!pathConfig[key]) return match;

				return pathConfig[key];
			});

			return {
				contents,
				loader: args.path.endsWith(".css") ? "css" : "js"
			};
		});
	}
});

export default (config) => {
	const isEmulator = process.env.dev === "true";
	const isClear = process.env.clear === "true";

	const pathConfig = isEmulator ? {
		root: "http://localhost:2005",
		accounts: "http://localhost:2010",
		admin: "http://localhost:2011",
		assets: "http://localhost:2012",
		functions: "http://localhost:2013",
		knowledge: "http://localhost:2014",
		redirects: "http://localhost:2015",
		server: "http://localhost:999",
		firebase: {
			auth: "http://localhost:2001",
			firestore: { domain: "localhost", port: 2002 },
			storage: { domain: "localhost", port: 2003 },
			functions: { domain: "localhost", port: 2004 }
		}
	} : {
		root: "https://wixonic.fr",
		accounts: "https://accounts.wixonic.fr",
		admin: "https://admin.wixonic.fr",
		assets: "https://assets.wixonic.fr",
		functions: "https://functions.wixonic.fr",
		knowledge: "https://knowledge.wixonic.fr",
		redirects: "https://go.wixonic.fr",
		server: "https://server.wixonic.fr"
	};

	const esbuildOptions = {
		bundle: !isClear,
		minify: !isClear,
		sourcemap: isEmulator,
		splitting: !isClear,
		format: "esm",
		target: ["es2020"],
		plugins: [createPathTokenPlugin(pathConfig)]
	};

	// --- Directories ---
	config.setInputDirectory("websites/");
	config.setOutputDirectory("build/");
	config.setIncludesDirectory("../src/njk/");
	config.setLayoutsDirectory("../src/layout/");

	// --- Templates ---
	config.setTemplateFormats(["njk"]);

	// --- Passthrough ---
	for (const extension of [
		"svg", "png", "webp",
		"webm", "mov",
		"mp3",
		"woff2",
		"json"
	]) config.addPassthroughCopy(`websites/**/*.${extension}`);

	config.addPassthroughCopy("websites/**/robots.txt");

	// --- Global data ---
	config.addGlobalData("path", pathConfig);

	// --- Filters ---
	config.addFilter("json", (value) => JSON.stringify(value));

	// --- ESBuild ---
	config.on("eleventy.before", async () => {
		await generateAndCheckIndexes();
		await fsp.rm("websites/.generated", { recursive: true, force: true });
		await fsp.mkdir("websites/.generated", { recursive: true });
		await fsp.copyFile("src/404.njk", "websites/.generated/404.njk");

		console.log("[ESBuild] Starting build...");
		const websites = (await fsp.readdir("websites", { withFileTypes: true }))
			.filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
			.map((entry) => entry.name);

		for (const siteName of websites) {
			const siteDirectory = path.resolve(`websites/${siteName}`);

			// Shared src/ entry points
			await esbuild.build({
				...esbuildOptions,
				entryPoints: [
					"src/main.css",
					"src/main.js",
					"src/script/**/*.js",
					"src/style/**/*.css"
				],
				outdir: `build/${siteName}`,
				outbase: "src"
			});

			// Site-specific entry points
			const siteEntryPoints = await findFiles(siteDirectory, [".js", ".css"]);
			if (siteEntryPoints.length > 0) {
				await esbuild.build({
					...esbuildOptions,
					entryPoints: siteEntryPoints,
					outdir: `build/${siteName}`,
					outbase: siteDirectory
				});
			}
		}

		await esbuild.build({
			...esbuildOptions,
			entryPoints: ["src/404.css", "src/404.js"],
			outdir: "build/",
			outbase: "src"
		});

		console.log("[ESBuild] Build completed.");
	});

	config.on("eleventy.after", async () => {
		const websites = (await fsp.readdir("websites", { withFileTypes: true }))
			.filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
			.map((entry) => entry.name);

		for (const siteName of websites) {
			await fsp.copyFile("build/.generated/404/index.html", `build/${siteName}/404.html`);
			await fsp.copyFile("build/404.css", `build/${siteName}/404.css`);
			await fsp.copyFile("build/404.js", `build/${siteName}/404.js`);
		}

		await fsp.rm("websites/.generated", { recursive: true, force: true });
	});

	// --- HTML minification ---
	if (!isClear) {
		config.addTransform("html-minifier", (content) => {
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