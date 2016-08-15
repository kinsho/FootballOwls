// ----------------- EXTERNAL MODULES --------------------------

var _request = require('request'),
	_Q = require('Q'),
	_cheerio = require('cheerio');

// No need to reference this module again after it has been properly instantiated
// Only uncomment this block if you need to debug the scraper
/*
 require('request-debug')(request, function(type, data)
 {
 var util = require('util');

 console.log("TYPE: " + type);
 console.log("HEADERS: " + util.inspect(data.headers));
 });
 */

// ----------------- ENUMS/CONSTANTS --------------------------

// Note the placeholders in the URL string that allows us to load data from dynamically-generated URLs
var GC_URL = 'http://www.nfl.com/liveupdate/game-center/::index_gtd.json?random=::random',
	GC_BY_WEEK_URL = 'http://www.nfl.com/scores/::season/REG::week',
	ROSTER_URL = 'http://www.nfl.com/teams/roster?team=::teamCode',
	OLD_PLAYERS_URL = 'http://www.nfl.com/players/profile?id=::id',

	INDEX_PLACEHOLDER_LABEL = '::index',
	RANDOM_PLACEHOLDER_LABEL = '::random',
	SEASON_PLACEHOLDER_LABEL = '::season',
	WEEK_PLACEHOLDER_LABEL = '::week',
	TEAM_CODE_LABEL = '::teamCode',
	ID_LABEL = '::id',

	GC_LINK_CLASS = 'game-center-link',
	PLAYER_NAME_HREF_PREFIX = '"/player/"';

// ----------------- PRIVATE VARIABLES --------------------------

var headers =
	{
		'Cache-Control': 'max-age=0',
		'Connection': 'keep-alive',
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:39.0) Gecko/20100101 Firefox/39.0'
	},

	// The following variables will be used to construct date strings that will then be placed into the URL
	months = ['09', '10', '11', '12'],
	years = ['2015'],
	days = (function() // Need a function to properly instantiate an array with a range of stringified numbers
	{
		var dates = [],
			i;

		for (i = 1; i <= 31; i++)
		{
			dates.push(i < 10 ? '0' + i : i + '');
		}

		return dates;
	}()),
	gameIds = (function() // Need a function to properly instantiate an array with a range of stringified numbers
	{
		var idSet = [],
			i;

		for (i = 0; i <= 16; i++)
		{
			idSet.push(i < 10 ? '0' + i : i + '');
		}

		return idSet;
	}());

// ----------------- PRIVATE FUNCTIONS --------------------------

/**
 * Parses out the ID of the game from the URL string
 *
 * @param {String} url - the URL to parse
 *
 * @returns {String} - the ID of the game
 */
function parseGameIDFromLink(url)
{
	return url.split('/')[2];
}

/**
 * Parses out the ID of the player from the URL string
 *
 * @param {String} url - the URL to parse
 *
 * @returns {String} - the ID of the player
 */
function parsePlayerIDFromLink(url)
{
	var urlComponents = url.split('/');

	return parseInt(urlComponents[urlComponents.length - 2]) || 0;
}

/**
 * Reshuffles the name text so that the first name of a player naturally appears before his last name
 *
 * @param {String} name - the name of the player
 *
 * @returns {String} - the adjusted name
 */
function reorgName(name)
{
	return name.split(',').reverse().join(' ').trim();
}

// ----------------- I/O FUNCTION TRANSFORMATIONS --------------------------

var scraper = _Q.denodeify(_request);

