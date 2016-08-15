/**
 * @module SelectGameDAO
 */

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('q'),
	mongo = global.OwlStakes.require('data/DAO/utility/databaseDriver');

// ----------------- ENUMS/CONSTANTS --------------------------

var GAMES_COLLECTION = 'nflGames',
	DATA_TIMEFRAME_COLLECTION = 'timeframes';

// ----------------- MODULE DEFINITION --------------------------
module.exports =
{
	/**
	 * Function responsible for fetching all games that take place within a given regular season week in a given season
	 *
	 * @param {Number} week - the week in which to search for games
	 * @param {Number} season - the year in which to search for games
	 *
	 * @returns {Array<Object>} - a collection of all games that take place within a particular week in a
	 * 		particular season
	 *
	 * @author kinsho
	 */
	fetchGamesByWeek: _Q.async(function* (week, season)
	{
		return yield mongo.read(GAMES_COLLECTION,
		{
			week : week,
			season: season
		},
		{
			id : 1
		});
	}),

	/**
	 * Function responsible for fetching all seasons and regular season weeks for which we have in-depth data
	 *
	 * @returns {Object} - a two-dimensional map detailing seasons and regular-season weeks for which we
	 * 		have data
	 *
	 * @author kinsho
	 */
	fetchSeasonsAndActiveWeeks: _Q.async(function* ()
	{
		var data = yield mongo.read(DATA_TIMEFRAME_COLLECTION, {});

		// Drop the ID property from the database record
		delete data[0]._id;

		return data[0];
	})
};