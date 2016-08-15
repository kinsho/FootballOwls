/**
 * @module gatherAllLiveTimeframes
 */

// ----------------- APP_ROOT_PATH INSTANTIATION --------------------------

global.StatsOwl =
{
	require : require('app-root-path').require
};

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('Q'),
	mongo = global.StatsOwl.require('data/DAO/utility/databaseDriver');

// ----------------- ENUMS/CONSTANTS --------------------------

var DATABASE_GAMES_COLLECTION = 'nflGames',
	DATA_TIMEFRAME_COLLECTION = 'timeframes';

// ----------------- PRIVATE FUNCTIONS --------------------------

/**
 * Function responsible for instantiating a season timeframe object
 *
 * @returns {Object} - an initialized season timeframe mapping
 *
 * @author kinsho
 */
function instantiateSeason()
{
	var initializedSeason = {},
		i;

	for (i = 1; i <= 17; i++)
	{
		initializedSeason[i] = false;
	}

	return initializedSeason;
}

// ----------------- INTERPRETER LOGIC --------------------------

_Q.spawn(function* ()
{
	var games, game,
		liveTimeFrames = {},
		i;

	// Prep the database for data retrieval
	yield mongo.initialize();

	// Dump out all the old data
	mongo.deleteAllRecordsFromCollection(DATA_TIMEFRAME_COLLECTION);

	// Pull all processed game data from the database
	games = yield mongo.read(DATABASE_GAMES_COLLECTION, {});

	for (i = 0; i < games.length; i++)
	{
		game = games[i];

		// Collect a list of all seasons and weeks within those seasons for which we have data
		if ( !(liveTimeFrames[game.season]) )
		{
			liveTimeFrames[game.season] = instantiateSeason();
		}
		if ( !(liveTimeFrames[game.season][game.week]) )
		{
			liveTimeFrames[game.season][game.week] = true;
		}
	}

	// Construct and pass single reference record to be stored in the database
	yield mongo.bulkWrite(DATA_TIMEFRAME_COLLECTION, true, mongo.formInsertSingleQuery(liveTimeFrames));

	// Close the database
	mongo.closeDatabase();
});