import * as fsp from "fs/promises";
import path from "path";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

const findFiles = async (dir) => {
	const results = [];
	try {
		const entries = await fsp.readdir(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				results.push(...await findFiles(fullPath));
			} else {
				results.push(fullPath);
			}
		}
	} catch (error) { }
	return results;
};

export const generateAndCheckIndexes = async () => {
	console.log("[Indexer] Checking assets indexes...");
	const rawDir = path.join("websites", "assets", "raw");
	const allFiles = await findFiles(rawDir);

	const mediaFiles = allFiles.filter((f) => !f.endsWith(".index.json") && !f.endsWith(".DS_Store"));
	const mediaTypeMap = {
		".mp3": "audio", ".wav": "audio",
		".mov": "video", ".webm": "video", ".mp4": "video",
		".png": "image", ".webp": "image", ".svg": "image", ".jpeg": "image", ".jpg": "image",
		".woff2": "font", ".woff": "font"
	};

	const createBaseIndexData = ({ type, name, copyright, author }) => ({
		ready: false,
		type,
		name,
		description: null,
		copyright,
		download: false,
		link: null,
		author
	});

	const createIndexData = (basicType, { fileContext, probe }) => {
		const { file, ext, fileSize } = fileContext;
		const { tags, duration, container, audio, video } = probe;
		const fileName = path.basename(file);
		const fallbackName = path.basename(file, ext);
		const imageOrFontFormat = ext.replace(".", "");

		if (basicType === "audio") {
			return {
				...createBaseIndexData({
					type: "audio",
					name: tags.title || fallbackName,
					copyright: tags.copyright || null,
					author: tags.artist || null
				}),
				album: tags.album || null,
				genre: tags.genre || null,
				date: tags.date || null,
				encoder: tags.encoder || null,
				duration,
				files: [
					{
						path: fileName,
						size: fileSize,
						format: container,
						codec: audio.codec,
						bitrate: audio.bitrate,
						channels: audio.channels,
						channelLayout: audio.channelLayout,
						sampleRate: audio.sampleRate
					}
				]
			};
		}

		if (basicType === "video") {
			return {
				...createBaseIndexData({
					type: "video",
					name: tags.title || fallbackName,
					copyright: tags.copyright || null,
					author: tags.artist || null
				}),
				date: tags.date || null,
				encoder: tags.encoder || null,
				duration,
				files: [
					{
						path: fileName,
						size: fileSize,
						format: container,
						videoCodec: video.codec,
						videoBitrate: video.bitrate,
						width: video.width,
						height: video.height,
						fps: video.fps,
						audioCodec: audio.codec,
						audioBitrate: audio.bitrate,
						channels: audio.channels,
						channelLayout: audio.channelLayout,
						sampleRate: audio.sampleRate
					}
				]
			};
		}

		if (basicType === "image") {
			return {
				...createBaseIndexData({
					type: "image",
					name: tags.title || fallbackName,
					copyright: tags.copyright || null,
					author: tags.artist || null
				}),
				files: [
					{
						path: fileName,
						size: fileSize,
						format: imageOrFontFormat,
						codec: video.codec,
						width: video.width,
						height: video.height
					}
				]
			};
		}

		if (basicType === "font") {
			return {
				...createBaseIndexData({
					type: "font",
					name: fallbackName,
					copyright: null,
					author: null
				}),
				files: [
					{
						path: fileName,
						size: fileSize,
						format: imageOrFontFormat,
						style: null
					}
				]
			};
		}

		return {
			...createBaseIndexData({
				type: basicType,
				name: fallbackName,
				copyright: null,
				author: null
			}),
			files: [
				{
					path: fileName,
					size: fileSize
				}
			]
		};
	};

	let hasNotReady = false;
	let notReadyFiles = [];

	const indexFiles = allFiles.filter((f) => f.endsWith(".index.json"));
	const indexedMediaPaths = new Set();

	for (const indexFile of indexFiles) {
		try {
			const content = await fsp.readFile(indexFile, "utf-8");
			const indexData = JSON.parse(content);

			if (!indexData.ready) {
				hasNotReady = true;
				notReadyFiles.push(indexFile);
			}

			if (Array.isArray(indexData.files)) {
				for (const f of indexData.files) {
					if (f.path) {
						const fullPath = path.join(path.dirname(indexFile), f.path);
						indexedMediaPaths.add(fullPath);
					}
				}
			}
		} catch (error) {
			console.warn(`[Indexer] Could not read or parse index file: ${indexFile}`);
		}
	}

	for (const file of mediaFiles) {
		if (indexedMediaPaths.has(file)) continue;

		const indexFile = file + ".index.json";

		console.log(`[Indexer] Generating new index for ${file}`);
		const ext = path.extname(file).toLowerCase();
		const basicType = mediaTypeMap[ext] || "unknown";

		const stat = await fsp.stat(file);
		const fileSize = stat.size;

		const probe = {
			tags: {},
			duration: null,
			bitrate: null,
			container: null,
			audio: {
				codec: null,
				bitrate: null,
				channels: null,
				channelLayout: null,
				sampleRate: null
			},
			video: {
				codec: null,
				bitrate: null,
				width: null,
				height: null,
				fps: null
			}
		};

		if (["audio", "video", "image"].includes(basicType)) {
			try {
				const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${file}"`);
				const ffprobe = JSON.parse(stdout);

				if (ffprobe.format) {
					if (ffprobe.format.tags) probe.tags = ffprobe.format.tags;
					if (ffprobe.format.duration) probe.duration = parseFloat(ffprobe.format.duration);
					if (ffprobe.format.bit_rate) probe.bitrate = parseInt(ffprobe.format.bit_rate);
					probe.container = ffprobe.format.format_name;
				}

				if (ffprobe.streams) {
					for (const stream of ffprobe.streams) {
						if (stream.codec_type === "audio" && !probe.audio.codec) {
							probe.audio.codec = stream.codec_name;
							if (stream.bit_rate) probe.audio.bitrate = parseInt(stream.bit_rate);
							if (stream.channels) probe.audio.channels = stream.channels;
							if (stream.channel_layout) probe.audio.channelLayout = stream.channel_layout;
							if (stream.sample_rate) probe.audio.sampleRate = parseInt(stream.sample_rate);
						}

						if (stream.codec_type === "video" && !probe.video.codec) {
							if (basicType === "audio" && ["mjpeg", "png"].includes(stream.codec_name)) continue;
							probe.video.codec = stream.codec_name;
							if (stream.bit_rate) probe.video.bitrate = parseInt(stream.bit_rate);
							probe.video.width = stream.width;
							probe.video.height = stream.height;

							if (stream.r_frame_rate) {
								const [num, den] = stream.r_frame_rate.split('/');
								if (num && den && parseInt(den) !== 0) probe.video.fps = parseFloat((parseInt(num) / parseInt(den)).toFixed(2));
							}
						}
					}
				}
			} catch (error) {
				console.warn(`[Indexer] ffprobe failed for ${file}`);
			}
		}

		const indexData = createIndexData(basicType, {
			fileContext: { file, ext, fileSize },
			probe
		});

		await fsp.writeFile(indexFile, JSON.stringify(indexData, null, "\t") + "\n");
		hasNotReady = true;
		notReadyFiles.push(indexFile);
	}

	if (hasNotReady) {
		console.error("\n[!] BUILD FAILED: Some assets are not ready.");
		console.error("Please review the following index files:");
		for (const f of notReadyFiles) console.error(`  - ${f}`);
		throw new Error("Assets not ready");
	}

	console.log("[Indexer] All assets are properly indexed and ready.");
};