// ----------------- APP_ROOT_PATH INSTANTIATION --------------------------

global.StatsOwl =
{
	require : require('app-root-path').require
};

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('Q'),
	_cheerio = require('cheerio'),
	scraper = global.StatsOwl.require('scrapers/base/proFootballFocusDriver'),
	mongo = global.StatsOwl.require('data/DAO/utility/databaseDriver');

// ----------------- ENUMS/CONSTANTS --------------------------

// Note the placeholder in the URL string that allows us to load data from different teams
var STATS_URL = 'https://www.profootballfocus.com/data/by_week.php?tab=by_week&season=::season&wk=::week',
	TEAM_ID_PLACEHOLDER_LABEL = '::week',
	SEASON_ID_PLACEHOLDER_LABEL = '::season',

	DATABASE_COLLECTION_NAME = 'passProtection',
	YEAR_TO_ANALYZE = '2015';

// ----------------- SCRAPER LOGIC --------------------------

_Q.spawn(function* ()
{

	var teams = [],
		passBlockAttempts,
		HTML, $,
		teamName,
		tableFooter,
		passBlockColumn,
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

		// Isolate the part of the page that has the pass protection stats
		passBlockColumn = $('table.sortable tbody tr td:nth-child(7)');

		// Calculate the number of times and the players involved when teams protected the quarterbacks
		passBlockAttempts = 0;
		for (j = passBlockColumn.length - 1; j >= 0; j--)
		{
			passBlockAttempts += parseInt(passBlockColumn.eq(j).text());
		}

		// Find the part of the page that has the other stats we want
		tableFooter = $('table.sortable tfoot tr');

		// Collect those stats
		teams.push(mongo.formInsertSingleQuery(
			{
				team: teamName,
				season: YEAR_TO_ANALYZE,
				passBlockAttempts: passBlockAttempts,
				sacksAllowed: parseInt(tableFooter.find('th:nth-child(9)').text()),
				hitsAllowed: parseInt(tableFooter.find('th:nth-child(10)').text()),
				hurriesAllowed: parseInt(tableFooter.find('th:nth-child(11)').text()),
			}));

		// Log the stats in the console
		console.log('---');
		console.log(teams[i - 1].insertOne.document.team);
		console.log('TOTAL # OF PASS BLOCK ATTEMPTS: ' + teams[i - 1].insertOne.document.passBlockAttempts);
		console.log('SACKS ALLOWED: ' + teams[i - 1].insertOne.document.sacksAllowed);
		console.log('HITS ALLOWED: ' + teams[i - 1].insertOne.document.hitsAllowed);
		console.log('HURRIES ALLOWED: ' + teams[i - 1].insertOne.document.hurriesAllowed);
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