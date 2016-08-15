// Keep in mind that this is module is nothing but a collection of keywords and contextual identifiers

// ----------------- MODULE DEFINITION --------------------------
module.exports =
{
	RUSH_MARKER: 'rush',
	PASS_MARKER: 'pass',

	KNEEL_KEYWORD: 'kneels',
	KICKS_KEYWORD: 'kicks',
	PUNTS_KEYWORD: 'punts',
	TIMEOUT_KEYWORD: 'TIMEOUT',
	TWO_MINUTE_WARNING: 'Two-Minute Warning',
	END_QUARTER: 'END QUARTER',

	TIE_KEYWORD: 'TIE',
	END_GAME_IDENTIFIER: 'END GAME',

	TO_IDENTIFIER: 'to',
	FOR_IDENTIFIER: 'for',
	NO_IDENTIFIER: 'no',
	REVERSED_IDENTIFIER: 'REVERSED',
	INTENDED_IDENTIFIER: 'intended',

	PASS_PLAY_IDENTIFIERS:
	{
		' pass ': true,
		' scrambles ': true,
		' sacked ': true,
	},

	SPECIAL_TEAMS_PLAY_IDENTIFIERS:
	{
		'PUNT': true,
		'KICKOFF': true,
		'XP': true,
		'2PS': true,
		'2PR': true,
		'FG': true,
		'FGM': true,
		'XPM': true
	},

	SACKED_RESULT: 'sacked',
	PENALTY_RESULT: 'PENALTY',
	NO_PLAY: 'no play',
	INCOMPLETE_PASS_KEYWORD: 'incomplete',
	ABORTED_KEYWORD: 'Aborted',
	PUNT_KEYWORD: 'punt',
	INTERCEPT_KEYWORD: 'INTERCEPT',

	TD_RESULT: 'TD',
	FG_RESULT: 'FG',
	MISSED_FG_RESULT: 'FGM',

	POINT_AFTER_TOUCHDOWN_SUCCESSFUL_IDENTIFIER: 'kick is good)',

	TWO_POINT_CONVERSION_SUCCESSFUL_IDENTIFIER:
	{
		PASS: 'pass)',
		RUN: 'run)'
	},

	DEFENSIVE_TWO_POINT_PLAY_IDENTIFIER:
	{
		SAFETY_IDENTIFIER: 'SAF',
		DEFENSIVE_TWO_POINT_CONVERSION: 'defensive two point conversion'
	}

};