// ----------------- MODULE DEFINITION --------------------------
module.exports =
{
	/**
	 * Generator-ready function responsible for scraping all the HTML off a particular GameCenter URL
	 *
	 * @param {String} url - the URL of the website that needs to be scraped
	 *
	 * @returns {Promise} a classical Deferred Promise
	 *
	 * @author kinsho
	 */
	scrape: function (url)
	{
		// Use a promise here instead of the default generator syntax due to the way data is
		// sent back from the request module
		var deferred = _Q.defer();

		_request(
			{
				url: url,
				headers: headers
			}, function(error, response, body)
			{
				deferred.resolve(body);
			});

		return deferred.promise;
	},

	/**
	 * Generator function responsible for determining the GameCenter URLs that return the JSON data we seek
	 *
	 * @returns {Array<Object>} - a collection of URLs that lead to data-rich JSON files
	 *
	 * @author kinsho
	 */
	findLegitURLs: _Q.async(function* ()
	{
		var validURLs = [],
			testURL,
			testIndex,
			response,
			m, y, d, g;

		// Loop through all availale dates and gameIDs and find out which URLs lead to valid game summary JSON
		for (y = 0; y < years.length; y++)
		{
			for (m = 0; m < months.length; m++)
			{
				for (d = 0; d < days.length; d++)
				{
					for (g = 0; g < gameIds.length; g++)
					{
						// Construct the new URL to test to see if it returns JSON data
						testIndex = years[y] + months[m] + days[d] + gameIds[g];
						testURL = GC_URL.replace(INDEX_PLACEHOLDER_LABEL, testIndex + '/' + testIndex)
							.replace(RANDOM_PLACEHOLDER_LABEL, Math.round(Math.random() * 100000000000));

						console.log("Testing " + testURL);

						response = yield scraper(
							{
								url: testURL,
								headers: headers
							});

						if (response.statusCode === 200)
						{
							validURLs.push(
							{
								id: testIndex,
								url: testURL
							});
						}
					}
				}
			}
		}

		return validURLs;
	}),

	/**
	 * Generator function responsible for helping us link games to the proper week of the regular season in which they
	 * take place
	 *
	 * @returns {Array<Object>} - a collection of games IDs and the weeks in which those games take place
	 *
	 * @author kinsho
	 */
	linkGamesToWeek: _Q.async(function* ()
	{
		var testURL,
			HTML, $,
			gcLinks,
			games = [],
			y, w, i;

		for (y = 0; y < years.length; y++)
		{
			for (w = 1; w <= 17; w++)
			{
				// Construct the URL that we need to pull game data for each week in a season
				testURL = GC_BY_WEEK_URL.replace(SEASON_PLACEHOLDER_LABEL, years[y])
					.replace(WEEK_PLACEHOLDER_LABEL, w);

				console.log("Pulling game data from " + testURL);

				// Pull the HTML from the schedule page
				HTML = yield scraper(
					{
						url: testURL,
						headers: headers
					});
				$ = _cheerio.load(HTML.body);

				// Collect all the individual links to each game's gamecenter page
				gcLinks = $('.' + GC_LINK_CLASS);

				// Process each link into a data construct that will be used to relate games to certain weeks in
				// our database
				for (i = 0; i < gcLinks.length; i++)
				{
					games.push(
					{
						week: w,
						gameId: parseGameIDFromLink(gcLinks[i].attribs.href)
					});
				}
			}
		}

		return games;
	}),

	/**
	 * Generator function responsible for helping us find player data through the examination of team rosters
	 *
	 * @param {String} teamCode - the club code needed to pull up a specific team's roster
	 *
	 * @returns {Object} - a collection of player metadata, indexed by their ID
	 *
	 * @author kinsho
	 */
	findPlayers: _Q.async(function* (teamCode)
	{
		// Construct the URL that we need to pull game data for each week in a season
		var url = ROSTER_URL.replace(TEAM_CODE_LABEL, teamCode),
			HTML, $,
			playerElements,
			playerName, playerId, playerProfileURLComponents,
			players = {},
			i;

		console.log("Pulling roster data from " + url);

		// Pull the HTML from the schedule page
		HTML = yield scraper(
			{
				url: url,
				headers: headers
			});
		$ = _cheerio.load(HTML.body);

		// Collect all the HTML elements containing player names and their associated IDs
		playerElements = $('a[href^=' + PLAYER_NAME_HREF_PREFIX + ']');

		for (i = playerElements.length - 1; i >= 0; i--)
		{
			// Parse out the player's name and his gamecenter ID from the element in context
			// Note that the player name needs to be altered so that the first name comes naturally before the last name
			playerName = reorgName(playerElements[i].children[0].data);
			playerId = parsePlayerIDFromLink(playerElements[i].attribs.href);

			players[playerId] = playerName;
		}

		return players;
	}),

	/**
	 * Generator function responsible for helping us find the new ID of a particular player by using their old ID
	 *
	 * @param {String} oldID - the old ID to use in order to uncover the new ID
	 *
	 * @returns {String} - the new ID associated with the old ID
	 *
	 * @author kinsho
	 */
	findCorrespondingID: _Q.async(function* (oldID)
	{
		var url = OLD_PLAYERS_URL.replace(ID_LABEL, oldID),
			response;

		console.log("Pulling page data from " + url);

		// Pull a response old link
		response = yield scraper(
			{
				url: url,
				headers: headers
			});

		// Parse and return the player ID from the response
		return parsePlayerIDFromLink(response.socket._httpMessage.path);
	})
};