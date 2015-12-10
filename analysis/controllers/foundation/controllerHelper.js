/**
 * @module controllerHelper
 */

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('q'),
	fileManager = global.OwlStakes.require('utility/fileManager'),
	templateManager = global.OwlStakes.require('utility/templateManager');

// ----------------- ENUMS/CONSTANTS --------------------------

var BASE_TEMPLATE_FILE = 'base',

	HBARS_STYLESHEET_FILES = 'cssFiles',
	HBARS_BASE_TEMPLATE_HTML = 'baseTemplateHTML',
	HBARS_CONTENT_HTML = 'contentViewHTML',

	HBARS_BOOTSTRAPPED_DATA = 'initialData',
	HBARS_LAUNCH_SCRIPT = 'launchScript',
	HBARS_MAIN_SCRIPT_NAME = 'main';

// ----------------- MODULE DEFINITION --------------------------
module.exports =
{
	/**
	 * Basic function responsible for populating the base template with relevant content and
	 * links to all required foundational files. Basically the last function to be called when any
	 * initial service request is to be fulfilled
	 *
	 * @param {String} content - the HTML content to inject into the base template
	 * @param {String} [directory] - the modular name which can be used to pull resource files from
	 * 		the file system
	 * @param {Object} [bootData] - data to bootstrap into the page when it is initially loaded
	 *
	 * @return {String} - a fully populated string of HTML
	 *
	 * @author kinsho
	 */
	renderInitialView: _Q.async(function* (content, directory, bootData)
	{
		var data = {};

//			data[HBARS_BASE_TEMPLATE_HTML] = yield fileManager.fetchFoundationalTemplates();

		// Foundational content that will be in play on every page
		data[HBARS_BASE_TEMPLATE_HTML] = '';

		// Foundational stylesheets which must be included on every page
		data[HBARS_STYLESHEET_FILES] = yield fileManager.fetchStylesheets();

		// Page-specific data to load into browser memory upon page load
		data[HBARS_BOOTSTRAPPED_DATA] = JSON.stringify(bootData);

		// Content specific to the page being loaded
		data[HBARS_CONTENT_HTML] = content;

		// Other assets specific to the page being loaded
		if (directory)
		{
			data[HBARS_STYLESHEET_FILES] = data[HBARS_STYLESHEET_FILES].concat(yield fileManager.fetchStylesheets(directory));
			data[HBARS_LAUNCH_SCRIPT] = directory + '/' + HBARS_MAIN_SCRIPT_NAME;
		}

		return templateManager.populateTemplate(data, '', BASE_TEMPLATE_FILE);
	})
};