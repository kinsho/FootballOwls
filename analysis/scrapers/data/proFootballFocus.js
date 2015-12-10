// ----------------- EXTERNAL MODULES --------------------------

// ----------------- PRIVATE VARIABLES --------------------------

// A value that must be generated dynamically to gain access to a protected page
var teamCodes =
	{
		1: 'Arizona Cardinals',
		2: 'Atlanta Falcons',
		3: 'Baltimore Ravens',
		4: 'Buffalo Bills',
		5: 'Carolina Panthers',
		6: 'Chicago Bears',
		7: 'Cincinnati Bengals',
		8: 'Cleveland Browns',
		9: 'Dallas Cowboys',
		10: 'Denver Broncos',
		11: 'Detroit Lions',
		12: 'Green Bay Packers',
		13: 'Houston Texans',
		14: 'Indianapolis Colts',
		15: 'Jacksonville Jaguars',
		16: 'Kansas City Chiefs',
		17: 'Miami Dolphins',
		18: 'Minnesota Vikings',
		19: 'New England Patriots',
		20: 'New Orleans Saints',
		21: 'New York Giants',
		22: 'New York Jets',
		23: 'Oakland Raiders',
		24: 'Philadelphia Eagles',
		25: 'Pittsburgh Steelers',
		26: 'St. Louis Rams',
		27: 'San Diego Chargers',
		28: 'San Francisco 49ers',
		29: 'Seattle Seahawks',
		30: 'Tampa Bay Buccaneers',
		31: 'Tennessee Titans',
		32: 'Washington Redskins'
	},

	// All the URLs to scrub in order to collect defense stats
	defenseURLs =
	[
		// Week 1
		'https://www.profootballfocus.com/data/gstats.php?tab=by_week&season=2015&wk=1&teamid=25&gameid=3406&stats=d',
		'https://www.profootballfocus.com/data/gstats.php?tab=by_week&season=2015&wk=1&teamid=19&gameid=3406&stats=d',
		'https://www.profootballfocus.com/data/gstats.php?tab=by_week&season=2015&wk=1&teamid=12&gameid=3407&stats=d',
		'https://www.profootballfocus.com/data/gstats.php?tab=by_week&season=2015&wk=1&teamid=6&gameid=3407&stats=d',
		'https://www.profootballfocus.com/data/gstats.php?tab=by_week&season=2015&wk=1&teamid=29&gameid=3408&stats=d',
		'https://www.profootballfocus.com/data/gstats.php?tab=by_week&season=2015&wk=1&teamid=26&gameid=3408&stats=d',
		'https://www.profootballfocus.com/data/gstats.php?tab=by_week&season=2015&wk=1&teamid=16&gameid=3409&stats=d',
		'https://www.profootballfocus.com/data/gstats.php?tab=by_week&season=2015&wk=1&teamid=13&gameid=3409&stats=d'
	];

// ----------------- MODULE DEFINITION --------------------------
module.exports =
{
	/**
	 * Finds the name of the team associated with the passed ID
	 *
	 * @param {Integer} teamId - the ID of the team to look up
	 *
	 * @returns {String} - the name of the team
	 *
	 * @author kinsho
	 */
	findTeamName: function (teamId)
	{
		return teamCodes[teamId];
	}
};