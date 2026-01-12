import storage from "../script/storage.js";

export default {
	"footer > .cookie": {
		added: (node) => {
			node.addEventListener("click", () => {
				storage.removeItem("consent");
				location.reload();
			});
		}
	}
};