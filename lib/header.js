import firebase from "/lib/firebase.js";
import request from "/lib/request.js";

const init = async () => {
	const header = document.querySelector("header");

	if (document.body.classList.contains("noHeader")) header.remove();
	else {
		const update = async () => {
			header.innerHTML = "";

			const button = document.createElement("a");
			button.href = window.localEnvironment ? "http://localhost:2005" : "https://wixonic.fr";
			button.classList.add("button", "transparent", "logo");

			try {
				const data = await request("GET", "/assets/file/images/icon/logo.svg", "text", "image/svg+xml", null, 60 * 60 * 24, false);
				button.innerHTML += data.response;
			} catch { }

			header.append(button);

			if (firebase.auth.user) {
				const account = document.createElement("a");
				account.classList.add("button", "transparent", "account");
				account.href = window.localEnvironment ? "http://localhost:2010" : "https://accounts.wixonic.fr";

				const container = document.createElement("div");
				const image = document.createElement("img");

				container.title = "Account";
				container.classList.add("picture");

				try {
					await new Promise((resolve) => {
						image.addEventListener("error", async () => {
							const data = await request("GET", "/assets/file/images/icon/wixi.svg", "text", "image/svg+xml", null, 60 * 60 * 24, false);
							container.innerHTML += data.response;
							resolve();
						});

						image.addEventListener("load", () => {
							container.append(image);
							resolve();
						});

						image.src = firebase.auth.user.photoURL;
					});
				} catch { }

				account.append(container);

				header.append(account);
			} else {
				const circle = document.createElement("circle");
				circle.classList.add("circle-redirect");

				const button = document.createElement("button");
				button.classList.add("button", "transparent", "account");
				button.innerHTML = "Sign In";
				button.addEventListener("click", () => location.href = `${window.localEnvironment ? "http://localhost:2010" : "https://accounts.wixonic.fr"}/auth?redirect=${encodeURIComponent(location.href)}`);

				header.append(circle);
				header.append(button);
			}
		};

		await update();
		firebase.auth.object.onAuthStateChanged(update);

		document.addEventListener("scroll", () => header.classList.toggle("active", scrollY > 0));

		const style = getComputedStyle(header);
		document.querySelector("main").style.marginTop = `calc(0.5rem + ${Number(style.height.replace("px", "")) + Number(style.paddingTop.replace("px", "")) + Number(style.paddingBottom.replace("px", ""))}px)`;
	}
};

export default {
	init
};