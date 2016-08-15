/**
 * Application Configuration
 */

// ----------------- CONFIGURATION ---------------------------

var config =
{
	// HTTP Requests
	BASE_URL: 'http://localhost:3000/',

	// Database
	DATABASE_URL: 'mongodb://kinsho:StatsOwl@localhost:27017/StatsOwl',

	// Environment
	IS_DEV: true,
	IS_PROD: false
};

// ----------------- EXPORT ---------------------------

module.exports = config;