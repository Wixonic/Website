import firebase from "./firebase.js";

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
let statusElement = null;

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
	status = newStatus;
	updateStatus();
};

const updateMargin = () => {
	if (statusElement) {
		const style = getComputedStyle(statusElement);
		const marginTop = Number(style.height.replace("px", "")) + Number(style.paddingTop.replace("px", "")) + Number(style.paddingBottom.replace("px", ""));
		document.body.style.marginTop = marginTop + "px";
		document.body.style.minHeight = `calc(${Number(getComputedStyle(document.body).minHeight.replace("px", "")) / innerHeight * 100}vh - ${marginTop}px)`;
	}
};

const updateStatus = () => {
	if (status) {
		const statusContainer = document.querySelector("container.status");
		statusContainer.innerHTML = "";

		statusElement = document.createElement("status");
		statusElement.innerHTML = `<div class="message">${status.message}</div>`;
		statusElement.setAttribute("gravity", status.gravity);

		if (status.startDate && status.endDate) statusElement.innerHTML += `<div class="date">From ${status.startDate.toDate().toLocaleString(navigator?.language ?? "en-US", { dateStyle: "short", timeStyle: "short" })} until ${status.endDate.toDate().toLocaleString(navigator?.language ?? "en-US", { dateStyle: "short", timeStyle: "short" })}</div>`;
		else if (status.startDate) statusElement.innerHTML += `<div class="date">From ${status.startDate.toDate().toLocaleString(navigator?.language ?? "en-US", { dateStyle: "short", timeStyle: "short" })}</div>`;
		else if (status.endDate) statusElement.innerHTML += `<div class="date">Until ${status.endDate.toDate().toLocaleString(navigator?.language ?? "en-US", { dateStyle: "short", timeStyle: "short" })}</div>`;

		statusContainer.append(statusElement);

		const metaTag = document.querySelector(`meta[name="theme-color"]`);
		metaTag.content = getComputedStyle(statusElement).backgroundColor;
	} else {
		const metaTag = document.querySelector(`meta[name="theme-color"]`);
		metaTag.content = "var(--background)";
	}

	updateMargin();
};

window.addEventListener("resize", updateMargin);

const init = async () => {
	firebase.firestore.onSnapshot(firebase.firestore.doc("status", "current"), (snapshot) => {
		const exists = snapshot.exists();

		if (exists || window.localEnvironment) {
			setStatus(exists ? snapshot.data() : {
				gravity: "log",
				message: "Running in local environment."
			});
		}
	});

	updateStatus();
};

export default {
	init,
	setStatus
};