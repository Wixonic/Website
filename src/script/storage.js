import logger from "/script/logger.js";

let storage;

try {
	storage = localStorage;
} catch (unsafeError) {
	const error = unsafeError instanceof Error ? unsafeError : new Error(unsafeError);
	logger.warn("Failed to access localStorage, switching to sessionStorage", error.message, error.stack);

	try {
		storage = sessionStorage;
	} catch (unsafeError) {
		const error = unsafeError instanceof Error ? unsafeError : new Error(unsafeError);
		logger.error("Failed to access sessionStorage, switching to placeboStorage", error.message, error.stack);

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