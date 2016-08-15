/**
 * @module summarizer
 *
 * Module is responsible for organizing all data needed to successfully convey information about a team's rushing
 * offense and defense
 *
 * @author kinsho
 */

// ----------------- APP_ROOT_PATH INSTANTIATION --------------------------

global.OwlStakes =
{
	require : require('app-root-path').require
};

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('Q'),
	mongo = global.OwlStakes.require('data/DAO/utility/databaseDriver');

// ----------------- ENUMS/CONSTANTS --------------------------

var DATABASE_RUSH_GAMES_COLLECTION = 'rushGames',
//	DATABASE_SEASON_RUSH_STATS_COLLECTION = 'rushStats',
	YEAR_TO_ANALYZE = 2015,

	RUSH_KEYWORD = 'rush';

// ----------------- PRIVATE VARIABLES --------------------------

// The complete collection of season-wide rushing stats for each professional NFL team
var _seasonRushStats = {};

// ----------------- PRIVATE METHODS --------------------------

/**
 * Function responsible for generating a rusher record
 *
 * @param {String} name - the name of the player for which to instantiate this record
 * @param {Number} ydsGained - the yards a player has gained either over the course of a single game or multiple games
 * @param {Number} rushes - the number of times the player has attempted to run with the ball over the course of a
 * 		single game or multiple games
 * @param {Number} gradeTally - the total grade value that the player in context accumulated over the course of a game
 * 		or a season.
 *
 * @returns {Object} - a fully populated rusher record
 */
function populateRusherRecord(name, ydsGained, rushes, gradeTally)
{
	return {
		name: name,
		ydsGained: ydsGained,
		rushes: rushes,
		gradeTally: gradeTally,
		overallGrade: (rushes ? (gradeTally / rushes).toFixed(2) : 0)
	};
}

/**
 * Function responsible for plugging game-level rushing stats into a play summary record
 *
 * @param {Object} summaryRecord - a summary record that contains game-level data for a given team's offense/defense
 * @param {Number} rushes - the total number of rushes that the team attempted or defended against during the game in context
 * @param {Number} totalRushYards - the total number of yards gained by running with the ball
 * @param {Number} totalPoints - the sum of all the grades that were given to the team in context for its rushing offense
 * 		or rushing defense during a given game
 * @param {Object} [rushers] - a collection of rushers and their associated stats. Only passed for summary records that
 * 		pertain to team offenses
 *
 * @author kinsho
 */
function calculateSummaryData(summaryRecord, rushes, totalRushYards, totalPoints, rushers)
{
	summaryRecord.rushes = rushes;
	summaryRecord.ydsGained = totalRushYards;
	summaryRecord.gradeTally = totalPoints;
	summaryRecord.overallGrade = (rushes ? (totalPoints / rushes).toFixed(2) : 0);
	summaryRecord.rushers = rushers;
}

/**
 * Function responsible for updating season-wide stats with game-level rushing data
 *
 * @param {String} teamName - the code of the team who will have its record modified in some form
 * @param {String} group - the specific grouping of the team whose corresponding stats will be updated.
 * 		Only two permissible values are "offense" and "defense"
 * @param {Object} condensedGame - an abbreviated game record
 * @param {Number} rushes - the number of rushes that the team attempted or defended against for a given game
 * @param {Number} totalRushYards - the total number of yards gained by running with the ball in a given game
 * @param {Number} totalPoints - the sum of all the grades that were given to the team in context for its rushing offense
 * 		or rushing defense during a given game
 * @param {Object} game - a collection of data about the game itself
 * @param {Object} [rushers] - a collection of rushers and their associated stats. Only passed for summary records that
 * 		pertain to team offenses
 *
 * @author kinsho
 */
function updateSeasonStats(teamName, group, rushes, totalRushYards, totalPoints, game, rushers)
{
	var groupRecord;

	// Initialize a new record if one does not yet exist for the team in context
	_seasonRushStats[teamName] = _seasonRushStats[teamName] ||
		{
			offense:
			{
				rushes: 0,
				ydsGained: 0,
				gradeTally: 0,
				games: [],
				rushers: {},
			},
			defense:
			{
				ydsGained: 0,
				rushes: 0,
				games: [],
				gradeTally: 0,
			},
		};

	groupRecord = _seasonRushStats[teamName][group];

	// Update the group record with the passed rushing stats
	groupRecord.rushes += rushes;
	groupRecord.ydsGained += totalRushYards;
	groupRecord.gradeTally += totalPoints;
	groupRecord.overallGrade = (groupRecord.rushes ? (groupRecord.gradeTally / groupRecord.rushes).toFixed(2) : 0);
	groupRecord.games.push(
	{
		id: game.id,
		season: game.season,
		week: game.week,
		homeTeam: game.homeTeam,
		awayTeam: game.awayTeam,
		winner: game.winner,
		homeTeamScore: game.homeScore,
		awayTeamScore: game.awayScore,
		rushes: rushes,
		overallGrade: groupRecord.overallGrade
	});

	if (rushers)
	{
		groupRecord.rushers = fuseRusherRecords(groupRecord.rushers, rushers);
	}
}

/**
 * Function can gracefully merge two rusher datasets into one dataset that sums up stats on a player-by-player basis
 * Useful for calculating rushing stats for any player over the course of a season
 *
 * @param {Object} rusherSet1 - the first rusher record set to merge
 * @param {Object} rusherSet2 - the other rusher record set to merge
 *
 * @returns {Object} - a new rusher record sets that combines data from both of the passed datasets
 *
 * @author kinsho
 */
