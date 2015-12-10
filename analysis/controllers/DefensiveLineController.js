/**
 * @module DefensiveLineController
 */

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('q'),
	controllerHelper = global.OwlStakes.require('controllers/foundation/ControllerHelper'),
	templateManager = global.OwlStakes.require('utility/templateManager');

// ----------------- ENUMS/CONSTANTS --------------------------

var DEFENSIVE_LINE_FOLDER = 'dline',

	MAIN_TEMPLATE = 'dline';

// ----------------- MODULE DEFINITION --------------------------
module.exports =
{
	/**
	 * Initializer function
	 *
	 * @author kinsho
	 */
	initAction: _Q.async(function* ()
	{
		console.log('Loading the defensive line page...');

		var populatedTemplate = templateManager.populateTemplate({test: 'world'}, DEFENSIVE_LINE_FOLDER, MAIN_TEMPLATE),
			initialData =
			{
				test: 'world'
			};

		return yield controllerHelper.renderInitialView(populatedTemplate, DEFENSIVE_LINE_FOLDER, initialData);
	})
};