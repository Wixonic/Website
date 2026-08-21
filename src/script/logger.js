import { join } from "/script/path.js";
import { request } from "/script/request.js";

/** @typedef {import("/types.d.ts").LoggerFunction} LoggerFunction */

/** @type {LoggerFunction} */
const fatalError = (reason = "No reason", message = "No message", trace = "No trace", userFacingMessage = "The site has encountered an unexpected error and is temporarily unavailable.") => {
	error(reason, message, trace);

	const fatalElement = document.getElementById("fatal-error");
	const fatalMessageElement = document.getElementById("fatal-error-message");
	if (fatalMessageElement) fatalMessageElement.textContent = userFacingMessage;
	if (fatalElement) fatalElement.classList.remove("hidden");

	request("POST", join(path.server.default, "error"), "json", "application/json", JSON.stringify({
		location: location.href,
		reason,
		message,
		trace
	})).catch((error) => {
		warn("Failed to report error", error.message, error.stack);
	});
};

/** @type {LoggerFunction} */
const error = (reason = "No reason", message = "No message", trace = "No trace") => {
	console.error(reason, message, trace);
};

/** @type {LoggerFunction} */
const warn = (reason = "No reason", message = "No message", trace = "No trace") => {
	console.warn(reason, message, trace);
};

/** @type {import("/types.d.ts").Logger} */
export default { fatalError, error, warn };