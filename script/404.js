onload = () => {
	const xhr = new XMLHttpRequest();
	
	xhr.open("GET","https://wixonic.github.io/sitelinks.json",false);
	
	xhr.onload = () => {
		window.links = xhr.response;
		
		const input = document.getElementById("search");
		input.value = window.location.pathname;
	};
	
	xhr.send();
};