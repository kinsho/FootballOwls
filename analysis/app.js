// ----------------- APP_ROOT_PATH INSTANTIATION --------------------------

global.OwlStakes =
{
	require : require('app-root-path').require
};

// ----------------- EXTERNAL MODULES --------------------------

var _http = require('http'),
	_url = require('url'),
	_Q = require('q'),
	router = global.OwlStakes.require('config/router'),
	responseHandler = global.OwlStakes.require('utility/responseHandler'),
	databaseDriver = global.OwlStakes.require('data/databaseDriver');

// ----------------- GREETING LOGIC --------------------------

// Define a server that will act as a gateway point for all incoming server requests
_http.createServer(function(request, response)
{
	console.log('Connection made from URL: ' + request.url.trim());

	_Q.spawn(function* ()
	{
		try
		{
			var url = request.url.trim(),
				urlObj = _url.parse(url, true),
				routeSigns = urlObj.pathname.split('/'),

			// If the URL indicates whether a style or image resource needs to be fetched, route to a controller
			// specifically designed to pull those type of resources
				isResourceWanted = router.isResourceWanted(url),

				action = ( isResourceWanted ? '' : routeSigns[2] ),
			// If a resource is being fetched, pass the URL to the resource controller as a parameter
			// Otherwise, extract the parameters from the URL
				params = (isResourceWanted ? url : urlObj.query),

				controller, // Name of the controller that will service the request
				ctrl, // The instance of the actual controller to act upon
				responseData;

			// Open up a connection to the database, if one is not open yet
			yield databaseDriver.initialize();

			// Find the routes
			yield router.populateRoutes();

			controller = ( isResourceWanted ? router.findResourceController() : router.findController(routeSigns[1]));

			// Ready the parameters. If looking up a resource, set the URL as the parameter after stripping out any
			// leading slash that may be there
			url = (url.indexOf('/') === 0 || url.IndexOf("\\") === 0 ? url.substring(1, url.length) : url);

			// Hopefully, this will be the only example in the entire code base in which a module will need to be
			// fetched dynamically.
			ctrl = global.OwlStakes.require(controller);

			// Find the correct action method indicated within the URL, then pass that action method
			// all the relevant parameters needed to properly service the request by itself
			responseData = yield ctrl[ router.findAction(routeSigns[1], action) ](response, params);

			// Send the response back
			responseHandler.sendSuccessResponse(response, responseData, url);
		}
		catch (exception)
		{
			console.log(exception);
			responseHandler.sendInternalServerErrorResponse(response, url);
		}
	});

}).listen(3000);

// ----------------- END --------------------------

console.log('Server started!');
console.log('Listening on port 3000...');