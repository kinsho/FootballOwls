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

// ----------------- PRIVATE VARIABLES --------------------------

var pfrTeamCodes =
	[
		'nwe',
		'buf',
		'mia',
		'nyj',
		'pit',
		'cin',
		'rav',
		'cle',
		'clt', // Colts
		'htx', // Houston
		'jax',
		'oti', // Tennessee
		'den',
		'kan',
		'sdg',
		'rai',
		'dal',
		'phi',
		'nyg',
		'was',
		'gnb',
		'det',
		'min',
		'chi',
		'car',
		'nor',
		'atl',
		'tam',
		'sea',
		'crd',
		'sfo',
		'ram'
	];

// ----------------- MODULE DEFINITION --------------------------
module.exports =
{
	/**
	 * Generator-ready function responsible for scraping all the HTML off any target website
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
	 * Little getter function to retrieve all the team codes that will need to be used to access Pro Football Reference pages
	 *
	 * @returns {Array<String>} a collection of team codes
	 *
	 * @author kinsho
	 */
	getPFRCodes: function ()
	{
		return pfrTeamCodes;
	}
};