/**
 * @module ResourcesController
 */

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('q'),
	fileManager = global.OwlStakes.require('utility/fileManager');

// ----------------- MODULE DEFINITION --------------------------
module.exports =
{
	/**
	 * Initializer function responsible for fetching the contents of a resource
	 *
	 * @author kinsho
	 */
	initAction: _Q.async(function* (response, url)
	{
		return yield fileManager.fetchFile(url);
	})
};