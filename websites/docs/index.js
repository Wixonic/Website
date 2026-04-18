/** @type {import("/types.d.ts").Module["components"]} */
const components = [];

/** @type {import("/types.d.ts").Module["metadata"]} */
const metadata = {
	title: "Testing Ground - Docs - Wixonic",
	description: "Currently testing my UI elements."
};

/** @type {import("/types.d.ts").Module["init"]} */
const init = async () => {
	const main = document.querySelector("main");

	main.innerHTML = `
	<h1>Header 1</h1>
	<h2>Header 2</h2>
	<h3>Header 3</h3>
	<h4>Header 4</h4>
	<h5>Header 5</h5>
	<h6>Header 6</h6>
	
	<p>This is a simple paragraph. I'm currently testing my UI elements and I don't have much to say.</p>

	<a href="https://wixonic.fr" target="_blank">This is a link to my website.</a>

	<button>Button</button>
	<button class="primary">Primary Button</button>
	<button class="danger">Danger Button</button>
	<button class="success">Success Button</button>
	<button disabled>Disabled Button</button>
	`;
};

export { components, metadata, init };