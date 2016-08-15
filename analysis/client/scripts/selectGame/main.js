/**
 * @main selectGame
 */

// ----------------- EXTERNAL MODULES --------------------------

import axios from 'client/scripts/utility/axios';
import vm from 'client/scripts/selectGame/viewModel';

// ----------------- ENUMS/CONSTANTS ---------------------------

var SELECT_WEEK_DROPDOWN = 'weekDropdown',
	GAMES_CONTAINER = 'gamesContainer',
	GAMES_CONTAINER_HEADER = 'gamesContainerHeader',
	NAV_BUTTON_CLASS = 'navButton',

	FADE_OUT_CLASS = 'fadeOut',

	GET_GAMES_URL = 'selectGame/findGamesBySeasonWeek',
	GAME_DETAILS_PAGE_URL = '/gameDetails?gameId=::gameId',
	GAME_ID_PLACEHOLDER = '::gameId';

// ----------------- PRIVATE FUNCTIONS ---------------------------

// ----------------- LISTENERS ---------------------------

/**
 * Function resets whatever games are being displayed on screen depending on whatever season and week the user has newly selected
 *
 * @param {Event} event - the event that triggered the invocation of this listener. Needed to prevent default propagation
 *
 * @author kinsho
 */
function changeGames(event)
{
	var data;

	// Prevent the browser from doing anything it normally would do
	event.preventDefault();

	// Record the newly selected week
	vm.selectedWeek = event.currentTarget.value;

	// Fade out part of the page as data is being fetched
	document.getElementById(GAMES_CONTAINER_HEADER).classList.add(FADE_OUT_CLASS);
	document.getElementById(GAMES_CONTAINER).classList.add(FADE_OUT_CLASS);

	// Gather the parameters that will be sent to the server in order to fetch a specific set of games
	data =
	{
		week: vm.selectedWeek,
		season: vm.selectedSeason
	};

	axios.get(GET_GAMES_URL, data).then((response) =>
	{
		// Insert the newly populated games template into the page
		document.getElementById(GAMES_CONTAINER).innerHTML = response.gamesHTML;

		// Fade back the MAIN body of the page
		document.getElementById(GAMES_CONTAINER_HEADER).classList.remove(FADE_OUT_CLASS);
		document.getElementById(GAMES_CONTAINER).classList.remove(FADE_OUT_CLASS);
	});
}

/**
 * Listener function responsible for taking the user to a separate page containing more information
 * about a particular game
 *
 * @param event {Event} - the event object associated with the listener
 *
 * @author kinsho
 *
 */
function goToDetailsPage(event)
{
	var gameId;

	// Prevent the browser from doing anything it normally would do
	event.preventDefault();

	gameId = event.currentTarget.dataset.gameId;

	window.location.href = GAME_DETAILS_PAGE_URL.replace(GAME_ID_PLACEHOLDER, gameId);
}

// ----------------- DATA INITIALIZATION -----------------------------

vm.selectedSeason = window.FootballOwls.initialSeason;
vm.selectedWeek = window.FootballOwls.initialWeek;

// ----------------- LISTENER INITIALIZATION -----------------------------

var navButtons = document.getElementsByClassName(NAV_BUTTON_CLASS),
	i;

// Listener to change whatever games are displayed on the screen
document.getElementById(SELECT_WEEK_DROPDOWN).addEventListener('change', changeGames);

// Listener to take the user to a separate page containing more details about a game
for (i = navButtons.length - 1; i >= 0; i--)
{
	navButtons[i].addEventListener('click', goToDetailsPage);
}

// ----------------- PAGE INITIALIZATION -----------------------------

window.scrollTo(0, 0);