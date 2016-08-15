/**
 * @module GameDetailsController
 */

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('q'),
	controllerHelper = global.OwlStakes.require('controllers/utility/ControllerHelper'),
	templateManager = global.OwlStakes.require('utility/templateManager'),
	nflTeamFullNames = global.OwlStakes.require('shared/constants/nflTeamFullNames'),
	nflTeamShortNames = global.OwlStakes.require('shared/constants/nflTeamShortNames'),
	DAO = global.OwlStakes.require('data/DAO/gameDetailsDAO');

// ----------------- ENUMS/CONSTANTS --------------------------

var GAME_DETAILS_FOLDER = 'gameDetails',

	MAIN_TEMPLATE = 'gameDetails',
	RUNNING_EFFICIENCY_TEMPLATE = 'runEfficiency',
	RUNNING_PLAYS_LISTING_TEMPLATE = 'runPlays';

// ----------------- PRIVATE FUNCTIONS --------------------------

// ----------------- MODULE DEFINITION --------------------------
module.exports =
{
	/**
	 * Initializer function
	 *
	 * @author kinsho
	 */
	init: _Q.async(function* ()
	{
		console.log('Loading the game details page...');


	})

};