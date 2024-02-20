const fontParts = [
	{
		family: "Inter",
		source: "url('https://rsms.me/inter/font-files/InterVariable.woff2?v=4.0') format('woff2')",
		descriptors: {
			display: "block",
			featureSettings: "'liga' 1, 'calt' 1",
			style: "normal",
			weight: "100 900"
		}
	}, {
		family: "Inter",
		source: "url('https://rsms.me/inter/font-files/InterVariable-Italic.woff2?v=4.0') format('woff2')",
		descriptors: {
			display: "block",
			featureSettings: "'liga' 1, 'calt' 1",
			style: "italic",
			weight: "100 900"
		}
	}
]

const font = async () => {
	for (const fontPart of fontParts) {
		const fontFace = new FontFace(fontPart.family, fontPart.source, fontPart.descriptors);
		await fontFace.load();
		document.fonts.add(fontFace);
	}
};

export default font;