function fuseRusherRecords(rusherSet1, rusherSet2)
{
	var rushers = new Set( Object.keys(rusherSet1).concat(Object.keys(rusherSet2)) ),
		mergedResult = {};

	rushers.forEach((stats, rusher) =>
	{
		// Should the rusher only have a record in one of the datasets to be merged, create a blank record
		// for that rusher in the other dataset
		if ( !(rusherSet1[rusher]) )
		{
			rusherSet1[rusher] =
			{
				ydsGained: 0,
				rushes: 0,
				gradeTally: 0
			};
		}
		else if ( !(rusherSet2[rusher]) )
		{
			rusherSet2[rusher] =
			{
				ydsGained: 0,
				rushes: 0,
				gradeTally: 0
			};
		}

		mergedResult[rusher] = populateRusherRecord(
			rusherSet1[rusher].name || rusherSet2[rusher].name,
			rusherSet1[rusher].ydsGained + rusherSet2[rusher].ydsGained,
			rusherSet1[rusher].rushes + rusherSet2[rusher].rushes,
			rusherSet1[rusher].gradeTally + rusherSet2[rusher].gradeTally
		);
	});

	return mergedResult;
}

// ----------------- MODULE LOGIC --------------------------

_Q.spawn(function* ()
{
	var games, offensivePlays, defensivePlays, playIds,
		game, offensivePlay,
		offenseSummary, defenseSummary, totalRushYardage,
		numOfRushingPlays, offensiveGradeTally, defensiveGradeTally,
		rusher, rushers,
		rushGames = [],
		i, j, k;

	// Prep the database for data retrieval
	yield mongo.initialize();

	// Pull all relevant stats from the database
	games = yield mongo.read(DATABASE_RUSH_GAMES_COLLECTION, { season: YEAR_TO_ANALYZE });

	for (i = 0; i < games.length; i++)
	{
		// Initialize the data for organization
		game = games[i];
		offensivePlays = [game.homeTeamOffensivePlays, game.awayTeamOffensivePlays];
		defensivePlays = [game.awayTeamDefensivePlays, game.homeTeamDefensivePlays];

		// We only need to run the next loop twice, once for plays from the home team and once for plays from the
		// away team
		for (j = 0; j <= 1; j++)
		{
			// Fetch the IDs of all the plays to iterate over
			playIds = Object.keys(offensivePlays[j]);

			// Initialize the metrics use to assess an overall grade on a team's rushing offense and defense
			offensiveGradeTally = 0;
			defensiveGradeTally = 0;
			numOfRushingPlays = 0;
			totalRushYardage = 0;
			rushers = {};

			for (k = 0; k < playIds.length; k++)
			{
				offensivePlay = offensivePlays[j][playIds[k]];

				if (offensivePlay.type === RUSH_KEYWORD)
				{
					// In order to more conveniently gauge a team's rushing offense and defense over the course of a season,
					// we track the number of rushes in every game and keep a running tally of all the grades in these games
					// so that we can compute a grade average after each game is processed
					offensiveGradeTally += offensivePlay.rushGrade;
					defensiveGradeTally += (5 - offensivePlay.rushGrade);
					numOfRushingPlays += 1;
					totalRushYardage += offensivePlay.ydsGained;

					// We also look to maintain statistical and interpretive rushing metrics for each runner as well
					rusher = offensivePlay.rusher;
console.log(playIds[k]);
console.log(offensivePlay);
					if ( !(rushers[rusher.id]) )
					{
						// Instantiate a new record for a player that has not been recorded down yet as a rusher
						rushers[rusher.id] = populateRusherRecord(rusher.name, 0, 0, 0);
					}

					rushers[rusher.id].ydsGained += offensivePlay.ydsGained;
					rushers[rusher.id].rushes += 1;
					rushers[rusher.id].gradeTally += offensivePlay.rushGrade;
					rushers[rusher.id].overallGrade = ((rushers[rusher.id].gradeTally / rushers[rusher.id].rushes).toFixed(2));
				}
			}

			offenseSummary = offensivePlays[j][99999];
			defenseSummary = defensivePlays[j][99999];

			// Update each summary record with game-level rushing stats
			calculateSummaryData(offenseSummary, numOfRushingPlays, totalRushYardage, offensiveGradeTally, rushers);
			calculateSummaryData(defenseSummary, numOfRushingPlays, totalRushYardage, defensiveGradeTally);

			// Update season stats with the game-level rushing stats as well, in addition to game-related metadata
			if (j)
			{
				updateSeasonStats(game.awayTeam, 'offense', numOfRushingPlays, totalRushYardage, offensiveGradeTally, game, rushers);
				updateSeasonStats(game.homeTeam, 'defense', numOfRushingPlays, totalRushYardage, defensiveGradeTally, game);
			}
			else
			{
				updateSeasonStats(game.homeTeam, 'offense', numOfRushingPlays, totalRushYardage, offensiveGradeTally, game, rushers);
				updateSeasonStats(game.awayTeam, 'defense', numOfRushingPlays, totalRushYardage, defensiveGradeTally, game);
			}

			// Construct the game record that will be stored within the database
			rushGames.push(mongo.formUpdateOneQuery(
			{
				id: game.id
			}, game, true));
		}
	}

	// Write the new games into a specialized collection meant to house game data that includes greater metadata about
	// rushing stats. Overwrite any old data for these same games
	rushGames.unshift(DATABASE_RUSH_GAMES_COLLECTION, true);
	//	yield mongo.bulkWrite.apply(mongo, rushGames);

console.log(_seasonRushStats.CAR);

	// Close the database
	mongo.closeDatabase();
});