import { ref } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";

addEventListener("DOMContentLoaded", async () => {
	const path = location.pathname;
	console.log(path);

	const document = ref(firebase.default.storage, "wiki" + path);

	console.log(await document.getDownloadURL());
});