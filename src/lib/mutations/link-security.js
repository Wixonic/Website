export default {
	"a[target='_blank']": {
		added: (node) => {
			if (!node.getAttribute("rel")) {
				node.setAttribute("rel", "noopener noreferrer");
			}
		}
	}
};