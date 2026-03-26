/** @typedef {import("/types.d.ts").LoggerFunction} LoggerFunction */

/** @type {LoggerFunction} */
const fatalError = (reason = "No reason", message = "No message", trace = "No trace") => {
	console.error(reason, message, trace);

	const fatalElement = document.getElementById("fatal-error");
	if (fatalElement) fatalElement.classList.remove("hidden");
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