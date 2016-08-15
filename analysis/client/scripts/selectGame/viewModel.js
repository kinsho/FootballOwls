/**
 * The view model for the selectGames page
 */

// ----------------- EXTERNAL MODULES --------------------------

// ----------------- ENUM/CONSTANTS -----------------------------

var SEASON_RADIO_BUTTON_PREFIX = 'season',
	SELECT_WEEK_DROPDOWN = 'weekDropdown',
	SELECT_WEEK_OPTION_PREFIX = 'week';

// ----------------- PRIVATE FUNCTIONS -----------------------------

/**
 * Function is responsible for enabling and disabling the options in the week drop-down depending on
 * whether game data is available for each week to be evaluated
 *
 * @author kinsho
 */
function _enableDisableWeekDropdownOptions()
{
	var eligibleWeeks = window.FootballOwls.seasonData[viewModel.selectedSeason],
		weeks = Object.keys(eligibleWeeks),
		latestEligibleWeek = 0,
		i;

	// Find out which weeks are allowed to be selected and which weeks cannot be selected
	for (i = weeks.length - 1; i >= 0; i--)
	{
		// The week can be selected
		if (eligibleWeeks[weeks[i]])
		{
			latestEligibleWeek = weeks[i];
			document.getElementById(SELECT_WEEK_OPTION_PREFIX + weeks[i]).disabled = false;
		}
		// The week cannot be selected, as no game data exists for that week
		else
		{
			document.getElementById(SELECT_WEEK_OPTION_PREFIX + weeks[i]).disabled = true;
		}
	}

	// Set the selected week to the latest week that can be selected for the season in context
	viewModel.selectedWeek = latestEligibleWeek;
}

// ----------------- VIEW MODEL DEFINITION -----------------------------

var viewModel = {};

// Selected season
Object.defineProperty(viewModel, 'selectedSeason',
	{
		configurable: false,
		enumerable: true,

		get: () =>
		{
			return this.__selectedSeason;
		},

		set: (value) =>
		{
			this.__selectedSeason = value;

			document.getElementById(SEASON_RADIO_BUTTON_PREFIX + value).checked = true;

			_enableDisableWeekDropdownOptions();
		}
	});

// Selected week
Object.defineProperty(viewModel, 'selectedWeek',
	{
		configurable: false,
		enumerable: true,

		get: () =>
		{
			return this.__selectedWeek;
		},

		set: (value) =>
		{
			this.__selectedWeek = value;

			document.getElementById(SELECT_WEEK_DROPDOWN).value = value;
		}
	});

// ----------------- EXPORT -----------------------------

export default viewModel;