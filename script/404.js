import { initializeApp } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.13.0/firebase-analytics.js";

onload = () => {
	window.App = initializeApp({
		apiKey: "AIzaSyBZ0ea1Gh-56E8qoDK1oCxwQWG4dqiDrDM",
		authDomain: "website-wixonic.firebaseapp.com",
		projectId: "website-wixonic",
		storageBucket: "website-wixonic.appspot.com",
		messagingSenderId: "595027315977",
		appId: "1:595027315977:web:6f8db9ef2aa44614b457d8",
		measurementId: "G-QVK9NE4M07"
	});

	window.Analytics = getAnalytics(App);

	const xhr = new XMLHttpRequest();

	xhr.open("GET", "https://wixonic.fr/sitelinks.json", true);

	xhr.responseType = "json";

	xhr.onload = () => {
		window.links = xhr.response;

		if (typeof (links) != "object") {
			links = {};
		}

		window.input = document.getElementById("search");
		window.output = document.getElementById("results");

		input.value = window.location.pathname.replace("/", "").split("/").join(" ");
		input.addEventListener("input", search);
		search();
	};

	xhr.send();
};

const validchars = (txt) => txt.split(" ").join("").split("	").join("").toLowerCase();

const search = () => {
	const globalcheck = validchars(input.value).length <= 0;

	const value = input.value.split(" ");

	output.innerHTML = "";

	for (let name in links) {
		const link = links[name];

		for (let x = 0; x < value.length; ++x) {
			const v = validchars(value[x]);

			const check = v.length > 0 && (validchars(name).indexOf(v) != -1) || (validchars(link).indexOf(v) != -1);

			if (globalcheck || check) {
				output.innerHTML += `<a class="result" href="${link}"><name>${name}</name><ref>${link}</ref></a>`;
				break;
			}
		}
	}

	if (output.innerHTML == "") {
		output.innerHTML = `<a class="result" href="/"><name>No result</name><ref>Go to the Homepage</ref></a>`;
	}
};