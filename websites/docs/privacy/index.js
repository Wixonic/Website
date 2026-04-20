import footer from "/script/footer.js";

/** @type {import("/types.d.ts").Module["components"]} */
const components = [];

/** @type {import("/types.d.ts").Module["metadata"]} */
const metadata = {
	title: "Privacy Policy | Wixonic",
	description: "Our privacy policy is designed to protect your privacy, because privacy is a fundamental human right."
};

/** @type {import("/types.d.ts").Module["init"]} */
const init = async () => {
	const main = document.querySelector("main");

	main.innerHTML = `
		<section class="hero">

			<h1>Privacy Policy</h1>
			<p>Our privacy policy is designed to protect your privacy, because privacy is a fundamental human right.</p>

		</section>
	`;

	document.body.append(footer());
};

export { components, metadata, init };