/**
 * @typedef {Object} ExtendedError
 * @property {string} title Used in logs to name the report
 * @property {string} message Describe the error in a user-friendly manner
 * @property {string} code Used in logs to find the origin of the error, will be displayed to the user
 * @property {Error} details The initial error, used in logs
 */

/**
 * @typedef {Object} FormattedError
 * @property {string} title
 * @property {string} message
 * @property {string} code
 * @property {FormattedErrorDetails} details
 * 
 * @typedef {Object} FormattedErrorDetails
 * @property {string} message
 */

/**
 * @param {ExtendedError} e 
 */
const error = (e) => {
	performance.mark("error");

	/**
	 * @type {FormattedError}
	 */
	const formattedError = {
		title: e?.title ?? "Unknown title",
		message: e?.message ?? "Something wrong happened",
		code: e?.code ?? 0,
		details: {
			message: `${e?.details?.name ?? "Unknown type"}: ${e.details?.message ?? "unknown message"}`,
			position: `${e?.details?.line ?? "??"}:${e.details?.column ?? "??"}`,
			source: e?.details?.sourceURL ?? "unknown source",
			stack: e?.details.stack ?? "unknown stack"
		}
	};

	const report = {
		error: formattedError,
		location,
		performance: performance.getEntries()
	};

	const section = document.querySelector("section#error");

	const reportFile = new Blob([JSON.stringify(report, undefined, "\t")], {
		type: "application/json"
	});

	if (section) {
		section.querySelector(".message").innerHTML = `${formattedError.message}<br /><br />Please reload the page.<br />If you still see this error after reloading the page, please contact us below.`;
		section.querySelector(".file").href = URL.createObjectURL(reportFile);

		section.setAttribute("active", "true");
		section.removeAttribute("hidden");
	}

	if (location.hostname == "localhost" || location.hostname == "qvkq66-2004.csb.app") console.error(report);
	else {
		const xhrLog = new XMLHttpRequest();
		xhrLog.open("POST", "https://discord.com/api/webhooks/1208689883246362634/89A7z76W6wcyntOHAdp30UoWxxXMQgo31bR9MnlHRsAMJnmrsKXuM-c-JYJnyj24I70W", true);
		xhrLog.setRequestHeader("Content-Type", "application/json");

		xhrLog.addEventListener("load", async () => {
			const xhrAttachment = new XMLHttpRequest();
			xhrAttachment.open("POST", "https://discord.com/api/webhooks/1208689883246362634/89A7z76W6wcyntOHAdp30UoWxxXMQgo31bR9MnlHRsAMJnmrsKXuM-c-JYJnyj24I70W", true);
			xhrAttachment.setRequestHeader("Content-Type", "multipart/form-data; boundary=boundary");
			xhrAttachment.send(`--boundary
Content-Disposition: form-data; name="payload_json"
Content-Type: application/json

${JSON.stringify({ attachments: [{ id: 0, description: "Report file", filename: "report.json" }] })}
--boundary
Content-Disposition: form-data; name="files[0]"; filename="report.json"
Content-Type: application/json

${await reportFile.text()}
--boundary--`);
		});

		xhrLog.send(JSON.stringify({
			embeds: [
				{
					title: formattedError.title,
					description: formattedError.message,
					color: 0xFF0000,
					fields: [
						{
							name: "Code",
							value: formattedError.code
						}, {
							name: "Error",
							value: JSON.stringify(formattedError.details)
						}, {
							name: "User-Agent",
							value: navigator.userAgent
						}
					]
				}
			]
		}));
	}
};

window.addEventListener("error", (event) => error({
	title: "Unhandled error",
	message: "An unknown error occured somewhere",
	code: 0,
	details: event.error
}));

export default error;