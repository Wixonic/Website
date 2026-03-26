/** @type {import("/types.d.ts").Module["components"]} */
const components = [];

/**
 * @param {Promise<void>} onLoaded — resolves when the target module is fully loaded
 */
const init = async (onLoaded) => {
	await onLoaded;
};

export {
	components,
	init
};