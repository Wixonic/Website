const formatRank = (rank) => {
	if (rank <= 0) return "--";
	else if (rank == 1) return "1er";
	else return rank + "e";
};

const findRankFor = (leaderboard, id, category) => {
	const sortedLeaderboard = sortLeaderboard(leaderboard, category);
	let previousEntry = { id: 0, value: 0 };

	if (Object.keys(sortedLeaderboard).indexOf(id) == -1) return -1;

	let currentId = 0;
	for (const name in sortedLeaderboard) {
		if (!name.endsWith("Corbineau")) ++currentId;
		const value = sortedLeaderboard[name][{
			"ratio": "ratio",
			"bank": "kcCoins",
			"entries": "entries"
		}[category]];
		if (previousEntry.value != value) previousEntry = { id: currentId, value };
		if (name == id) break;
	}

	return previousEntry.id;
};

const formatLeaderboard = (leaderboard) => {
	for (const id in leaderboard) leaderboard[id].ratio = leaderboard[id].entries > 0 ? -1 : leaderboard[id].victories / leaderboard[id].entries;
	return leaderboard;
};

const sortLeaderboard = (leaderboard, category) => {
	const values = Object.values(leaderboard);
	values.sort((a, b) => {
		switch (category) {
			case "ratio":
				if (a.percent == b.percent) return b.entries - a.entries;
				else return b.percent - a.percent;

			case "bank":
				if (a.kcCoins == b.kcCoins) return b.percent - a.percent;
				else return b.kcCoins - a.kcCoins;

			case "entries":
				if (a.entries == b.entries) return b.percent - a.percent;
				else return b.entries - a.entries;

			default:
				return 0;
		};
	});
	const sortedLeaderboard = {};
	for (const value of values) sortedLeaderboard[`${value.firstName} ${value.lastName}`] = value;
	return sortedLeaderboard;
};

export {
	findRankFor,
	formatLeaderboard,
	formatRank,
	sortLeaderboard
};