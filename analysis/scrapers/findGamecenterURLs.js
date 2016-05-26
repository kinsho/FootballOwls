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
		processedURLs.push(mongo.formUpdateOneQuery(
		{
			id: urls[i].id
		},
		{
			season: YEAR_TO_ANALYZE,
			id: urls[i].id,
			url: urls[i].url
		}, true));
	}

	// Prep the database for data insertion
	yield mongo.initialize();

	// Write the new URLs into the database. Overwrite any that may already exist
	processedURLs.unshift(DATABASE_URL_COLLECTION, true);
	yield mongo.bulkWrite.apply(mongo, processedURLs);

	// Close the database
	mongo.closeDatabase();
});