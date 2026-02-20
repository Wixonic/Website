/** @type {Map<string, import("/src/types.d.ts").CachedComponent>} */
const componentsCache = new Map();

export const getComponent = (id) => componentsCache.get(id);

/**
 * @param {import("/src/types.d.ts").Module["components"]} components
 */
export const loadComponents = async (components) => {
	console.log("[Components] Loading components...");

	const missingComponents = components.filter((c) => !componentsCache.has(c.id));

	if (missingComponents.length === 0) window.dispatchEvent(new CustomEvent("components:progress", { detail: 1 }));

	const progresses = new Array(missingComponents.length).fill(0);

	const dispatchProgress = () => {
		const totalProgress = progresses.reduce((a, b) => a + b, 0) / missingComponents.length;
		window.dispatchEvent(new CustomEvent("components:progress", { detail: totalProgress }));
	};

	const promises = missingComponents.map((component, index) => new Promise((resolve) => {
		const xhr = new XMLHttpRequest();
		xhr.open("GET", component.url, true);

		if (["image", "audio", "video"].includes(component.type)) xhr.responseType = "blob";
		else if (component.type === "json") xhr.responseType = "json";
		else xhr.responseType = "text";

		xhr.addEventListener("progress", (e) => {
			if (e.lengthComputable) {
				progresses[index] = e.loaded / e.total;
				dispatchProgress();
			}
		});

		xhr.addEventListener("load", () => {
			progresses[index] = 1;
			dispatchProgress();

			if (xhr.status >= 200 && xhr.status < 300) {
				let content = xhr.response;

				if (xhr.responseType === "blob" && content instanceof Blob) content = URL.createObjectURL(content);
				else if (component.type === "json" && typeof content === "string") {
					try {
						content = JSON.parse(content);
					} catch (e) {
						console.warn(`[Components] Component "${component.id}" - Failed to parse JSON:`, e);
					}
				}

				componentsCache.set(component.id, {
					type: component.type,
					content
				});

				resolve();
			} else {
				console.error(`[Components] Component "${component.id}" - Code ${xhr.status}`);
				resolve();
			}
		});

		xhr.addEventListener("error", () => {
			progresses[index] = 1;
			dispatchProgress();

			console.error(`[Components] Component "${component.id}" - Network error`);
			resolve();
		});

		xhr.send();
	}));

	await Promise.all(promises);

	console.info(`[Components] ${components.length} component${components.length > 1 ? "s" : ""} loaded`);
};