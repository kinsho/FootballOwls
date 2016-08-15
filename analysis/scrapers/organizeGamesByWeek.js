// ----------------- APP_ROOT_PATH INSTANTIATION --------------------------

global.OwlStakes =
{
	require : require('app-root-path').require
};

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('Q'),
	scraper = global.OwlStakes.require('scrapers/base/nflGamecenterDriver'),
	mongo = global.OwlStakes.require('data/DAO/utility/databaseDriver');

// ----------------- ENUMS/CONSTANTS --------------------------

// Note the placeholder in the URL string that allows us to load data from different teams
var DATABASE_GAMES_COLLECTION = 'nflGames';

// ----------------- SCRAPER LOGIC --------------------------

_Q.spawn(function* ()
{
	var games = yield scraper.linkGamesToWeek(),
		gameRecord,
		updatedGames = [],
		i;

	// Prep the database for data retrieval and updates
	yield mongo.initialize();

	// Pull game records from the database and augment each of the records with "week" properties using the scraped data
	for (i = games.length - 1; i >= 0; i--)
	{
		gameRecord = yield mongo.read(DATABASE_GAMES_COLLECTION,
		{
			id: games[i].gameId
		});

		gameRecord[0].week = parseInt(games[i].week, 10);

		// Prepare the updated record to be pushed back into the database
		updatedGames.push(mongo.formUpdateOneQuery(
		{
			id: gameRecord[0].id
		}, gameRecord[0], true));
	}

	// Write the new games into the database. Overwrite any old data for these same games
	updatedGames.unshift(DATABASE_GAMES_COLLECTION, true);
	yield mongo.bulkWrite.apply(mongo, updatedGames);

	// Close the database
	mongo.closeDatabase();
});