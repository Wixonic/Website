import { request } from "/script/request.js";

const TMDB_BASE = "https://api.themoviedb.org/3"
const TMDB_KEY = "878e038120a56c5ec99c3e8fa47489b5";

const TMDB = (path = "/") => request("GET", `${TMDB_BASE}${path}?api_key=${TMDB_KEY}`, "json", "application/json");

const carousels = {
	movies: [
		10681, // Wall-E
		522402, // Finch
		1184918, // A Wild Robot
		920, // Cars
		2062 // Ratatouille
	],
	shows: [
		95480, // Slow Horses
		95396, // Severance
		97546, // Ted Lasso
		125988, // Silo
		252107, // Star City
		157368, // The New Look
		93740, // Foundation
		225171, // Pluribus
		46518, // Masters of the Air
		278624, // Lucky
		87917, // For All Mankind
		252000, // Down Cemetery Road
		157226 // Sunny
	],
	games: [

	],
	songs: [

	],
	creators: [

	]
};

addEventListener("DOMContentLoaded", async () => {
	const carouselElements = {
		movies: document.querySelector(".carousel.movies .container"),
		shows: document.querySelector(".carousel.shows .container"),
		games: document.querySelector(".carousel.games .container"),
		songs: document.querySelector(".carousel.songs .container"),
		creators: document.querySelector(".carousel.creators .container")
	};

	try {
		const configRequest = await TMDB("/configuration");

		if (configRequest.status == 200 && configRequest.response?.images?.secure_base_url) {
			const TMDB_IMAGES_BASE = configRequest.response?.images?.secure_base_url;
			const TMDB_IMAGE = (path = "/", file_size = "original") => `${TMDB_IMAGES_BASE}/${file_size}${path}?api_key=${TMDB_KEY}`;

			try {
				for (const id of carousels.shows) {
					const req = await TMDB(`/tv/${id}`);

					if (req.status == 200) {
						const data = req.response;

						const element = document.createElement("a");
						element.classList.add("element", "show", "unlink");
						element.href = `https://www.themoviedb.org/tv/${id}`;
						element.target = "_blank";
						element.rel = "noopener noreferrer";

						const title = document.createElement("div");
						title.classList.add("title");
						title.innerHTML = data.original_name;

						const poster = document.createElement("img");
						poster.classList.add("poster");
						poster.src = TMDB_IMAGE(data.poster_path);

						element.append(title, poster);

						carouselElements.shows.append(element);
					}
				}
			} catch (error) {
				carouselElements.shows.innerHTML = "Failed to load TV Shows.";
			}

			try {
				for (const id of carousels.movies) {
					const req = await TMDB(`/movie/${id}`);

					if (req.status == 200) {
						const data = req.response;

						const element = document.createElement("a");
						element.classList.add("element", "movie", "unlink");
						element.href = `https://www.themoviedb.org/movie/${id}`;
						element.target = "_blank";
						element.rel = "noopener noreferrer";

						const title = document.createElement("div");
						title.classList.add("title");
						title.innerHTML = data.original_title;

						const poster = document.createElement("img");
						poster.classList.add("poster");
						poster.src = TMDB_IMAGE(data.poster_path);

						element.append(title, poster);

						carouselElements.movies.append(element);
					}
				}
			} catch (error) {
				carouselElements.movies.innerHTML = "Failed to load movies.";
			}
		}
	} catch (error) {
		carouselElements.shows.innerHTML = "Failed to load TV Shows.";
		carouselElements.movies.innerHTML = "Failed to load movies.";
	}
});