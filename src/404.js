import { getComponent } from "/src/script/components.js";
import { startVideo } from "/src/script/renderer.js";

/** @type {import("/src/types.d.ts").Module["components"]} */
export const components = [
	{
		id: "test",
		type: "video",
		url: new URL("/private/test.webm", path.assets)
	}
];

/** @type {import("/src/types.d.ts").Module["init"]} */
export const init = async () => {
	console.log(startVideo("test"));
};