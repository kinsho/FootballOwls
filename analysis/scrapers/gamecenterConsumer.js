// ----------------- APP_ROOT_PATH INSTANTIATION --------------------------

global.StatsOwl =
{
	require : require('app-root-path').require
};

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('Q'),
	scraper = global.StatsOwl.require('scrapers/base/nflGamecenterDriver'),
	keywords = global.StatsOwl.require('scrapers/base/nflGamecenterKeywords'),
	mongo = global.StatsOwl.require('data/databaseDriver');

// ----------------- ENUMS/CONSTANTS --------------------------

// Note the placeholder in the URL string that allows us to load data from different teams
var DATABASE_URL_COLLECTION = 'gamecenterURLs',
	YEAR_TO_ANALYZE = '2015';

// ----------------- PRIVATE METHODS --------------------------

	/**
	 * Function indicating whether a play qualifies as a pass play
	 *
	 * @param {String} desc - the description of the play
	 *
	 * @returns {boolean} - indicates whether the play is a pass play
	 */
var isPassPlay = function(desc)
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
	},

	/**
	 * Function that determines the name of the passer or rusher driving the action in the play
	 *
	 * @param {String} desc - the description of the play
	 *
	 * @returns {String} - the name of the player driving the action in the play
	 */
	findActor = function(desc)
	{
		var words = desc ? desc.split(' ') : [],
			i;

		for (i = 0; i < words.length; i++)
		{
			// The first token not encapsulated within parentheses is the name of the actor driving the play
			if (words[i].charAt(0) === '(')
			{
				continue;
			}

			return words[i];
		}
	},

	/**
	 * Function that determines the name of the targeted receiver in a pass play
	 *
	 * @param {String} desc - the description of the play
	 *
	 * @returns {String} - the name of the player that was targeted in the pass play
	 */
	findReceiver = function(desc)
	{
		var words = desc ? desc.split(' ') : [],
			i;

		for (i = 0; i < words.length; i++)
		{
			// The receiver always follows the first use of the word 'to'
			if (words[i].charAt(0) === keywords.TO_IDENTIFIER)
			{
				return words[i + 1];
			}
		}

		return '';
	},

	/**
	 * Function that determines whether a piece of data is an object
	 *
	 * @param {any} val - the value to test
	 *
	 * @returns {boolean} - a flag indicating whether the passed value is an object
	 */
	isObject = function(val)
	{
		if (val === null)
		{
			return false;
		}

		return ( (typeof val === 'function') || (typeof val === 'object') );
	},

	/**
	 * Function that clones an object in its entirety
	 *
	 * @param {Object} obj - the object to clone
	 *
	 * @returns {Object} - a copy of the passed object
	 */
	cloneObject = function(obj)
	{
		var keys = Object.keys(obj || {}),
			clone = {},
			i;

		for (i = 0; i < keys.length; i++)
		{
			// If a property of the object being cloned references another object, make sure to clone that
			// object as well
			if ( isObject(obj[keys[i]]) )
			{
				clone[keys[i]] = cloneObject(obj[keys[i]]);
			}

			clone[keys[i]] = obj[keys[i]];
		}

		return clone;
	};

// ----------------- SCRAPER LOGIC --------------------------

_Q.spawn(function* ()
{
	var urls,
		data,

		homeTeam,
		homeTeamScoringTrends,
		homeTeamPoints,

		awayTeam,
		awayTeamScoringTrends,
		awayTeamPoints,

		pointDifferential,
		winner,

		drive,
		plays, play, playIds,
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

	for (i = 0; i < 1; i++)
	{
		data = JSON.parse(yield scraper.scrape(urls[i].url));


		// We only want the game data
		data = data[Object.keys(data)[0]];

		// Parse the high-level game data
		homeTeam = data.home.abbr;
		awayTeam = data.away.abbr;

		homeTeamPoints = data.home.score.T;
		awayTeamPoints = data.away.score.T;

		homeTeamScoringTrends = data.home.score;
		delete homeTeamScoringTrends.T;
		awayTeamScoringTrends = data.away.score;
		delete awayTeamScoringTrends.T;

		pointDifferential = Math.abs(homeTeamPoints - awayTeamPoints);
		winner = homeTeamPoints > awayTeamPoints ? homeTeam : (awayTeamPoints > homeTeamPoints ? awayTeam : keywords.TIE_KEYWORD);

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

				// Ignore special-team plays and other fringe plays
				if ((play.note in keywords.SPECIAL_TEAMS_PLAY_IDENTIFIERS) ||
					(play.desc.indexOf(keywords.KNEEL_KEYWORD)) > -1 ||
					(play.desc.indexOf(keywords.END_GAME_IDENTIFIER)) > -1)
				{
					continue;
				}

				// Information on where the ball is spotted
				currentLoc = play.yrdln.split(' ');
				if (currentLoc.length === 1)
				{
					currentLoc[1] = "50";
				}

				playData.id = playIds[k];
				playData.quarter = play.qtr;
				playData.time = parseFloat(play.time.replace(':', '.'));
				playData.down = play.down;
				playData.ydsToFirstDown = play.ydstogo;
				playData.ydsToEndZone = (currentLoc[0] === posTeam ? 50 + parseInt(currentLoc[1], 10) : parseInt(currentLoc[1], 10));
				playData.ydsGained = play.ydsnet - netYards;
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

				if (posTeam === homeTeam)
				{
					homeTeamPlays.push(cloneObject(playData));
				}
				else
				{
					awayTeamPlays.push(cloneObject(playData));
				}
			}

		}
	}

	console.log(homeTeamPlays);
});