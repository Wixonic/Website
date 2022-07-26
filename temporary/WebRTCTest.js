import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-app.js";
import { getDatabase, ref, child, get, set, update, push, onValue, off } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-database.js";

const log = (t,r) => {
	const c = document.getElementById("log");

	const l = document.createElement("div");
	l.innerText = t;

	if (r) {
		c.innerHTML = "";
	}

	c.append(l);
};


class Peer {
	constructor () {
		log("Initializing connection...",true);

		this.connection = new RTCPeerConnection({
			iceServers: [
				{
					urls: "stun:stun1.l.google.com:19302"
				},{
					urls: "stun:stun2.l.google.com:19302"
				},{
					urls: "stun:stun3.l.google.com:19302"
				},{
					urls: "stun:stun4.l.google.com:19302"
				}
			]
		});

		this.connection.addEventListener("connectionstatechange",(e) => log("Connection state changed: " + e.target.connectionstate));
		this.connection.addEventListener("datachannel",(e) => log("Datachannel added"));
		this.connection.addEventListener("icecandidate",(e) => log("New ICE Candidate"));
		this.connection.addEventListener("icecandidateerror",(e) => log("ICE Candidate error: " + e));
		this.connection.addEventListener("iceconnectionstatechange",(e) => log("ICE Candidate connection state changed: " + e.target.iceConnectionState));
		this.connection.addEventListener("icegatheringstatechange",(e) => log("ICE Candidate gathering state changed: " + e.target.iceGatheringState));
		this.connection.addEventListener("negotationneeded",(e) => log("Negotation needed"));
		this.connection.addEventListener("signalingstatechange",(e) => log("Signaling channel state changed: " + e.target.signalingState));
		this.connection.addEventListener("track",(e) => log("New track added"));		
	}
};

class Host extends Peer {
	constructor () {
		super();

		log("Initializing channel...");

		this.id = "test";

		this.room = ref(db,`rooms/${this.id}`);

		this.channel = this.connection.createDataChannel("test");
		
		this.channel.addEventListener("bufferedamountlow",(e) => log("Buffer amount is low"));
		this.channel.addEventListener("close",(e) => log("Channel closed"));
		this.channel.addEventListener("closing",(e) => log("Channel will be closed"));
		this.channel.addEventListener("error",(e) => log("Error in channel: " + e));
		this.channel.addEventListener("message",(e) => log("New message: " + e.data));
		this.channel.addEventListener("open",(e) => log("Channel opened"));

		this.connection.createOffer().then((offer) => {
			this.offer = offer;

			this.connection.setLocalDescription(this.offer).then(() => {
				set(this.room,{
					offer: this.offer
				}).then(() => {
					onValue(child(this.room,"answer"),(snapshot) => {
						if (snapshot.exists()) {
							const value = snapshot.val();

							this.connection.setRemoteDescription(value).then(() => {
								this.connection.addIceCandidate(value).then(() => {
									log("Ready",true);

									display(1);
								}).catch((e) => log("Failed to add ICE Candidate: " + e));
							}).catch((e) => log("Failed to set remote description: " + e));
						}
					});
				}).catch((e) => log("Failed to create host: " + e));
			}).catch((e) => log("Failed to set local description: " + e));
		}).catch((e) => log("Failed to create offer: " + e));
	}

	send (data) {
		this.channel.send(JSON.stringify(data));
	}
};

class Remote extends Peer {
	constructor (id) {
		super();

		this.id = id;

		this.room = ref(db,`rooms/${this.id}`);

		onValue(child(this.room,"offer"),(snapshot) => {
			if (snapshot.exists()) {
				const value = snapshot.val();

				this.connection.setRemoteDescription(value).then(() => {
					this.connection.createAnswer().then((answer) => {
						this.answer = answer;

						this.connection.setLocalDescription(this.answer).then(() => {
							update(this.room,{
								answer: this.answer
							}).then(() => {
								this.connection.addIceCandidate(value).then(() => {
									log("Ready",true);

									display(2);
								}).catch((e) => log("Failed to add ICE Candidate: " + e));
							}).catch((e) => log("Failed to share answer: " + e));
						}).catch((e) => log("Failed to set local description: " + e));
					}).catch((e) => log("Failed to create answer: " + e));
				}).catch((e) => log("Failed to set remote description: " + e));
			} else {
				log("Server not found",true);
			}
		});
	}
};


const display = (id=0) => {
	const container = document.getElementById("container");

	switch (id) {
		case -1:
			container.innerHTML = "";
			break;

		case 0:
			display(-1);

			const hostBtn = document.createElement("button");
			const remoteBtn = document.createElement("button");

			hostBtn.innerHTML = "Host";
			remoteBtn.innerHTML = "Remote";

			hostBtn.addEventListener("click",(e) => {
				display(-1);

				window.main = new Host();
			});

			remoteBtn.addEventListener("click",(e) => {
				display(-1);

				window.main = new Remote(prompt("Please enter the room's ID:"));
			});

			container.append(hostBtn);
			container.innerHTML += "<br />";
			container.append(remoteBtn);
			break;

		default:
			container.innerHTML = "Invalid frame: " + id;
			break;
	}
};


window.addEventListener("load",(e) => {
	log(`Navigator is ${navigator.onLine ? "online" : "offline"}`);

	window.addEventListener("online",(e) => log("Navigator is online"));
	window.addEventListener("offline",(e) => log("Navigator is offline"));
	
	window.app = initializeApp({
		apiKey: "AIzaSyBOK-u-u6mx3ZdwTXBTuY61qox34baxkvs",
		authDomain: "wixonic-webrtc-test.firebaseapp.com",
		databaseURL: "https://wixonic-webrtc-test-default-rtdb.europe-west1.firebasedatabase.app",
		projectId: "wixonic-webrtc-test",
		storageBucket: "wixonic-webrtc-test.appspot.com",
		messagingSenderId: "526261810557",
		appId: "1:526261810557:web:6a49a7291b0a5556b4c814"
	});
	
	window.db = getDatabase(app);

	display(0);
});
