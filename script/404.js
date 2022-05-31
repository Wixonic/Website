onload = () => {
	const xhr = new XMLHttpRequest();
	
	xhr.open("GET","/sitelinks.json",true);
	
	xhr.responseType = "json";
	
	xhr.onload = () => {
		window.links = xhr.response;
		
		if (typeof(links) != "object") {
			links = {};
		}
		
		window.input = document.getElementById("search");
		window.output = document.getElementById("results");
		
		input.value = window.location.pathname.replace("/","").split("/").join(" ");
		input.addEventListener("input",search);
		search();
	};
	
	xhr.send();
};

const validchars = (txt) => txt.split(" ").join("").split("	").join("").toLowerCase();

const search = () => {
	const globalcheck = validchars(input.value).length <= 0;
	
	const value = input.value.split(" ");
	
	output.innerHTML = "";
	
	for (let name in links) {
		const link = links[name];
		
		for (let x = 0; x < value.length; ++x) {
			const v = validchars(value[x]);
			
			const check = v.length > 0 && (validchars(name).indexOf(v) != -1) || (validchars(link).indexOf(v) != -1);
			
			if (globalcheck || check) {
				output.innerHTML += `<a class="result" href="${link}"><name>${name}</name><ref>${link}</ref></a>`;
				break;
			}
		}
	}
	
	if (output.innerHTML == "") {
		output.innerHTML = `<a class="result" href="/"><name>No result</name><ref>Go to the Homepage</ref></a>`;
	}
};