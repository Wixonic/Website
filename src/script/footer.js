const create = () => {
	const footer = document.createElement("footer");
	footer.innerHTML = `
		<p>Footer</p>
	`;
	return footer;
};

export default create;