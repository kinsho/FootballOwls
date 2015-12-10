// ----------------- APP_ROOT_PATH INSTANTIATION --------------------------

global.StatsOwl =
{
	require : require('app-root-path').require
};

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('Q'),
	_cheerio = require('cheerio'),
	scraper = global.StatsOwl.require('scrapers/base/proFootballFocusDriver'),
	mongo = global.StatsOwl.require('data/databaseDriver');

// ----------------- ENUMS/CONSTANTS --------------------------

// Note the placeholder in the URL string that allows us to load data from different teams
var STATS_URL = 'http://www.profootballfocus.com/data/cstats.php?tab=by_team&season=::season&teamid=::teamId&stats=d&stype=r&pre=REG',
	TEAM_ID_PLACEHOLDER_LABEL = '::teamId',
	SEASON_ID_PLACEHOLDER_LABEL = '::season',

	DATABASE_COLLECTION_NAME = 'passRush',
	YEAR_TO_ANALYZE = '2015';

// ----------------- SCRAPER LOGIC --------------------------

_Q.spawn(function* ()
{

	var teams = [],
		passRushAttempts,
		HTML, $,
		teamName,
		tableFooter,
		passRushColumn,
		i, j;

	// Use a loop to navigate through each team's page
	for (i = 1; i <= 32; i++)
	{
		HTML = yield scraper.scrape(STATS_URL.replace(TEAM_ID_PLACEHOLDER_LABEL, i).replace(SEASON_ID_PLACEHOLDER_LABEL, YEAR_TO_ANALYZE));
		// The following module must be dynamically referenced every time new HTML has been scraped
		$ = _cheerio.load(HTML);

		// Find out the name of the team concerned by the page in focus
		teamName = $('h1').html();
		teamName = teamName.substring(0, teamName.indexOf(' -'));

		// Isolate the part of the page that has the pass rushing stats
		passRushColumn = $('table.sortable tbody tr td:nth-child(5)');

		// Calculate the number of times and players that the team has rushed at quarterbacks
		passRushAttempts = 0;
		for (j = passRushColumn.length - 1; j >= 0; j--)
		{
			passRushAttempts += parseInt(passRushColumn.eq(j).text());
		}

		// Find the part of the page that has the other stats we want
		tableFooter = $('table.sortable tfoot tr');

		// Collect the stats
		teams.push(mongo.formInsertSingleQuery(
		{
			team: teamName,
			season: YEAR_TO_ANALYZE,
			passRushAttempts: passRushAttempts,
			sacks: parseInt(tableFooter.find('th:nth-child(7)').text()),
			hits: parseInt(tableFooter.find('th:nth-child(8)').text()),
			hurries: parseInt(tableFooter.find('th:nth-child(9)').text()),
			battedPasses: parseInt(tableFooter.find('th:nth-child(10)').text())
		}));

		// Log the stats in the console
		console.log('---');
		console.log(teams[i - 1].insertOne.document.team);
		console.log('TOTAL # OF PASS RUSH ATTEMPTS: ' + teams[i - 1].insertOne.document.passRushAttempts);
		console.log('SACKS: ' + teams[i - 1].insertOne.document.sacks);
		console.log('HITS: ' + teams[i - 1].insertOne.document.hits);
		console.log('HURRIES: ' + teams[i - 1].insertOne.document.hurries);
		console.log('BATTED PASSES: ' + teams[i - 1].insertOne.document.battedPasses);
		console.log('---');
	}

	// Prep the database for data insertion
	yield mongo.initialize();

	// Dump all the old stats (for the season being scraped) from the database
	yield mongo.bulkWrite(DATABASE_COLLECTION_NAME, true, mongo.formDeleteManyQuery(
	{
		season: YEAR_TO_ANALYZE
	}));

	// Push all the stats into the database
	teams.unshift(DATABASE_COLLECTION_NAME, true);
	yield mongo.bulkWrite.apply(mongo, teams);

	// Close the database
	mongo.closeDatabase();

});