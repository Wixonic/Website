import { findRankFor } from "./utils.js";

const init = (factsContainer, leaderboard, previousLeaderboard) => {
	factsContainer.classList.add("hidden");
	factsContainer.innerHTML = `<div class="title">Faits interréssants</div>`;

	const generateFact = (text, category) => {
		factsContainer.classList.remove("hidden");
		const el = document.createElement("div");
		el.innerHTML = text;
		el.classList.add("fact", category);
		factsContainer.append(el);
	};

	for (const id in leaderboard) {
		const entry = leaderboard[id];
		const previousEntry = previousLeaderboard[id];

		if (!previousEntry) continue;

		const generateFactForCategory = (category) => {
			const currentRank = findRankFor(leaderboard, id, category);
			const previousRank = findRankFor(previousLeaderboard, id, category);
			const rankDelta = previousRank - currentRank;

			const categoryText = {
				"ratio": "en pourcentage",
				"bank": "dans la banque",
				"entries": "en nombre de participations",
				"victories": "en nombre de victoires"
			};

			if (rankDelta > 15) generateFact(`${id} a progressé de ${rankDelta} places ${categoryText[category]}.`, "pos");
			else if (rankDelta < -15) generateFact(`${id} a perdu ${Math.abs(rankDelta)} places ${categoryText[category]}.`, "neg");
		};

		generateFactForCategory("ratio");
		generateFactForCategory("bank");
		generateFactForCategory("entries");
		generateFactForCategory("victories");

		const kccDelta = entry.kcCoins - previousEntry.kcCoins;

		if (kccDelta > 20) generateFact(`${id} a gagné ${kccDelta} KCC`, "pos");
		else if (kccDelta < -20) generateFact(`${id} a dépensé ${Math.abs(kccDelta)} KCC`, "neg");

		const victoriesDelta = entry.victories - previousEntry.victories;
		if (victoriesDelta > 2) generateFact(`${id} a gagné ${victoriesDelta} fois`, "pos");
	};
};

export {
	init as initFacts
};