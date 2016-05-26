// ----------------- EXTERNAL MODULES --------------------------

var _request = require('request'),
	_Q = require('Q');

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

// Note the placeholder in the URL string that allows us to load data from different URLs
var GC_URL = 'http://www.nfl.com/liveupdate/game-center/::index_gtd.json?random=::random',
	INDEX_PLACEHOLDER_LABEL = '::index',
	RANDOM_PLACEHOLDER_LABEL = '::random';

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
	 * @returns {Array<String>} a collection of URLs that lead to data-rich JSON files
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
	})

};