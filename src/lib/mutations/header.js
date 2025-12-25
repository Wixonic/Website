export default {
	"header > .home": {
		added: (node) => node.addEventListener("click", () => location.href = path.root)
	}
};
