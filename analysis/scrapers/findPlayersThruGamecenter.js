// ----------------- APP_ROOT_PATH INSTANTIATION --------------------------

global.OwlStakes =
{
	require : require('app-root-path').require
};

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('Q'),
	scraper = global.OwlStakes.require('scrapers/base/nflGamecenterDriver'),
	mongo = global.OwlStakes.require('data/DAO/utility/databaseDriver'),
	nflTeamCodes = global.OwlStakes.require('shared/constants/nflTeamShortNames');

// ----------------- ENUMS/CONSTANTS --------------------------

var PLAYERS_COLLECTION = 'players',
	GAMECENTER_KEYWORD = 'nflGamecenter';

// ----------------- SCRIPT LOGIC --------------------------

_Q.spawn(function* ()
{
	var teamCodes = Object.keys(nflTeamCodes),
		playerMap,
		roster, rosterIds,
		i, j;

	// Prep the database for data retrieval and updates
	yield mongo.initialize();

	// Retrieve the collection of player data from the back-end
	playerMap = yield mongo.read(PLAYERS_COLLECTION)[0];
	playerMap = playerMap || {};
	playerMap[GAMECENTER_KEYWORD] = {}; // Set up a new collection to house gamecenter player IDs

	for (i = teamCodes.length - 1; i >= 0; i--)
	{
		// Find gamecenter IDs associated with the rostered players for the team in context
		roster = yield scraper.findPlayers(teamCodes[i]);
		rosterIds = Object.keys(roster);

		// Move those IDs into the general collection of all gamecenter IDs
		for (j = rosterIds.length - 1; j >= 0; j--)
		{
			playerMap[GAMECENTER_KEYWORD][rosterIds[j]] = roster[rosterIds[j]];
		}
	}

	// Write the player-related data into the database
	yield mongo.bulkWrite(PLAYERS_COLLECTION, true, mongo.formUpdateOneQuery(
	{
		_id: playerMap._id || 1
	}, playerMap, true));

	// Close the database
	mongo.closeDatabase();
});