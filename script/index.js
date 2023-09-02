import { initializeApp } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-analytics.js";

window.App = initializeApp({
	apiKey: "AIzaSyBZ0ea1Gh-56E8qoDK1oCxwQWG4dqiDrDM",
	authDomain: "website-wixonic.firebaseapp.com",
	projectId: "website-wixonic",
	storageBucket: "website-wixonic.appspot.com",
	messagingSenderId: "595027315977",
	appId: "1:595027315977:web:170509c0701b1b2bb457d8",
	measurementId: "G-5JGBDS7YB9"
});

window.Analytics = getAnalytics(App);

const xhr = new XMLHttpRequest();
xhr.open("GET", "https://website-wixonic-default-rtdb.europe-west1.firebasedatabase.app/news.json", true);
xhr.responseType = "json";

xhr.onload = () => {
	if (xhr.response) {
		const timestamps = Object.keys(xhr.response);
		timestamps.sort();
		document.getElementById("news").innerHTML = "";
		timestamps.forEach((timestamp, i) => {
			const data = xhr.response[timestamp];

			const item = document.createElement("item");
			item.addEventListener("click", () => window.open(data.link, "_blank"));
			item.innerHTML = `<i class="${data.icon}"></i><b>${data.title}</b><p>${data.description}</p>`;
			document.getElementById("news").prepend(item);
		});
	} else {
		document.getElementById("news").innerHTML = "<special>No news</special>";
	}

	const links = [
		{
			"title": "Instagram",
			"icon": "fa-brands fa-instagram",
			"link": "https://www.instagram.com/wixonic12"
		}, {
			"title": "GitHub",
			"icon": "fa-brands fa-github",
			"link": "https://github.com/Wixonic"
		}, {
			"title": "Discord",
			"icon": "fa-brands fa-discord",
			"link": "https://discord.gg/DSkSPTUP95"
		}, {
			"title": "YouTube",
			"icon": "fa-brands fa-youtube",
			"link": "https://youtube.com/@wixonic"
		}, {
			"title": "Facebook",
			"icon": "fa-brands fa-facebook",
			"link": "https://www.facebook.com/Wixonic/"
		}, {
			"title": "Twitch",
			"icon": "fa-brands fa-twitch",
			"link": "https://www.twitch.tv/Wixonic"
		}, {
			"title": "Twitter",
			"icon": "fa-brands fa-twitter",
			"link": "https://twitter.com/Wixonic"
		}, {
			"title": "Stack Overflow",
			"icon": "fa-brands fa-stack-overflow",
			"link": "https://stackoverflow.com/users/18716068/wixonic"
		}, {
			"title": "Reddit",
			"icon": "fa-brands fa-reddit-alien",
			"link": "https://www.reddit.com/user/Wixonic12"
		}
	];

	document.getElementById("links").innerHTML = "";

	for (let link of links) {
		const item = document.createElement("item");
		item.addEventListener("click", () => window.open(link.link, "_blank"));
		item.innerHTML = `<i class="${link.icon}"></i><p>${link.title}</p>`;
		document.getElementById("links").append(item);
	}

	document.getElementById("contact").innerHTML = "";

	const contact = [
		{
			"title": "Instagram",
			"icon": "fa-brands fa-instagram",
			"link": "https://www.instagram.com/wixonic12"
		}, {
			"title": "Email",
			"icon": "fa-duotone fa-envelope",
			"link": "mailto:contact@wixonic.fr"
		}
	];

	for (let link of contact) {
		const item = document.createElement("item");
		item.addEventListener("click", () => window.open(link.link, "_blank"));
		item.innerHTML = `<i class="${link.icon}"></i><p>${link.title}</p>`;
		document.getElementById("contact").append(item);
	}
};

xhr.send();
