import logger from "/script/logger.js";
import { request } from "/script/request.js";

let progress = 0;
const getProgress = () => progress;
const resetProgress = () => progress = 0;

/**
 * Map to store loaded component data/Object URLs.
 * @type {Map<string, any>}
 */
const loadedComponents = new Map();

/**
 * Gets the loaded data or Object URL for a component by its ID.
 * @param {string} id
 * @returns {any}
 */
const getComponent = (id) => loadedComponents.get(id);

/**
 * Loads an array of components and updates the internal progress.
 * @param {import("/types.d.ts").Component[]} components
 * @returns {Promise<void>}
 */
const loadComponents = async (components) => {
	if (!components || components.length === 0) {
		progress = 1;
		return;
	}

	progress = 0;
	let loadedCount = 0;
	const totalCount = components.length;

	const updateProgress = () => {
		loadedCount++;
		progress = loadedCount / totalCount;
	};

	const loadPromises = components.map(async (component) => {
		let attempt = 0;
		const maxAttempts = 3;

		// Resolve the best URL from sources (codec-aware)
		let url = component.url;
		if (component.sources) {
			const mimeTypes = Object.keys(component.sources);
			const video = document.createElement("video");
			const supported = mimeTypes.find((mime) => {
				const canPlay = video.canPlayType(mime);
				return canPlay === "probably" || canPlay === "maybe";
			});

			url = component.sources[supported ?? mimeTypes[mimeTypes.length - 1]];
		}

		if (!url) {
			logger.error(`[components.js] No valid source found for component ${component.id}`);
			return;
		}

		while (attempt < maxAttempts) {
			try {
				let responseType = "text";
				if (["image", "audio", "video"].includes(component.type)) responseType = "blob";
				else if (component.type === "json") responseType = "json";

				const res = await request("GET", url.toString(), responseType);

				let data = res.response;
				if (responseType === "blob") {
					// Clean up previous blob URL if it exists to avoid memory leaks
					const oldData = loadedComponents.get(component.id);
					if (typeof oldData === "string" && oldData.startsWith("blob:")) URL.revokeObjectURL(oldData);
					data = URL.createObjectURL(data);
				}

				loadedComponents.set(component.id, data);
				break;
			} catch (unsafeError) {
				const error = unsafeError instanceof Error ? unsafeError : new Error(unsafeError);
				attempt++;

				if (attempt >= maxAttempts) {
					if (!component.optional) logger.fatalError(`[components.js] Failed to load component ${component.id} after ${maxAttempts} attempts`, error.message, error.stack);
					else logger.error(`[components.js] Failed to load component ${component.id} after ${maxAttempts} attempts`, error.message, error.stack);
					break;
				} else logger.warn(`[components.js] Attempt ${attempt} failed for component ${component.id}`);
			}
		}

		updateProgress();
	});

	await Promise.all(loadPromises);
};

/**
 * Revokes and deletes component data not present in the active list to free up memory.
 * @param {string[]} activeComponentIds
 */
const cleanupComponents = (activeComponentIds) => {
	for (const [id, data] of loadedComponents.entries()) {
		if (!activeComponentIds.includes(id)) {
			if (typeof data === "string" && data.startsWith("blob:")) {
				URL.revokeObjectURL(data);
			}
			loadedComponents.delete(id);
		}
	}
};

export { getProgress, resetProgress, getComponent, loadComponents, cleanupComponents };