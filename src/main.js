import logger from "/script/logger.js";
import { init as initIcons } from "/script/icons.js";

addEventListener("DOMContentLoaded", async () => {
	await initIcons();
});

addEventListener("error", (event) => {
	event.preventDefault();
	const error = event.error instanceof Error ? event.error : new Error(event.error || event.message);
	logger.fatalError("Uncaught Exception", error.message, error.stack);
});

addEventListener("unhandledrejection", (event) => {
	event.preventDefault();
	const error = event.reason instanceof Error ? event.reason : new Error(event.reason);
	logger.fatalError("Unhandled Promise Rejection", error.message, error.stack);
});