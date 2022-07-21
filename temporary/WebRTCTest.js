import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-database.js";

const log = (t) => {
	const l = document.createElement("div");
	l.innerText = t;
	document.getElementById("log").append(l);
};

onload = () => {
	log(`Navigator is ${navigator.onLine ? "online" : "offline"}`);
	
	log("Initializing Firebase");
	
	window.app = initializeApp({
		apiKey: "AIzaSyBOK-u-u6mx3ZdwTXBTuY61qox34baxkvs",
		databaseURL: "https://wixonic-webrtc-test-default-rtdb.europe-west1.firebasedatabase.app",
		projectId: "wixonic-webrtc-test",
		appId: "1:526261810557:web:6a49a7291b0a5556b4c814"
	});
	
	log("Initializing Database");
	
	window.db = getDatabase(app);
	
	log("Ready");
};

const share = async () => {
	const offer = await peerConnection.createOffer();
	await peerConnection.setLocalDescription(offer);
	
	const roomWithOffer = {
		offer: {
			type: offer.type,
			sdp: offer.sdp
		}
	};
};
