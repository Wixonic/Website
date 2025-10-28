export default localStorage || sessionStorage || {
	getItem: () => null,
	setItem: () => null,
	removeItem: () => null,
	clear: () => null,
	key: () => null,
	length: 0
};