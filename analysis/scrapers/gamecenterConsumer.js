// ----------------- APP_ROOT_PATH INSTANTIATION --------------------------

global.StatsOwl =
{
	require : require('app-root-path').require
};

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('Q'),
	scraper = global.StatsOwl.require('scrapers/base/nflGamecenterDriver'),
	keywords = global.StatsOwl.require('scrapers/base/nflGamecenterKeywords'),
	objectHelper = global.StatsOwl.require('utility/objectHelper'),
	mongo = global.StatsOwl.require('data/databaseDriver');

// ----------------- ENUMS/CONSTANTS --------------------------

// Note the placeholder in the URL string that allows us to load data from different teams
var DATABASE_URL_COLLECTION = 'gamecenterURLs',
	YEAR_TO_ANALYZE = '2015';

// ----------------- PRIVATE METHODS --------------------------

/**
 * Function that refactors the description of a play into a format amenable to later parsing
 *
 * @param {String} desc - the description of the play
 *
 * @returns {String} - a refactored description of the play
 */
function formatDescription(desc)
{
	// If the initial action on a play was reversed, the only relevant part of the description comes from the ruling
	// that comes after the reversal
	if (desc.indexOf(keywords.REVERSED_IDENTIFIER) > -1)
	{
		desc = desc.substring(desc.indexOf(keywords.REVERSED_IDENTIFIER) + 10);
	}

	return desc;
}

/**
 * Function indicating whether a play qualifies as a pass play
 *
 * @param {String} desc - the description of the play
 *
 * @returns {boolean} - indicates whether the play is a pass play
 */
function isPassPlay(desc)
{
	var identifiers = Object.keys(keywords.PASS_PLAY_IDENTIFIERS),
		i;

	for (i = identifiers.length - 1; i >= 0; i--)
	{
		if (desc.indexOf(identifiers[i]) > -1)
		{
			return true;
		}
	}

	return false;
}

/**
 * Function that determines the name of the passer or rusher driving the action in the play
 *
 * @param {String} desc - the description of the play
 *
 * @returns {String} - the name of the player driving the action in the play
 */
function findActor(desc)
{
	var words = desc ? desc.split(' ') : [],
		inParenthesesText = false,
		i;

	for (i = 0; i < words.length; i++)
	{
		// The first token not encapsulated within parentheses is the name of the actor driving the play
		if (words[i].charAt(0) === '(')
		{
			if (words[i].charAt(words[i].length - 1) !== ')')
			{
				inParenthesesText = true;
			}
			continue;
		}

		if ( !(inParenthesesText) )
		{
			return words[i];
		}

		// Once we see the a closing parenthesis, we can conclude that we are no longer within parenthetical text
		if (words[i].charAt(words[i].length - 1) === ')')
		{
			inParenthesesText = false;
		}
	}

	return '';
}

/**
 * Function that determines the name of the targeted receiver in a pass play
 *
 * @param {String} desc - the description of the play
 *
 * @returns {String} - the name of the player that was targeted in the pass play
 */
function findReceiver(desc)
{
	var words = desc ? desc.split(' ') : [],
		i;

	for (i = 0; i < words.length; i++)
	{
		// The receiver always follows the first use of the word 'to' or 'intended'
		if (words[i] === keywords.TO_IDENTIFIER)
		{
			return stripPeriod(words[i + 1]);
		}
		else if (words[i] === keywords.INTENDED_IDENTIFIER)
		{
			return (words[i + 2] ? stripPeriod(words[i + 2]) : '');
		}
	}

	return '';
}

/**
 * Function that determines the number of yards gained on a particular play
 *
 * @param {String} desc - the description of the play
 *
 * @returns {Number} - the number of yards gained on a play
 */
function findYardsGained(desc)
{
	var words = desc ? desc.split(' ') : [],
		parsedNumber,
		i;

	for (i = 0; i < words.length; i++)
	{
		// The receiver always follows the first use of the word 'to'
		if (words[i] === keywords.FOR_IDENTIFIER)
		{
			if (words[i + 1] === keywords.NO_IDENTIFIER)
			{
				return 0;
			}
			else
			{
				// Ensure that whatever is being returned is a valid number
				parsedNumber = parseInt(words[i + 1], 10);
				return ((isNaN(parsedNumber)) ? 0 : parsedNumber);
			}
		}
	}

	return 0;
}

