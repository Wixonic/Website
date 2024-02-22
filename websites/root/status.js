/**
 * @typedef {Object} Status
 * @property {string} gravity
 * @property {string} message
 * @property {Date?} startDate
 * @property {Date?} endDate
 */

/**
 * @type {Status?}
 */
let status = null;
let ready = false;

const gravityEnum = [
	"message",
	"info",
	"warn",
	"critical"
];

/**
 * @param {Status} newStatus
 */
const setStatus = (newStatus) => {
	if (!status || gravityEnum.indexOf(status.gravity)< gravityEnum.indexOf(newStatus.gravity)) {
		status = newStatus;
		updateStatus();
	}
};

const updateStatus = () => {
	if (ready && status != null) {
		const statusContainer = document.querySelector("container.status");
		const statusElement = document.createElement("status");
		statusElement.innerHTML = `<div class="message">${status.message}</div>`;
		statusElement.setAttribute("gravity", status.gravity);
		
		const formatDate = (date) => `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
		
		if (status.startDate && status.endDate) statusElement.innerHTML += `<div class="date">From ${formatDate(status.startDate)} until ${formatDate(status.endDate)}</div>`;
		else if (status.startDate) statusElement.innerHTML += `<div class="date">From ${formatDate(status.starDate)}</div>`;
		else if (status.endDate) statusElement.innerHTML += `<div class="date">Until ${formatDate(status.endDate)}</div>`;
		
		statusContainer.append(statusElement);
		
		const metaTag = document.querySelector(`meta[name="theme-color"]`);
		metaTag.content = getComputedStyle(statusElement).backgroundColor;
		
		const style = getComputedStyle(statusElement);		document.body.style.marginTop = (Number(style.height.replace("px", "")) + Number(style.paddingTop.replace("px", "")) + Number(style.paddingBottom.replace("px", "")) + 6) + "px";
	}
};

const init = () => {
	ready = true;
	updateStatus();
};

export {
	init,
	setStatus
};

export default {
	init,
	setStatus
};