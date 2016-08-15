// ----------------- APP_ROOT_PATH INSTANTIATION --------------------------

global.OwlStakes =
{
	require : require('app-root-path').require
};

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('Q'),
	scraper = global.OwlStakes.require('scrapers/base/nflGamecenterDriver'),
	keywords = global.OwlStakes.require('scrapers/base/nflGamecenterKeywords'),
	objectHelper = global.OwlStakes.require('utility/objectHelper'),
	mongo = global.OwlStakes.require('data/DAO/utility/databaseDriver');

// ----------------- ENUMS/CONSTANTS --------------------------

var DATABASE_URL_COLLECTION = 'gamecenterURLs',
	DATABASE_GAMES_COLLECTION = 'nflGames',
	PLAYERS_COLLECTION = 'players',

	YEAR_TO_ANALYZE = 2015,
	GAMECENTER_KEYWORD = 'nflGamecenter';

// ----------------- PRIVATE VARIABLES --------------------------

var _gamecenterPlayerIds,
	_idConversionCache = {}; // A cache of old IDs mapped to their new IDs. Useful in cutting down on outside requests

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
 * Function that can determine the points to add to the score total based on the end result of any scoring play
 *
 * @param {Object} play - the play to analyze
 *
 * @returns {Number} - the number of points to add to the scoring team's score
 */
