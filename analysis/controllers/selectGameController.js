/**
 * @module SelectGameController
 */

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('q'),
	controllerHelper = global.OwlStakes.require('controllers/utility/ControllerHelper'),
	templateManager = global.OwlStakes.require('utility/templateManager'),
	nflTeamFullNames = global.OwlStakes.require('shared/constants/nflTeamFullNames'),
	nflTeamShortNames = global.OwlStakes.require('shared/constants/nflTeamShortNames'),
	DAO = global.OwlStakes.require('data/DAO/selectGameDAO');

// ----------------- ENUMS/CONSTANTS --------------------------

var SELECT_GAME_FOLDER = 'selectGame',

	MAIN_TEMPLATE = 'selectGame',
	GAME_TEMPLATE = 'games';

// ----------------- PRIVATE FUNCTIONS --------------------------

/**
 * Function responsible for massaging game data into a format ready for display on the "select game" page
 *
 * @param {Array<Object>} games - the collection of games to format
 *
 * @return {Object} - a massaged collection of games ready to be fed into a handlebars template
 *
 * @author kinsho
 */
function formatGamesForDisplay(games)
{
	var i;

	for (i = games.length - 1; i >= 0; i--)
	{
		games[i].isHomeWinner = (games[i].winner === games[i].homeTeam);

		games[i].homeTeamName = nflTeamFullNames[games[i].homeTeam];
		games[i].awayTeamName = nflTeamFullNames[games[i].awayTeam];
		games[i].homeTeamImageMarker = nflTeamShortNames[games[i].homeTeam].toLowerCase();
		games[i].awayTeamImageMarker = nflTeamShortNames[games[i].awayTeam].toLowerCase();
	}

	return {
		games: games
	};
}

/**
 * Function responsible for finding the greatest value in an array of numbers
 *
 * @param {Array<Number | String>} arr - an array of integers or strings representing integers
 *
 * @returns {Number} - the greatest numerical value from that array
 */
function findGreatestValue(arr)
{
	var i;

	for (i = arr.length - 1; i >= 0; i--)
	{
		arr[i] = parseInt(arr[i], 10);
	}

	return arr.sort((a, b) => { return a - b; }).pop();
}

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
		var gameData,
			seasonData,
			pageData,
			initialSeason, initialWeek,
			populatedGameTemplate,
			populatedPageTemplate;

		console.log('Loading the select game page...');

		// Fetch all the data needed to correctly instantiate the top part of the page
		seasonData = yield DAO.fetchSeasonsAndActiveWeeks();

		// Find out what games should be initially displayed on the page when it loads
		initialSeason = findGreatestValue(Object.keys(seasonData));
		initialWeek = findGreatestValue(Object.keys(seasonData[initialSeason]));

		// Fetch and process the initial games data
		gameData = yield DAO.fetchGamesByWeek(initialWeek, initialSeason);
		populatedGameTemplate = yield templateManager.populateTemplate(formatGamesForDisplay(gameData), SELECT_GAME_FOLDER, GAME_TEMPLATE);

		// Organize the data that needs to be displayed on the page
		pageData =
		{
			weeks: Object.keys(seasonData[initialSeason]),
			seasons: Object.keys(seasonData),
			gamesTemplate: populatedGameTemplate
		};

		// Now render the page template
		populatedPageTemplate = yield templateManager.populateTemplate(pageData, SELECT_GAME_FOLDER, MAIN_TEMPLATE);

		return yield controllerHelper.renderInitialView(populatedPageTemplate, SELECT_GAME_FOLDER,
			{
				seasonData: seasonData,
				initialSeason: initialSeason,
				initialWeek: initialWeek
			});
	}),

	/**
	 * Action function to fetch games by any week in a given season
	 *
	 * @params {Object} params
	 * 		{
	 * 			season : Number
	 * 			week : Number (1 - 17)
	 * 		}
	 *
	 * @return {JSON}
	 *
	 * @author kinsho
	 */
	findGamesBySeasonWeek: _Q.async(function* (params)
	{
		console.log('Invoking the findGamesBySeasonWeek method in selectGameController');
		console.log('Fetching games for week ' + params.week + ' of ' + params.season);

		// Fetch and format the games data for whatever week and season is specified by the parameters
		var gameData = yield DAO.fetchGamesByWeek(parseInt(params.week, 10), parseInt(params.season, 10)),
			populatedGameTemplate = yield templateManager.populateTemplate(formatGamesForDisplay(gameData), SELECT_GAME_FOLDER, GAME_TEMPLATE),
			response = { gamesHTML : populatedGameTemplate };

		return JSON.stringify(response);
	})
};