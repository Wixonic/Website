const getCode = (id="Wb9AzlVxfsBN") => {
	const xhr = new XMLHttpRequest();
	
	xhr.open("GET",`https://api2.sololearn.com/v2/codeplayground/usercodes/${id}/`,true);
	
	xhr.responseType = "json";
	
	xhr.onload = () => {
		const response = xhr.response;
		
		if (response.success && (response.data && response.data.language === "web")) {
			const style = document.createElement("style");
			style.innerHTML = response.data.cssCode;
			const script = document.createElement("script")	;
			script.innerHTML = response.data.jsCode;
			document.getElementsByTagName("iframe")[0].setAttribute("srcdoc",response.data.sourceCode + style.outerHTML + script.outerHTML);
		} else if (!response.success) {
			document.getElementsByTagName("iframe")[0].setAttribute("srcdoc",`<h1>${response.errors[0].code}</h1><b>${response.errors[0].message}</b>	`);
		} else {
			document.getElementsByTagName("iframe")[0].setAttribute("srcdoc",`<h1>400</h1><b>Bad Request</b>`);
		}
	};
	
	xhr.send();
};

onload = () => {
	try {
		getCode(window.location.search.replace("?id=",""));
	} catch (e) {
		alert("An error occured: " + e);
	}
};