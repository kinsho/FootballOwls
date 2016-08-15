// ----------------- APP_ROOT_PATH INSTANTIATION --------------------------

global.OwlStakes =
{
	require : require('app-root-path').require
};

// ----------------- EXTERNAL MODULES --------------------------

var pinnedRanges = global.OwlStakes.require('interpreter/runningEfficiency/pinnedRanges'),
	redZoneRanges = global.OwlStakes.require('interpreter/runningEfficiency/redZoneRanges'),
	midfieldRanges = global.OwlStakes.require('interpreter/runningEfficiency/midfieldRanges'),
	modifiers = global.OwlStakes.require('interpreter/runningEfficiency/modifiers'),
	objectHelper = global.OwlStakes.require('utility/objectHelper');

// ----------------- ENUMS/CONSTANTS --------------------------

var AND_KEYWORD = 'AND',

	FIRST_KEYWORD = 'FIRST',
	SECOND_KEYWORD = 'SECOND',
	THIRD_KEYWORD = 'THIRD',
	FOURTH_KEYWORD = 'FOURTH',

	SHORT_KEYWORD = 'SHORT',
	MID_KEYWORD = 'MID',
	LONG_KEYWORD = 'LONG';

// ----------------- PRIVATE METHODS --------------------------

// ----------------- MODULE LOGIC --------------------------

module.exports =
{
	/**
	 * The function finds the proper grade range that will be used to assess the play. Each play will be assessed
	 * according to its own circumstances
	 *
	 * @param {Object} play - the play metadata to analyze in order to find the proper grade range
	 *
	 * @returns {Object} - the grade range
	 *
	 * @author kinsho
	 */
	findRange: function(play)
	{
		var rangeSet,
			rangeName = '';

		// Find out which set of ranges to use depending on the distance the offense has to travel to reach the end zone
		if (play.ydsToEndZone > 85)
		{
			rangeSet = pinnedRanges;
		}
		else if (play.ydsToEndZone <= 20)
		{
			rangeSet = redZoneRanges;
		}
		else
		{
			rangeSet = midfieldRanges;
		}

		// Now find out the particular range to use from the set of ranges that were selected earlier
		// Construct the key that will be used to fetch the desired range from the range set

		// The first part of the key is the down of the play
		if (play.down === 1)
		{
			rangeName += FIRST_KEYWORD;
		}
		else if (play.down === 2)
		{
			rangeName += SECOND_KEYWORD;
		}
		else if (play.down === 3)
		{
			rangeName += THIRD_KEYWORD;
		}
		else
		{
			rangeName += FOURTH_KEYWORD;
		}

		// The second part of the key is the 'and' keyword
		rangeName += '_' + AND_KEYWORD + '_';

		// The last part of the key deals with the distance left before the team earns a new set of downs or scores a TD
		if (play.ydsToFirstDown >= 8)
		{
			rangeName += LONG_KEYWORD;
		}
		else if (play.ydsToFirstDown <= 3)
		{
			rangeName += SHORT_KEYWORD;
		}
		else
		{
			rangeName += MID_KEYWORD;
		}

		// Now return the range that will be used to assess the running play
		return objectHelper.cloneObject(rangeSet[rangeName]);
	},

	/**
	 * The function finds out whether the play's circumstances merit that a modifier be used to adjust the grade range
	 * prior to assessing the play
	 *
	 * @param {Object} play - the play metadata to analyze in order to find an appropriate range modifier, should the
	 * 		play's circumstances dictate the need for such a modifier
	 * @param {boolean} isHomeTeam - flag used to indicate whether it is the home team running the ball
	 *
	 * @returns {Number} - the modifier to apply to the grade range prior to assessing the play. The modifier will be
	 * 		multiplied against all the values in the range
	 *
	 * @author kinsho
	 */
	findModifier: function(play, isHomeTeam)
	{
		var modifier = 1.0,
			scoreDifferential = play.homeTeamScore - play.awayTeamScore,
			isLeading = isHomeTeam ? scoreDifferential > 0 : scoreDifferential < 0,
			isDominating = Math.abs(scoreDifferential) >= 14;

		// When the final minutes of the game are running down, run plays are to be scored differently depending on
		// whether the team doing the running is leading or losing
		if ((play.quarter === 4) && (play.time < 2))
		{
			modifier = (isLeading ? modifiers.TWO_MINUTES_LEFT_AND_AHEAD : modifiers.TWO_MINUTES_LEFT_AND_BEHIND);
		}
		// Run plays are to be scored differently should the team doing the running be ahead or behind by two scores
		else if (isDominating)
		{
			modifier = (isLeading ? modifiers.LEADING_BY_TWO_SCORES : modifiers.BEHIND_BY_TWO_SCORES);
		}

		return modifier;
	}
};