/**
 * Function that strips the tail period off a keyword that may need to be recorded
 *
 * @param {String} word - the keyword to process
 *
 * @returns {String} - the processed keyword
 */
function stripPeriod(word)
{
	return (word.charAt(word.length - 1) === '.' ? word.substring(0, word.length - 1) : word);
}

// ----------------- SCRAPER LOGIC --------------------------

_Q.spawn(function* ()
{
	var urls,
		data,

		game = {},
		seasonGames = {},

		homeTeam,
		homeTeamScoringTrends,
		homeTeamPoints,

		awayTeam,
		awayTeamScoringTrends,
		awayTeamPoints,

		scorePlay,
		pointsToAdd,
		scoringPlays,
		pointDifferential,
		winner,

		drive,
		plays, play, previousPlayId, playIds,
		posTeam,
		playData,
		netYards,
		currentLoc,
		awayTeamPlays = [],
		homeTeamPlays = [],

		i, j, k;

	// Prep the database for data retrieval
	yield mongo.initialize();

	// Pull all relevant stats from the database
	urls = yield mongo.read(DATABASE_URL_COLLECTION, { season: YEAR_TO_ANALYZE });

	// Close the database
	mongo.closeDatabase();

	for (i = 0; i < urls.length; i++)
	{
		data = JSON.parse(yield scraper.scrape(urls[i].url));

		// Log the URL being parsed
		console.log(urls[i].url);

		// We only want the game data
		data = data[Object.keys(data)[0]];

		// Parse the high-level game data
		homeTeam = data.home.abbr;
		awayTeam = data.away.abbr;

		homeTeamPoints = 0;
		awayTeamPoints = 0;

		homeTeamScoringTrends = data.home.score;
		awayTeamScoringTrends = data.away.score;

		pointDifferential = Math.abs(homeTeamScoringTrends.T - awayTeamScoringTrends.T);
		scoringPlays = data.scrsummary;

		// Parse all the drives
		for (j = 1; j <= data.drives.crntdrv; j++)
		{
			drive = data.drives[j];

			posTeam = drive.posteam;

			plays = drive.plays;
			playIds = Object.keys(plays);

			// Parse all the plays
			for (k = 0; k < playIds.length; k++)
			{
				play = plays[playIds[k]];
				playData = {};
				netYards = 0; // Need this variable to calculate the number of yards gained on a play-by-play basis

				// Update the scores should any scoring have occurred on the previous play
				if (previousPlayId && scoringPlays[previousPlayId])
				{
					scorePlay = scoringPlays[previousPlayId];
					pointsToAdd = 0;

					// Calculate the total number of points that were scored during this play
					if (scorePlay.type === keywords.TD_RESULT)
					{
						pointsToAdd += 6;

						if (scorePlay.desc.indexOf(keywords.POINT_AFTER_TOUCHDOWN_SUCCESSFUL_IDENTIFIER) > -1)
						{
							pointsToAdd += 1;
						}
						else if ((scorePlay.desc.indexOf(keywords.TWO_POINT_CONVERSION_SUCCESSFUL_IDENTIFIER.PASS) > -1) ||
							(scorePlay.desc.indexOf(keywords.TWO_POINT_CONVERSION_SUCCESSFUL_IDENTIFIER.RUN) > -1))
						{
							pointsToAdd += 2;
						}
					}
					else if (scorePlay.type === keywords.FG_RESULT)
					{
						pointsToAdd += 3;
					}
					else if (scorePlay.type === keywords.DEFENSIVE_TWO_POINT_PLAY_IDENTIFIER.SAFETY_IDENTIFIER)
					{
						pointsToAdd += 2;
					}
					else if (scorePlay.desc.indexOf(keywords.DEFENSIVE_TWO_POINT_PLAY_IDENTIFIER.DEFENSIVE_TWO_POINT_CONVERSION) > -1)
					{
						pointsToAdd += 2;
					}

					// Now add the points scored to the point total of the team that scored those points
					if (scorePlay.team === homeTeam)
					{
						homeTeamPoints += pointsToAdd;
					}
					else
					{
						awayTeamPoints += pointsToAdd;
					}
				}

				// Record the ID of the current play to assess scoring implications when processing the next play
				previousPlayId = playIds[k];

				// Ignore special-team plays and other fringe plays
				if ((play.note in keywords.SPECIAL_TEAMS_PLAY_IDENTIFIERS) ||
					(play.note === keywords.TIMEOUT_KEYWORD) ||
					(play.note === keywords.PENALTY_RESULT) ||
					(play.desc.indexOf(keywords.KNEEL_KEYWORD) > -1) ||
					(play.desc.indexOf(keywords.KICKS_KEYWORD) > -1) ||
					(play.desc.indexOf(keywords.PUNTS_KEYWORD) > -1) ||
					(play.desc.indexOf(keywords.TWO_MINUTE_WARNING) > -1) ||
					(play.desc.indexOf(keywords.END_QUARTER) > -1) ||
					(play.desc.indexOf(keywords.END_GAME_IDENTIFIER) > -1))
				{
					continue;
				}

				// Information on where the ball is spotted
				currentLoc = play.yrdln.split(' ');
				if (currentLoc.length === 1)
				{
					currentLoc[1] = "50";
				}

				// Modify the play description into a format that ensures that we can easily parse the description
				play.desc = formatDescription(play.desc);

				playData.id = playIds[k];
				playData.homeTeamScore = homeTeamPoints;
				playData.awayTeamScore = awayTeamPoints;
				playData.quarter = play.qtr;
				playData.time = parseFloat(play.time.replace(':', '.'));
				playData.down = play.down;
				playData.ydsToFirstDown = play.ydstogo;
				playData.ydsToEndZone = (currentLoc[0] === posTeam ? 50 + (50 - parseInt(currentLoc[1], 10)) : parseInt(currentLoc[1], 10));
				playData.ydsGained = findYardsGained(play.desc);
				netYards = play.ydsnet;

				// Note that scrambling plays can be classified as aborted pass plays where the quarterback is forced
				// to collect yards by breaking the pocket and running
				if (isPassPlay(play.desc))
				{
					playData.type = keywords.PASS_MARKER;
					playData.passer = findActor(play.desc);
					playData.receiver = findReceiver(play.desc);
				}
				else
				{
					playData.type = keywords.RUSH_MARKER;
					playData.rusher = findActor(play.desc);
				}

				// Record any special result that may be associated with the play in context
				if (play.desc.indexOf(keywords.INTERCEPT_KEYWORD) > -1)
				{
					playData.interception = true;
				}
				else if (play.note === keywords.TD_RESULT)
				{
					playData.TD = true;
				}
				else if (play.note === keywords.FG_RESULT)
				{
					playData.FG = true;
				}
				else if (play.desc.indexOf(keywords.SACKED_RESULT) > -1)
				{
					playData.sacked = true;
				}
				else if (play.desc.indexOf(keywords.INCOMPLETE_PASS_KEYWORD) > -1)
				{
					playData.incomplete = true;
				}

				if (posTeam === homeTeam)
				{
					homeTeamPlays.push(objectHelper.cloneObject(playData));
				}
				else
				{
					awayTeamPlays.push(objectHelper.cloneObject(playData));
				}
			}

		}

		// Figure out the winner
		winner = homeTeamPoints > awayTeamPoints ? homeTeam : (awayTeamPoints > homeTeamPoints ? awayTeam : keywords.TIE_KEYWORD);

		// Construct the game object and set it within the games collection
		game.homeTeam = homeTeam;
		game.awayTeam = awayTeam;
		game.winner = winner;
		game.homeTeamPlays = homeTeamPlays;
		game.awayTeamPlays = awayTeamPlays;

		seasonGames[awayTeam + '@' + homeTeam] = objectHelper.cloneObject(game);
	}
});