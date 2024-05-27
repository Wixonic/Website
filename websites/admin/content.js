import firebase from "./lib/firebase.js";

const init = async () => {
	if (!firebase.auth.user) location.href = `${window.localEnvironment ? "http://localhost:2010" : "https://accounts.wixonic.fr"}/auth?redirect=${encodeURIComponent(location.href)}`;
	else if (!(await firebase.auth.user.getIdTokenResult()).claims.admin) location.href = window.localEnvironment ? "http://localhost:2005" : "https://wixonic.fr";
	else {
		console.log("Admin");
	}
};

export default {
	init
};