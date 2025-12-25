export default {
	".input.date": {
		added: (node) => {
			const calendar = document.createElement("div");
			calendar.classList.add("calendar");

			const value = document.createElement("div");
			value.classList.add("value");

			node.append(calendar, value);
		},
		changed: (node, attribute, oldValue) => {
			console.log(node, attribute, node.getAttribute(attribute), oldValue);
		},
		removed: (node) => {

		}
	}
};
