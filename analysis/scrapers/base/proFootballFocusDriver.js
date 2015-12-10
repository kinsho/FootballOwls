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

// A value that must be generated dynamically to gain access to a protected page
var cookie = 'amember_nr=e25a7236de15665750fd4d2c26db7bda; expires=Thu, 15 Oct 2015 23:08:04 GMT; path=/; domain=.profootballfocus.com',
	headers =
	{
		'Cookie': cookie,
		'Cache-Control': 'max-age=0',
		'Connection': 'keep-alive',
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:39.0) Gecko/20100101 Firefox/39.0'
	};

// ----------------- MODULE DEFINITION --------------------------
module.exports =
{
	/**
	 * Generator-ready function responsible for scraping all the HTML off any target website
	 *
	 * @param {String} url - the URL of the website that needs to be scraped
	 *
	 * @returns {Promise} - a classical Deferred Promise
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
	}
};