function assessScoringPlay(play)
{
	var pointsToAdd = 0;

	// Calculate the total number of points that were scored during this play
	if (play.type === keywords.TD_RESULT)
	{
		pointsToAdd += 6;

		if (play.desc.indexOf(keywords.POINT_AFTER_TOUCHDOWN_SUCCESSFUL_IDENTIFIER) > -1)
		{
			pointsToAdd += 1;
		}
		else if ((play.desc.indexOf(keywords.TWO_POINT_CONVERSION_SUCCESSFUL_IDENTIFIER.PASS) > -1) ||
			(play.desc.indexOf(keywords.TWO_POINT_CONVERSION_SUCCESSFUL_IDENTIFIER.RUN) > -1))
		{
			pointsToAdd += 2;
		}
	}
	else if (play.type === keywords.FG_RESULT)
	{
		pointsToAdd += 3;
	}
	else if (play.type === keywords.DEFENSIVE_TWO_POINT_PLAY_IDENTIFIER.SAFETY_IDENTIFIER)
	{
		pointsToAdd += 2;
	}
	else if (play.desc.indexOf(keywords.DEFENSIVE_TWO_POINT_PLAY_IDENTIFIER.DEFENSIVE_TWO_POINT_CONVERSION) > -1)
	{
		pointsToAdd += 2;
	}

	return pointsToAdd;
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

/**
 * Function that is responsible for mapping any mentions of a player to their full name
 *
 * @param {String} name - the shortform name of the player whose full name we want
 * @param {String} teamCode - the code of the team to which the player in context belongs
 * @param {Object} players - the collection of players that were involved in the play currently being evaluated
 *
 * @return {Object} - an actionable player record
 *
 * @author kinsho
 */
var findFullName = _Q.async(function* (name, teamCode, players)
{
	var playerIds = Object.keys(players),
		oldId,
		playerRecord,
		fullName,
		newId,
		i;

	// Escape condition in case a name is not passed into the function
	if (!name) { return null; }

	// Loop across each player record in order to find the old ID associated with that player
	for (i = playerIds.length - 1; i >= 0; i--)
	{
		oldId = playerIds[i];
		playerRecord = players[oldId][0];
		// Find out if the record belongs to the player in context
		if ((playerRecord.playerName === name) && (playerRecord.clubcode === teamCode))
		{
			// Find if the new ID has already been found and cached. If so, skip to the end of this block;
			if ( !(_idConversionCache[oldId]) )
			{
				// Find the new ID associated with the player
				newId = yield scraper.findCorrespondingID(oldId);

				// Record a link from the old ID to the new ID
				_idConversionCache[oldId] = newId || -1;
			}

			// Return the player name associated with the new ID we discovered. If no new ID was found, return the
			// player's shortened name instead
			return {
				name: _gamecenterPlayerIds[_idConversionCache[oldId]] || name,
				id: _idConversionCache[oldId]
			};
		}
	}
});

// ----------------- SCRAPER LOGIC --------------------------

_Q.spawn(function* ()
{
	var urls,
		data,

		seasonGames = [],

		homeTeam,
		homeTeamScoringTrends,
		homeTeamPoints,

		awayTeam,
		awayTeamScoringTrends,
		awayTeamPoints,

		pointsToAdd,
		scoringPlays,
		pointDifferential,
		winner,

		drive,
		plays, play, previousPlayId, playIds,
		posTeam,
		offensivePlayData, defensivePlayData,
		netYards,
		currentLoc,
		awayTeamOffensivePlays,
		awayTeamDefensivePlays,
		homeTeamOffensivePlays,
		homeTeamDefensivePlays,

		i, j, k;

	// Prep the database for data retrieval
	yield mongo.initialize();

	// Pull all relevant stats from the database
	urls = yield mongo.read(DATABASE_URL_COLLECTION, { season: YEAR_TO_ANALYZE });

	// Pull the players' gamecenter IDs from the database
	_gamecenterPlayerIds = yield mongo.read(PLAYERS_COLLECTION);
	_gamecenterPlayerIds = _gamecenterPlayerIds[0][GAMECENTER_KEYWORD];

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

		awayTeamOffensivePlays = {};
		awayTeamDefensivePlays = {};
		homeTeamOffensivePlays = {};
		homeTeamDefensivePlays = {};

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
				offensivePlayData = {};
				defensivePlayData = {};
				netYards = 0; // Need this variable to calculate the number of yards gained on a play-by-play basis

				// Update the scores should any scoring have occurred on the previous play
				if (previousPlayId && scoringPlays[previousPlayId])
				{
					pointsToAdd = assessScoringPlay(scoringPlays[previousPlayId]);

					// Now add those points scored to the point total of the team that scored those points
					if (scoringPlays[previousPlayId].team === homeTeam)
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
					((play.note === keywords.PENALTY_RESULT) && (play.desc.toLowerCase().indexOf(keywords.NO_PLAY) > -1)) ||
					(play.desc.indexOf(keywords.KNEEL_KEYWORD) > -1) ||
					(play.desc.indexOf(keywords.KICKS_KEYWORD) > -1) ||
					(play.desc.indexOf(keywords.PUNTS_KEYWORD) > -1) ||
					(play.desc.indexOf(keywords.TWO_MINUTE_WARNING) > -1) ||
					(play.desc.indexOf(keywords.END_QUARTER) > -1) ||
					(play.desc.indexOf(keywords.END_GAME_IDENTIFIER) > -1) ||
					(play.desc.indexOf(keywords.ABORTED_KEYWORD) > -1) ||
					(play.desc.indexOf(keywords.PUNT_KEYWORD) > -1))
				{
					continue;
				}

				// Information on where the ball is spotted
				currentLoc = play.yrdln.split(' ');
				if (currentLoc.length === 1) // If the currentLoc field is only comprised of one word, we can assume that the ball is on the 50
				{
					currentLoc[1] = "50";
				}

				// Modify the play description into a format that ensures that we can easily parse the description
				play.desc = formatDescription(play.desc);

				offensivePlayData.homeTeamScore = homeTeamPoints;
				offensivePlayData.awayTeamScore = awayTeamPoints;
				offensivePlayData.quarter = play.qtr;
				offensivePlayData.time = parseFloat(play.time.replace(':', '.'));
				offensivePlayData.down = play.down;
				offensivePlayData.ydsToFirstDown = play.ydstogo;
				offensivePlayData.ydsToEndZone = (currentLoc[0] === posTeam ? 50 + (50 - parseInt(currentLoc[1], 10)) : parseInt(currentLoc[1], 10));
				offensivePlayData.ydsGained = findYardsGained(play.desc);
				offensivePlayData.team = posTeam;
				offensivePlayData.gameId = urls[i].id;

				netYards = play.ydsnet;
				// Note that scrambling plays can be classified as aborted pass plays where the quarterback is forced
				// to collect yards by breaking the pocket and running
				if (isPassPlay(play.desc))
				{
					offensivePlayData.type = keywords.PASS_MARKER;
					offensivePlayData.passer = yield findFullName(findActor(play.desc), posTeam, play.players);
					offensivePlayData.receiver = yield findFullName(findReceiver(play.desc), posTeam, play.players);
				}
				else
				{
					offensivePlayData.type = keywords.RUSH_MARKER;
					offensivePlayData.rusher = yield findFullName(findActor(play.desc), posTeam, play.players);
				}

				// Record any special result that may be associated with the play in context
				if (play.desc.indexOf(keywords.INTERCEPT_KEYWORD) > -1)
				{
					offensivePlayData.interception = true;
				}
				else if (play.note === keywords.TD_RESULT)
				{
					offensivePlayData.TD = true;
				}
				else if (play.desc.indexOf(keywords.SACKED_RESULT) > -1)
				{
					offensivePlayData.sacked = true;
				}
				else if (play.desc.indexOf(keywords.INCOMPLETE_PASS_KEYWORD) > -1)
				{
					offensivePlayData.incomplete = true;
				}

				// Clone the play data collected so far into a separate object for the purposes of tracking defensive
				// performances separately from offensive performances
				defensivePlayData = objectHelper.cloneObject(offensivePlayData);

				// Tweak the defensive play data context wherever necessary
				defensivePlayData.team = ((posTeam === homeTeam) ? awayTeam : homeTeam);

				if (posTeam === homeTeam)
				{
					homeTeamOffensivePlays[playIds[k]] = objectHelper.cloneObject(offensivePlayData);
					awayTeamDefensivePlays[playIds[k]] = objectHelper.cloneObject(defensivePlayData);
				}
				else
				{
					awayTeamOffensivePlays[playIds[k]] = objectHelper.cloneObject(offensivePlayData);
					homeTeamDefensivePlays[playIds[k]] = objectHelper.cloneObject(defensivePlayData);
				}
			}

		}

		// Assess any scoring that may have taken place on the last play
		if (scoringPlays[previousPlayId])
		{
			pointsToAdd = assessScoringPlay(scoringPlays[previousPlayId]);

			// Now add those points scored to the point total of the team that scored those points
			if (scoringPlays[previousPlayId].team === homeTeam)
			{
				homeTeamPoints += pointsToAdd;
			}
			else
			{
				awayTeamPoints += pointsToAdd;
			}
		}

		// Record a book-end plays to indicate the end of the game. These plays will be used to record overall grades
		homeTeamOffensivePlays[99999] =
		{
			endGame: true,
			homeTeamScore: homeTeamPoints,
			awayTeamScore: awayTeamPoints
		};
		homeTeamDefensivePlays[99999] =
		{
			endGame: true,
			homeTeamScore: homeTeamPoints,
			awayTeamScore: awayTeamPoints
		};
		awayTeamOffensivePlays[99999] =
		{
			endGame: true,
			homeTeamScore: homeTeamPoints,
			awayTeamScore: awayTeamPoints
		};
		awayTeamDefensivePlays[99999] =
		{
			endGame: true,
			homeTeamScore: homeTeamPoints,
			awayTeamScore: awayTeamPoints
		};

		// Figure out the winner
		winner = homeTeamPoints > awayTeamPoints ? homeTeam : (awayTeamPoints > homeTeamPoints ? awayTeam : keywords.TIE_KEYWORD);

		// Construct the game record that will be stored within the database
		seasonGames.push(mongo.formUpdateOneQuery(
		{
			id: urls[i].id
		},
		{
			id: urls[i].id,
			homeTeam: homeTeam,
			awayTeam: awayTeam,
			winner: winner,
			homeScore: homeTeamPoints,
			awayScore: awayTeamPoints,
			season: YEAR_TO_ANALYZE,
			homeTeamOffensivePlays: objectHelper.cloneObject(homeTeamOffensivePlays),
			homeTeamDefensivePlays: objectHelper.cloneObject(homeTeamDefensivePlays),
			awayTeamOffensivePlays: objectHelper.cloneObject(awayTeamOffensivePlays),
			awayTeamDefensivePlays: objectHelper.cloneObject(awayTeamDefensivePlays)
		}, true));
	}

	// Write the new games into the database. Overwrite any old data for these same games
	seasonGames.unshift(DATABASE_GAMES_COLLECTION, true);
	yield mongo.bulkWrite.apply(mongo, seasonGames);

	// Close the database
	mongo.closeDatabase();
});