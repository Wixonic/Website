let storage;

try {
	storage = localStorage;
} catch (e) {
	console.warn("Failed to access localStorage, switching to sessionStorage", e);
	try {
		storage = sessionStorage;
	} catch (e) {
		console.error("Failed to access sessionStorage, switching to placeboStorage", e);
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