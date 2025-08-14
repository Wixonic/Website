import loader from "/lib/loader.js";
import { path } from "/lib/path.js";

import header from "/lib/header.js";
import footer from "/lib/footer.js";

const init = async () => {
	await loader.font("Open Sans", new URL("/font/OpenSans/regular.ttf", localEnvironment ? path.local.assets : path.assets));
	await loader.font("Open Sans", new URL("/font/OpenSans/italic.ttf", localEnvironment ? path.local.assets : path.assets), {
		style: "italic"
	});

	await header.init();
	document.body.append(document.createElement("main"));
	await footer.init();

	// Custom input wrapper
	document.body.addEventListener("animationstart", (e) => {
		const input = e.target.closest?.(".input input");
		if (!input) return;
		const parent = input.closest(".input");
		if (e.animationName == "onAutoFillStart") parent.classList.add("autofilled");
		if (e.animationName == "onAutoFillCancel") parent.classList.remove("autofilled");
		input.checkValidity() ? parent.classList.remove("invalid") : parent.classList.add("invalid");
	});

	document.body.addEventListener("input", (e) => {
		const input = e.target.closest?.(".input input");
		if (!input) return;
		const parent = input.closest(".input");
		input.checkValidity() ? parent.classList.remove("invalid") : parent.classList.add("invalid");
	});

	new MutationObserver((m) => m.forEach((x) => x.addedNodes.forEach((n) => {
		if (n.nodeType != 1) return;
		n.querySelectorAll?.(".input input").forEach((i) => i.dispatchEvent(new Event("input")));
		if (n.matches?.(".input input")) n.dispatchEvent(new Event("input"));
	}))).observe(document.body, { childList: true, subtree: true });
};

export {
	init
};