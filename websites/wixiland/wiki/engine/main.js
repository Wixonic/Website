const fs = require("fs");
const path = require("path");

const config = require("./config.js");

const indexPath = path.join(config.htmlPath, "index.json");
const template = fs.readFileSync("./template.html", "utf-8");

const index = {
	assets: [],
	pages: []
};

/**
 * @param {string} text
 * @param {string} separator
 * @returns {string}
 */
const extractPart = (text, separator) => text.includes(separator) ? text.slice(text.indexOf(separator) + separator.length, text.lastIndexOf(separator)).trim() : "";

/**
 * @param {string} path
 * @returns {string}
 */
const compilePath = (path) => {
	if (path.startsWith("WixiLand-Wiki/assets/")) return path.replace("WixiLand-Wiki/assets/", "/wiki/assets/");
	if (path.startsWith("WixiLand-Wiki/wiki/")) return path.replace("WixiLand-Wiki/wiki/", "/wiki/pages/");

	return path;
};

const pathStatus = (path, type) => {
	path = compilePath(path);

	switch (type) {
		case "asset":
			for (const asset of index.assets) {
				if (asset.path == path.replace("/wiki/assets/", "")) return true;
			}
			break;

		case "page":
			for (const page of index.pages) {
				if (page.path == path.replace("/wiki/pages/", "")) return true;
			}
			break;
	}

	return false;
};

/**
 * @param {string} markdown 
 */
const compileMarkdown = (markdown) => {
	let html = markdown;

	const replacements = [
		[/^(#{1,3})\s(.+)$/gm, (_, hashes, content) => `<h${hashes.length}>${content}</h${hashes.length}>`], // Titles
		[/(\*\*\*|___)(.+?)\1/g, "<b><i>$2</i></b>"], // Bold and italic
		[/(\*\*|__)(.+?)\1/g, "<b>$2</b>"], // Bold
		[/(\*|_)(.+?)\1/g, "<i>$2</i>"], // Italic
		[/!\[\[([^|]+)\|([^\]]+)\]\]/g, (_, path, alt) => { // Assets
			console.log("Uncompiled asset:", path);
			return "";
		}],
		[/\[\[([^|]+)\|([^\]]+)\]\]/g, (_, path, label) => `<a valid="${pathStatus(path, "page")}" href="${compilePath(path)}">${label}</a>`], // Pages
		[/!\[([^\]]+)\]\(([^)]+)\)/g, (_, alt, url) => {
			console.log("Uncompiled external asset:", url);
			return "";
		}], // External assets
		[/\[([^\]]+)\]\(([^)]+)\)/g, (_, content, url) => `<a href="${url}">${content}</a>`], // External links
		[/^(?:---|\*\*\*|___)\s*$/gm, "<hr />"], // Separators
		[/((?:^[\*\-\+]\s+.+\n?)+)/gm, (match) => `<ul>${match.trim().split("\n").map((line) => line.replace(/^[\*\-\+]\s+/, "<li>") + "</li>").join("")}</ul>`], // Lists
	];

	for (const replacement of replacements) html = html.replace(replacement[0], replacement[1]);
	return html;
};

const compileInfobox = (infobox) => {


	return "";
};

const clean = async () => {
	if (fs.existsSync(config.htmlPath)) fs.rmSync(config.htmlPath, { recursive: true });
	fs.mkdirSync(config.htmlPath, { recursive: true });
};

const buildIndex = async () => {
	const forbiddenFiles = [".DS_Store"];

	for (const file of fs.readdirSync(path.join(config.wikiPath, "wiki"))) {
		if (!forbiddenFiles.includes(file)) {
			const filePath = path.join(config.wikiPath, "wiki", file);
			const fileName = file.slice(0, -3);
			const markdown = fs.readFileSync(filePath, "utf-8");

			const metadata = JSON.parse(extractPart(markdown, config.separators.metadata));

			if (metadata.active) {
				index.pages.push({
					title: metadata.title,
					summary: metadata.summary,
					path: fileName
				});
			} else console.log(`Page "${fileName}" disabled.`);
		}
	}

	for (const folder of fs.readdirSync(path.join(config.wikiPath, "assets"))) {
		if (!forbiddenFiles.includes(folder)) {
			const folderPath = path.join(config.wikiPath, "assets", folder);
			const info = fs.readFileSync(path.join(folderPath, "info.json"), "utf-8");

			// console.log(info);

			index.assets.push({
				path: folder
			});
		}
	}

	fs.writeFileSync(indexPath, JSON.stringify(index));

	console.log(`Indexed ${index.assets.length} assets and ${index.pages.length} pages.`);
};

const buildAssets = async () => {
	for (const asset of index.assets) {
		const folderPath = path.join(config.htmlPath, "assets", asset.path);
		fs.mkdirSync(folderPath, { recursive: true });
		console.log(`Built asset ${asset.path}.`);
	}
};

const buildWiki = async () => {
	for (const page of index.pages) {
		const filePath = path.join(config.wikiPath, "wiki", `${page.path}.md`);
		const markdown = fs.readFileSync(filePath, "utf-8");
		const infobox = extractPart(markdown, config.separators.infobox);
		const parsedInfobox = JSON.parse(infobox.length > 0 ? infobox : "{}");
		const content = extractPart(markdown, config.separators.content);

		const htmlFolder = path.join(config.htmlPath, page.path);
		fs.mkdirSync(htmlFolder, { recursive: true });

		const html = compileMarkdown(template
			.split("{{CONTENT}}").join(compileInfobox(parsedInfobox) + `<page><h1>{{TITLE}}</h1>${content}</page>`)
			.split("{{TITLE}}").join(page.title)
			.split("{{SUMMARY}}").join(page.summary)
			.split("{{FILENAME}}").join(page.path));
		fs.writeFileSync(path.join(htmlFolder, "index.html"), html, "utf-8");

		console.log(`Built page ${page.path}.`);
	}
};

(async () => {
	console.log("Cleaning...");
	await clean();
	console.log("Cleaned.");

	if (process.env.CLEAN != "true") {
		console.log("Building index...");
		await buildIndex();
		console.log("Index built.");

		console.log("Building assets...");
		await buildAssets();
		console.log("Assets built.");

		console.log("Building wiki...");
		await buildWiki();
		console.log("Wiki built.");
	}
})();