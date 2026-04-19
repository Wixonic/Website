const formatDuration = (duration = 0, precision = 6) => {
	const components = [
		{ multiplier: 1, padding: 2, requires: [1] },
		{ suffix: ":", multiplier: 60, padding: 2, requires: [0] },
		{ suffix: ":", multiplier: 60 * 60, padding: 2, requires: [0, 1] },
		{ suffix: "d ", multiplier: 24 * 60 * 60 },
		{ suffix: "m ", multiplier: 30 * 24 * 60 * 60 },
		{ suffix: "y ", multiplier: 365 * 24 * 60 * 60 }
	];

	let toDisplay = new Set();
	let current = components.length - 1;
	while (current > 0 && duration < components[current].multiplier) current--;
	for (let i = 0; i < precision && current - i >= 0; i++) toDisplay.add(current - i);

	let size = 0;
	while (size !== toDisplay.size) {
		size = toDisplay.size;
		for (const index of toDisplay) {
			if (components[index].requires) components[index].requires.forEach((req) => toDisplay.add(req));
		}
	}

	let text = "";

	for (let j = components.length - 1; j >= 0; j--) {
		if (!toDisplay.has(j)) continue;

		const value = Math.floor(duration / components[j].multiplier);
		duration %= components[j].multiplier;

		text += (components[j].prefix ?? "") + value.toString().padStart(components[j].padding, "0") + (components[j].suffix ?? "");
	}

	return text.trim();
};

const formatSize = (size = 0, unit = "B", precision = 0, binary = false) => {
	const base = binary ? 1024 : 1000;
	const suffixes = ["", "K", "M", "G", "T"];

	let i = 0;

	while (size >= base && i < suffixes.length - 1) {
		size /= base;
		i++;
	}

	return `${size.toFixed(precision)} ${suffixes[i]}${unit}`;
};

export {
	formatDuration,
	formatSize
};