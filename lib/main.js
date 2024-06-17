import firebase from "/lib/firebase.js";
import { path } from "/lib/path.js";
import loader from "/lib/loader.js";

const init = async () => {
	await loader.font("Open Sans", new URL("/font/OpenSans/normal.ttf", localEnvironment ? path.local.assets : path.assets));
	await loader.font("Open Sans", new URL("/font/OpenSans/italic.ttf", localEnvironment ? path.local.assets : path.assets), {
		style: "italic"
	});
};

export {
	init
};