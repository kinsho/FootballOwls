// ----------------- APP_ROOT_PATH INSTANTIATION --------------------------

global.StatsOwl =
{
	require : require('app-root-path').require
};

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('Q'),
	scraper = global.StatsOwl.require('scrapers/base/nflGamecenterDriver'),
	mongo = global.StatsOwl.require('data/databaseDriver');

// ----------------- ENUMS/CONSTANTS --------------------------

// Note the placeholder in the URL string that allows us to load data from different teams
var DATABASE_URL_COLLECTION = 'gamecenterURLs',
	YEAR_TO_ANALYZE = '2015';

// ----------------- SCRAPER LOGIC --------------------------

_Q.spawn(function* ()
{
	var urls = yield scraper.findLegitURLs(),
		processedURLs = [],
		i;

	// Process the URLs into queries that can be inserted into the database
	for (i = 0; i < urls.length; i++)
	{
		processedURLs.push(mongo.formInsertSingleQuery({
			season: YEAR_TO_ANALYZE,
			url: urls[i]
		}));
	}

	// Prep the database for data insertion
	yield mongo.initialize();

	// Dump all the old URLs (for the season being scraped) from the database
	yield mongo.bulkWrite(DATABASE_URL_COLLECTION, true, mongo.formDeleteManyQuery(
	{
		season: YEAR_TO_ANALYZE
	}));

	// Push all the URLs into the database
	processedURLs.unshift(DATABASE_URL_COLLECTION, true);
	yield mongo.bulkWrite.apply(mongo, processedURLs);

	// Close the database
	mongo.closeDatabase();
});