import firebase from "/lib/firebase.js";
import request from "/lib/request.js";

const init = async () => {
	const header = document.querySelector("header");

	if (document.body.classList.contains("noHeader")) header.remove();
	else {
		const update = async () => {
			header.innerHTML = "";

			const button = document.createElement("a");
			button.href = localEnvironment ? "http://localhost:2005" : "https://wixonic.fr";
			button.classList.add("button", "transparent", "logo");

			try {
				const data = await request("GET", "/assets/file/images/icon/logo.svg", "text", "image/svg+xml", 60 * 60 * 24);
				button.innerHTML += data.response;
			} catch { }

			header.append(button);

			if (firebase.auth.user) {

			} else {
				const circle = document.createElement("circle");
				circle.classList.add("circle-redirect");

				const button = document.createElement("button");
				button.classList.add("button", "transparent");
				button.innerHTML = "Sign In";
				button.addEventListener("click", (event) => {
					const rect = circle.getBoundingClientRect();
					const diameter = Math.max(rect.width, rect.height);
					const radius = diameter / 2;

					const offsetX = event.pageX - radius;
					const offsetY = event.pageY - radius;

					circle.style.left = offsetX + "px";
					circle.style.top = offsetY + "px";

					circle.style.animation = "expand 0.5s cubic-bezier(0.35, 0, 0.8, 0.2) forwards";

					setTimeout(() => location.href = `${localEnvironment ? "http://localhost:2010" : "https://accounts.wixonic.fr"}/auth?redirect=${encodeURIComponent(location.href)}`, 500);
				});

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