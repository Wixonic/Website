import esbuild from "esbuild";
import * as fsp from "fs/promises";
import { glob } from "glob";
import path from "path";

export const config = {
	htmlTemplateEngine: "njk"
};

export default (config) => {
	const isEmulator = process.env.dev === "true";
	const isClear = process.env.clear === "true";

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
	config.addGlobalData("eleventyComputed", {
		permalink: (data) => {
			if (data.permalink) return data.permalink;
			const stem = data.page.filePathStem;
			if (stem && stem.startsWith("/websites/")) {
				const newStem = stem.replace(/^\/websites\//, "/");
				if (newStem.endsWith("/index")) {
					return newStem + ".html";
				}
				return newStem + "/index.html";
			}

			const fallbackStem = data.page.filePathStem || "";
			if (fallbackStem.endsWith("/index")) {
				return fallbackStem + ".html";
			}
			return fallbackStem + "/index.html";
		}
	});
	config.setOutputDirectory("../build/");

	config.on("eleventy.before", async () => {
		const nunjucksPathPlugin = {
			name: "nunjucks-path",
			setup(build) {
				build.onLoad({ filter: /\.(css|js)$/ }, async (args) => {
					let source = await fsp.readFile(args.path, "utf8");

					source = source.replace(/\{\{\s*path\.(\w+)\s*\}\}/g, (match, key) => {
						if (pathConfig[key]) {
							return pathConfig[key];
						}

						console.warn(`[Build] Unknown path key "{{ path.${key} }}" in ${args.path}`);
						return match;
					});

					return {
						contents: source,
						loader: args.path.endsWith(".css") ? "css" : "js"
					};
				});
			}
		};

		const resolveRootPlugin = {
			name: "resolve-root",
			setup(build) {
				build.onResolve({ filter: /^\// }, args => {
					return { path: path.join(process.cwd(), args.path) };
				});
			}
		};

		console.log("[Esbuild] Starting isolated builds...");

		const websitesDir = path.join(process.cwd(), "websites");
		const sites = (await fsp.readdir(websitesDir, { withFileTypes: true }))
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

		const buildTargets = [...sites.map((s) => `websites/${s}`)];

		const buildPromises = buildTargets.map(async (target) => {
			const entryPoints = await glob(`./${target}/**/*.{js,css}`, { ignore: "**/_*", follow: true });

			if (entryPoints.length === 0) return;

			await esbuild.build({
				entryPoints,
				outdir: `../build/${target.replace(/^websites\//, "")}`,
				bundle: !isClear,
				minify: !isClear,
				sourcemap: !isClear,
				splitting: !isClear,
				format: "esm",
				target: ["es2020"],
				outbase: `./${target}`,
				plugins: [nunjucksPathPlugin, resolveRootPlugin]
			});
		});

		console.log("[Assets] Copying static assets...");
		const assetPromises = sites.map(async (site) => {
			const files = await glob(`./websites/${site}/**/*`, {
				ignore: ["**/*.{js,css,html,njk}", "**/_*", "**/.DS_Store", "lib/**"],
				follow: true,
				nodir: true
			});

			for (const file of files) {
				const destRelative = file.replace(/^\.?\/?websites\//, "");
				const dest = path.join("../build", destRelative);
				await fsp.mkdir(path.dirname(dest), { recursive: true });
				await fsp.copyFile(file, dest);
			}
		});

		await Promise.all([...buildPromises, ...assetPromises]);
		console.log(`[Esbuild] ${buildTargets.length} sites built successfully.`);
	});

	config.addFilter("cleanPath", (filePath) => {
		if (!filePath) return pathConfig.root;

		try {
			const match = filePath.match(/\/websites\/([^\/]+)/);
			if (!match) return pathConfig.root;
			const target = match[1];
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