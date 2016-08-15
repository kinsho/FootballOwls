// ----------------- APP_ROOT_PATH INSTANTIATION --------------------------

global.OwlStakes =
{
	require : require('app-root-path').require
};

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('Q'),
	rangeCalculator = global.OwlStakes.require('interpreter/runningEfficiency/rangeCalculator'),
	mongo = global.OwlStakes.require('data/DAO/utility/databaseDriver');

// ----------------- ENUMS/CONSTANTS --------------------------

var DATABASE_GAMES_COLLECTION = 'nflGames',
	DATABASE_RUSH_GAMES_COLLECTION = 'rushGames',
	YEAR_TO_ANALYZE = 2015,

	RUSH_KEYWORD = 'rush';

// ----------------- PRIVATE METHODS --------------------------

/**
 * Function grades a run according to the passed grade range and modifier factor
 *
 * @param {Object} play - the play to rate
 * @param {Object} gradeRange - the grading tiers to use to rate the play
 * @param {Number} modifier - a number that will be used to adjust the grading tiers in special circumstances
 *
 * @returns {Number} - the grade, represented as a number ranging from -1 to 6, inclusive
 *
 * @author kinsho
 */
function gradePlay(play, gradeRange, modifier)
{
	var progressPercentage = play.ydsGained / play.ydsToFirstDown,
		i;

	// All negative-yardage rushing plays are graded as -1
	if (play.ydsGained < 0)
	{
		return -1;
	}

	// All big rushes are graded as 6, provided those rushes resulted in a new set of downs or a score
	if ((play.ydsGained >= 15) && (progressPercentage >= 1))
	{
		return 6;
	}

	// In the red zone, the bar for a rush to qualify as a big play is set lower, at 10 yards instead of 20 yards
	if ((play.ydsToEndZone <= 20) && (play.ydsGained >= 10) && (progressPercentage >= 1))
	{
		return 6;
	}

	// Categorize each grade within the range accordingly depending on whether that grade represents
	// a percentage value or an absolute value
	for (i = 1; i <= 5; i++)
	{
		gradeRange[i] =
		{
			grade: gradeRange[i],
			isPercentage: ( !(Number.isInteger(gradeRange[i])) || (gradeRange[i] === 1) )
		};
	}

	// Apply the modifier factor to the grade range
	for (i = 1; i <= 5; i++)
	{
		gradeRange[i].grade *= modifier;
	}

	// Now use the possibly modified grade range to rate the play
	for (i = 1; i <= 5; i++)
	{
		// If the grade in context represents a percentage amount, use that float to gauge progress made on a running play
		if ( (gradeRange[i].isPercentage) && (progressPercentage < gradeRange[i].grade) )
		{
			break;
		}
		// Else use the grade to rate the play based on the total number of yards gained
		else if (play.ydsGained < gradeRange[i].grade)
		{
			break;
		}
	}

	return i - 1;
}

// ----------------- MODULE LOGIC --------------------------

_Q.spawn(function* ()
{
	var games, offensivePlays, defensivePlays, playIds,
		game, offensivePlay, defensivePlay,
		modifier, gradeRange, grade,
		gradedGames = [],
		i, j, k;

	// Prep the database for data retrieval
	yield mongo.initialize();

	// Dump all old data from the collection
	yield mongo.deleteAllRecordsFromCollection(DATABASE_RUSH_GAMES_COLLECTION);

	// Pull all relevant stats from the database
	games = yield mongo.read(DATABASE_GAMES_COLLECTION, { season: YEAR_TO_ANALYZE });

	for (i = 0; i < games.length; i++)
	{
		// Initialize the data for interpretation and collection
		game = games[i];
		offensivePlays = [game.homeTeamOffensivePlays, game.awayTeamOffensivePlays];
		defensivePlays = [game.awayTeamDefensivePlays, game.homeTeamDefensivePlays];

		// We only need to run the next loop twice, once for plays from the home team and once for plays from the
		// away team
		for (j = 0; j <= 1; j++)
		{
			// Fetch the IDs of all the plays to iterate over
			playIds = Object.keys(offensivePlays[j]);

			for (k = 0; k < playIds.length; k++)
			{
				offensivePlay = offensivePlays[j][playIds[k]];
				defensivePlay = defensivePlays[j][playIds[k]]; // We need the defensive play solely to record rush defense grades

				if (offensivePlay.type === RUSH_KEYWORD)
				{
					// Collect the information needed to properly grade the running play
					modifier = rangeCalculator.findModifier(offensivePlay, (j === 0));
					gradeRange = rangeCalculator.findRange(offensivePlay);

					// Now grade the play
					grade = gradePlay(offensivePlay, gradeRange, modifier);

					// Record the grade for both the offense and the defense
					offensivePlay.rushGrade = grade;
					defensivePlay.rushGrade = 5 - grade;
				}
				// Prune all plays that are not rush plays or summary plays
				else if ( (offensivePlay.type !== RUSH_KEYWORD) && (playIds[k] !== '99999') )
				{
					delete offensivePlays[j][playIds[k]];
					delete defensivePlays[j][playIds[k]];
				}
			}
		}

		// Construct the new game record that will be stored within the database
		gradedGames.push(mongo.formInsertSingleQuery(game));
	}

	// Write the new games into the database
	gradedGames.unshift(DATABASE_RUSH_GAMES_COLLECTION, true);
	yield mongo.bulkWrite.apply(mongo, gradedGames);

	// Close the database
	mongo.closeDatabase();
});