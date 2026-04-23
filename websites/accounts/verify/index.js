addEventListener("DOMContentLoaded", async () => {
	const params = new URLSearchParams(location.search);
	const mode = params.get("mode");
	const oobCode = params.get("oobCode");

	const title = document.querySelector("h2");
	const subtext = document.querySelector("p");

	if (mode == "verifyEmail" && oobCode) {
		try {
			await firebase.applyActionCode(oobCode);
			title.innerText = "Email verified";
			subtext.innerText = "Your email has been verified.";
		} catch (error) {
			console.error(error);
			title.innerText = "Failed to verified";
		}
	} else if (mode == "verifyAndChangeEmail" && oobCode) {
		try {
			await firebase.applyActionCode(oobCode);
			await firebase.signOut(false);
			title.innerText = "Changed email";
			subtext.innerText = "Your new email has been verified.";
		} catch (error) {
			console.error(error);
			title.innerText = "Failed to change email";
		}
	} else title.innerText = "Invalid parameters";
});