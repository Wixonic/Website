export default {
	"footer > .cookie": {
		added: (node) => {
			node.addEventListener("click", () => {
				document.querySelector("aside.cookie").classList.remove("hidden");
			});
		}
	}
}