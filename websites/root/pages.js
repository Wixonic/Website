/**
 * @param {string} id?
 */
const display = (id) => {
	const pages = document.querySelectorAll("page");
	const buttons = document.querySelectorAll(".page-button");

	if (!id) id = pages[0].id;

	for (let x = 0; x < pages.length; ++x) {
		const page = pages[x];

		if (page.id == id) page.setAttribute("displayed", "true");
		else page.removeAttribute("displayed");
	}

	for (let x = 0; x < buttons.length; ++x) {
		const button = buttons[x];

		if (button.getAttribute("href") == `#${id}`) button.setAttribute("displayed", "true");
		else button.removeAttribute("displayed");
	}
};

const init = () => {
	const hash = document.location.hash.replace("#", "");
	if (hash.length > 0) display(hash);
	else display();

	window.addEventListener("hashchange", (event) => {
		const newHash = new URL(event.newURL).hash.replace("#", "");

		if (newHash.length > 0) display(newHash);
		else display();
	});
};

export default {
	display,
	init
};