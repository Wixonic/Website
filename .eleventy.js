import esbuild from "esbuild";
import fs from "fs";
import * as fsp from "fs/promises";
import path from "path";
import htmlMinifier from "html-minifier";
import { generateAndCheckIndexes } from "./indexer.js";

export const config = {
	htmlTemplateEngine: "njk"
};

const getEntryType = async (entry, fullPath) => {
	if (!entry.isSymbolicLink()) return { isDirectory: entry.isDirectory(), isFile: entry.isFile() };

	try {
		const stat = await fsp.stat(fullPath);
		return { isDirectory: stat.isDirectory(), isFile: stat.isFile() };
	} catch (error) {
		return { isDirectory: false, isFile: false };
	}
};

const findFiles = async (directory, extensions, visited = new Set()) => {
	const results = [];

	let realDirectory;
	try {
		realDirectory = await fsp.realpath(directory);
	} catch (error) {
		return results;
	}

	if (visited.has(realDirectory)) return results;
	visited.add(realDirectory);

	try {
		const entries = await fsp.readdir(directory, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(directory, entry.name);
			const { isDirectory, isFile } = await getEntryType(entry, fullPath);

			if (isDirectory) results.push(...await findFiles(fullPath, extensions, visited));
			else if (isFile && extensions.some((extension) => entry.name.endsWith(extension))) results.push(fullPath);
		}
	} catch (error) { }

	return results;
};

const listWebsites = async () => {
	const websites = [];

	try {
		const entries = await fsp.readdir("websites", { withFileTypes: true });

		for (const entry of entries) {
			if (entry.name.startsWith(".")) continue;

			const fullPath = path.join("websites", entry.name);
			const { isDirectory } = await getEntryType(entry, fullPath);

			if (isDirectory) websites.push(entry.name);
		}
	} catch (error) { }

	return websites;
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
				const siteFilePath = path.resolve(websitesPath, siteName, args.path.slice(1));
				if (fs.existsSync(siteFilePath)) return { path: siteFilePath };

				const srcFilePath = path.resolve(srcPath, args.path.slice(1));
				if (fs.existsSync(srcFilePath)) return { path: srcFilePath };

				return { path: siteFilePath };
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
		flow: "http://127.0.0.1:2011",
		links: "http://127.0.0.1:2012",
		status: "http://127.0.0.1:2013",

		server: {
			default: "http://127.0.0.1:1200",
			flow: "http://127.0.0.1:1201"
		}
	} : {
		root: "https://wixonic.fr",
		assets: "https://assets.wixonic.fr",
		flow: "https://flow.wixonic.fr",
		links: "https://go.wixonic.fr",
		status: "https://status.wixonic.fr",

		server: {
			default: "https://server.wixonic.fr",
			flow: "https://api.flow.wixonic.fr"
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
		const websites = await listWebsites();

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
			entryPoints: ["src/404.css"],
			outdir: "build/",
			outbase: "src"
		});

		console.log("[ESBuild] Build completed.");
	});

	config.on("eleventy.after", async () => {
		const websites = await listWebsites();

		for (const siteName of websites) {
			await fsp.copyFile("build/.generated/404/index.html", `build/${siteName}/404.html`);
			await fsp.copyFile("build/404.css", `build/${siteName}/404.css`);
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