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
			const contents = source.replace(/{{\s*path\.([\w.]+)\s*}}/g, (match, keyPath) => {
				const value = keyPath.split(".").reduce((currentValue, key) => currentValue?.[key], pathConfig);

				if (value === undefined) return match;

				return value;
			});

			return {
				contents,
				loader: args.path.endsWith(".css") ? "css" : "js"
			};
		});
	}
});

const resolveAbsoluteCssPlugin = {
	name: "resolve-absolute-css",
	setup(build) {
		build.onResolve({ filter: /^\// }, (args) => {
			if (args.kind !== "import-rule") return;

			const srcPath = path.resolve("src");
			if (args.importer.startsWith(srcPath)) return { path: path.resolve(srcPath, args.path.slice(1)) };

			const websitesPath = path.resolve("websites");
			if (args.importer.startsWith(websitesPath)) {
				const siteName = path.relative(websitesPath, args.importer).split(path.sep)[0];
				return { path: path.resolve(websitesPath, siteName, args.path.slice(1)) };
			}
		});
	}
};

export default (config) => {
	const isEmulator = process.env.dev === "true";
	const isClear = process.env.clear === "true";

	const pathConfig = isEmulator ? {
		root: "http://127.0.0.1:2005",
		assets: "http://127.0.0.1:2010",
		onion: "http://127.0.0.1:2011",
		links: "http://127.0.0.1:2012",
		status: "http://127.0.0.1:2013",

		server: "http://127.0.0.1:999",

		github: {
			username: "Wixonic"
		},

		firebase: {
			version: "12.13.0",
			isEmulator: true,
			firestore: { domain: "127.0.0.1", port: 2002 }
		}
	} : {
		root: "https://wixonic.fr",
		assets: "https://assets.wixonic.fr",
		onion: "https://onion.wixonic.fr",
		links: "https://go.wixonic.fr",
		status: "https://status.wixonic.fr",

		server: "https://server.wixonic.fr",

		github: {
			username: "Wixonic"
		},

		firebase: {
			version: "12.13.0",
			isEmulator: false
		}
	};

	const esbuildOptions = {
		bundle: !isClear,
		minify: !isClear,
		sourcemap: isEmulator,
		splitting: !isClear,
		format: "esm",
		target: ["es2020"],
		plugins: [
			createPathTokenPlugin(pathConfig),
			resolveAbsoluteCssPlugin
		]
	};
	if (!isClear) esbuildOptions.external = ["three"];

	// --- Directories ---
	config.setInputDirectory("websites/");
	config.setOutputDirectory("build/");
	config.setIncludesDirectory("../src/njk/");
	config.setLayoutsDirectory("../src/layout/");

	// --- Templates ---
	config.setTemplateFormats(["njk"]);

	// --- Passthrough ---
	for (const extension of [
		"svg", "png", "webp", "ico",
		"webm", "mov",
		"mp3",
		"woff2",
		"json",
		"glb",
		"xml",
		"zip"
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
		config.addTransform("html-minifier", (content, outputPath) => {
			if ((outputPath || "").endsWith(".html")) {
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