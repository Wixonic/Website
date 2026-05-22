/**
 * @param {number} ms 
 * @returns {string}
 */
const parseDuration = (ms) => {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days} day${days !== 1 ? "s" : ""}`;
	if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""}`;
	if (minutes > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
	return `${seconds} second${seconds !== 1 ? "s" : ""}`;
};

/**
 * @param {number} ms 
 * @returns {Promise<void>}
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export { parseDuration, wait };