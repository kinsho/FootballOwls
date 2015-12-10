// Keep in mind that this is module is nothing but a collection of keywords and contextual identifiers

// ----------------- MODULE DEFINITION --------------------------
module.exports =
{
	RUSH_MARKER: 'rush',
	PASS_MARKER: 'pass',

	KNEEL_KEYWORD: 'kneels',

	TIE_KEYWORD: 'TIE',
	END_GAME_IDENTIFIER: 'END GAME',

	TO_IDENTIFIER: 'to',

	PASS_PLAY_IDENTIFIERS:
	{
		' pass ': true,
		' scrambles ': true,
		' sacked ': true,
	},

	SPECIAL_TEAMS_PLAY_IDENTIFIERS:
	{
		PUNT: true,
		KICKOFF: true
	}
};