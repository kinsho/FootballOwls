/**
 * @module GameDetailsDAO
 */

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('q'),
	mongo = global.OwlStakes.require('data/DAO/utility/databaseDriver');

// ----------------- ENUMS/CONSTANTS --------------------------

var GAMES_COLLECTION = 'nflGames';

// ----------------- MODULE DEFINITION --------------------------

module.exports =
{
	/**
	 * Function responsible for fetching details for any one game using its unique identifier
	 *
	 * @param {String} gameID - the ID of the game for which to fetch details
	 *
	 * @returns {Object} - the record containing vital details about the game in context
	 *
	 * @author kinsho
	 */
	fetchGameById: _Q.async(function* (gameID)
	{
		var gameRecord =  yield mongo.read(GAMES_COLLECTION,
			{
				id : gameID
			});

		return gameRecord[0];
	})
};