import logger from "/src/script/logger.js";

let storage;

try {
	storage = localStorage;
} catch (unsafeError) {
	const e = unsafeError instanceof Error ? unsafeError : new Error(unsafeError);
	logger.warn("Failed to access localStorage, switching to sessionStorage", e.message, e.stack);

	try {
		storage = sessionStorage;
	} catch (unsafeError) {
		const e = unsafeError instanceof Error ? unsafeError : new Error(unsafeError);
		logger.error("Failed to access sessionStorage, switching to placeboStorage", e.message, e.stack);

		storage = {
			getItem: () => null,
			setItem: () => null,
			removeItem: () => null,
			clear: () => null,
			key: () => null,
			length: 0
		};
	}
}

export default storage;