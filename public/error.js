/**
 * @typedef {Object} ExtendedError
 * @property {string} title Used in logs to name the report
 * @property {string} message Describe the error in a user-friendly manner
 * @property {string} code Used in logs to find the origin of the error, will be displayed to the user
 * @property {string} details Used in logs, display the initial error
 */

/**
 * @param {ExtendedError} error 
 */
const error = (e) => {
	performance.mark("error");

	const section = document.querySelector("section#error");

	const reportFile = new Blob([JSON.stringify({
		e,
		performance: performance.getEntries()
	}, undefined, "\t")], {
		type: "application/json"
	});

	if (section) {
		section.querySelector(".message").innerHTML = `${e?.message ?? "unknown message"}<br /><br />Please reload the page.<br />If you still see this error after reloading the page, please contact us below.`;
		section.querySelector(".file").href = URL.createObjectURL(reportFile);

		section.setAttribute("active", "true");
		section.removeAttribute("hidden");
	}

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
				title: e?.title ?? "unknown title",
				description: e?.message ?? "unknown message",
				color: 0xFF0000,
				fields: [
					{
						name: "Code",
						value: e?.code ?? "unknown"
					}, {
						name: "Error",
						value: e?.details ?? "unknown"
					}, {
						name: "User-Agent",
						value: navigator.userAgent
					}
				]
			}
		]
	}));
};

window.addEventListener("error", (e) => error({
	title: "Unhandled error",
	message: "An unknown error occured somewhere",
	code: 0,
	details: e.message
}));

export default error;