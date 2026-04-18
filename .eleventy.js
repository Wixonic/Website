import esbuild from "esbuild";
import * as fsp from "fs/promises";
import path from "path";
import htmlMinifier from "html-minifier";
import { generateAndCheckIndexes } from "./indexer.js";

export const config = {
	htmlTemplateEngine: "njk",
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
		sourcemap: isEmulator,
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
	for (const ext of ["svg", "png", "webp", "webm", "mov", "mp3", "woff2", "json"]) {
		config.addPassthroughCopy(`websites/**/*.${ext}`);
	}

	config.addPassthroughCopy("websites/**/robots.txt");

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

	config.on("eleventy.after", async () => {
		console.log("[Auto-SEO] Starting SEO generation...");

		const applySEO = (html, meta) => {
			let output = html;
			if (meta.title) output = output.replace(/<title>.*?<\/title>/i, `<title>${meta.title}</title>`).replace(/<meta property="og:title" content="[^"]*" \/>/i, `<meta property="og:title" content="${meta.title}" />`);
			if (meta.description) output = output.replace(/<meta name="description" content="[^"]*" \/>/i, `<meta name="description" content="${meta.description}" />`).replace(/<meta property="og:description" content="[^"]*" \/>/i, `<meta property="og:description" content="${meta.description}" />`);
			if (meta.url) output = output.replace(/<meta property="og:url" content="[^"]*" \/>/i, `<meta property="og:url" content="${meta.url}" />`);

			let ogMedia = "";
			if (meta.image) ogMedia += `<meta property="og:image" content="${meta.image}" />`;
			if (meta.video) ogMedia += `<meta property="og:video" content="${meta.video}" /><meta property="og:video:type" content="video/mp4" />`;
			if (meta.audio) ogMedia += `<meta property="og:audio" content="${meta.audio}" />`;

			if (ogMedia) output = output.replace(/<\/head>/i, `${ogMedia}</head>`);

			return output;
		};

		try {
			const websites = await fsp.readdir("build", { withFileTypes: true });

			for (const site of websites) {
				if (!site.isDirectory()) continue;

				try {
					const mainHtmlPath = path.join("build", site.name, "main.html");
					const mainHtml = await fsp.readFile(mainHtmlPath, "utf8");

					if (site.name === "assets") {
						try {
							const indexJsonPath = path.join("build", "assets", "index.json");
							const masterIndexStr = await fsp.readFile(indexJsonPath, "utf8");
							const masterIndex = JSON.parse(masterIndexStr);

							for (const [virtualPath, rawPath] of Object.entries(masterIndex)) {
								const itemIndexJsonPath = path.join("build", "assets", rawPath);

								try {
									const itemIndexStr = await fsp.readFile(itemIndexJsonPath, "utf8");
									const itemIndex = JSON.parse(itemIndexStr);

									const publicUrl = `${pathConfig.assets}${virtualPath}`;
									const rawUrl = `${pathConfig.assets}${virtualPath.replace(/^\//, "/raw/")}`;

									const meta = {
										title: `${itemIndex.name} - Wixonic Assets`,
										description: itemIndex.description || "",
										url: publicUrl
									};

									if (["image", "font"].includes(itemIndex.type)) meta.image = rawUrl;
									else if (itemIndex.type === "video") meta.video = rawUrl;
									else if (itemIndex.type === "audio") meta.audio = rawUrl;

									const targetDir = path.join("build", "assets", virtualPath);
									await fsp.mkdir(targetDir, { recursive: true });
									await fsp.writeFile(path.join(targetDir, "index.html"), applySEO(mainHtml, meta));
								} catch (error) {
									console.warn(`[Auto-SEO] Could not process asset: ${itemIndexJsonPath}`);
								}
							}
						} catch (error) {
							console.warn(`[Auto-SEO] No assets master index found.`);
						}
					} else {
						const siteDir = path.join("build", site.name);
						const allJsFiles = await findFiles(siteDir, [".js"]);

						for (const jsFile of allJsFiles) {
							if (!jsFile.endsWith("index.js")) continue;

							try {
								const source = await fsp.readFile(jsFile, "utf8");
								const titleMatch = source.match(/title:\s*["']([^"']+)["']/);
								const descMatch = source.match(/description:\s*["']([^"']+)["']/);

								if (titleMatch || descMatch) {
									let virtualPath = jsFile.replace(siteDir, "").replace(/index\.js$/, "");
									// Normalize Windows paths
									virtualPath = virtualPath.split(path.sep).join("/");

									const meta = {
										title: titleMatch ? titleMatch[1] : undefined,
										description: descMatch ? descMatch[1] : undefined,
										url: `${pathConfig[site.name] || pathConfig.root}${virtualPath}`
									};

									const targetDir = path.dirname(jsFile);
									await fsp.mkdir(targetDir, { recursive: true });
									await fsp.writeFile(path.join(targetDir, "index.html"), applySEO(mainHtml, meta));
								}
							} catch (error) {
								console.warn(`[Auto-SEO] Could not process JS file: ${jsFile}`);
							}
						}
					}
				} catch (error) {
					// Silently ignore folders without main.html
				}
			}
		} catch (error) {
			console.error(`[Auto-SEO] Fatal error during generation: ${error}`);
		}

		console.log("[Auto-SEO] Generation completed.");
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