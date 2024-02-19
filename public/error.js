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
const error = (error) => {
	performance.mark("error");

	const section = document.querySelector("section#error");

	const reportFile = new Blob([JSON.stringify({
		error,
		performance: performance.getEntries()
	}, undefined, "\t")], {
		type: "application/json"
	});

	if (section) {
		section.querySelector(".message").innerHTML = `${error?.message ?? "unknown message"}<br /><br />Please reload the page.<br />If you still see this error after reloading the page, please contact us below.`;
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
				title: error?.title ?? "unknown title",
				description: error?.message ?? "unknown message",
				color: 0xFF0000,
				fields: [
					{
						name: "Code",
						value: error?.code ?? "unknown"
					}, {
						name: "Error",
						value: error?.details ?? "unknown"
					}, {
						name: "User-Agent",
						value: navigator.userAgent
					}
				]
			}
		]
	}));
};

export {
	error
};