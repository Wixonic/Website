import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-database.js";

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
		authDomain: "wixonic-webrtc-test.firebaseapp.com",
		databaseURL: "https://wixonic-webrtc-test-default-rtdb.europe-west1.firebasedatabase.app",
		projectId: "wixonic-webrtc-test",
		storageBucket: "wixonic-webrtc-test.appspot.com",
		messagingSenderId: "526261810557",
		appId: "1:526261810557:web:6a49a7291b0a5556b4c814"
	});
	
	log("Initializing Database");
	
	window.db = getDatabase(app);
	
	document.getElementById("share").addEventListener("click",share);
	
	window.pc = new RTCPeerConnection();
	
	log("Ready");
};

const share = async () => {
	log("Creating room...");
	
	const offer = await pc.createOffer();
	await pc.setLocalDescription(offer);
	
	log("Offer created");
	
	const roomWithOffer = {
		offer: {
			type: offer.type,
			sdp: offer.sdp
		}
	};
	
	const roomRef = ref(db,`rooms/${Math.round(Math.random() * (Math.pow(36,8) - 1001) + 1000).toString(36)}`);
	set(roomRef,roomWithOffer);
	
	log(`Room created (${roomRef.key})`);
	
	roomRef.onSnapshot(async snapshot => {
		const data = snapshot.data();
		if (!pc.currentRemoteDescription && data.answer) {
            console.log("Set remote description: ",data.answer);
            const answer = new RTCSessionDescription(data.answer)
            await pc.setRemoteDescription(answer);
        }
    });
};
