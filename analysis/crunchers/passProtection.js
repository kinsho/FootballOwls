// ----------------- APP_ROOT_PATH INSTANTIATION --------------------------

global.StatsOwl =
{
	require : require('app-root-path').require
};

// ----------------- EXTERNAL MODULES --------------------------

var _Q = require('Q'),
	mongo = global.StatsOwl.require('data/databaseDriver');

// ----------------- ENUMS/CONSTANTS --------------------------

var DATABASE_COLLECTION_NAME = 'passProtection',
	YEAR_TO_ANALYZE = '2015';

// ----------------- CRUNCHER LOGIC --------------------------

_Q.spawn(function* ()
{
	var teams = [],
		data,
		team,
		hurriesScore,
		hitsScore,
		sacksScore,
		passBlockAttempts,
		i;

	// Prep the database for data retrieval
	yield mongo.initialize();

	// Pull all relevant stats from the database
	data = yield mongo.read(DATABASE_COLLECTION_NAME, { season: YEAR_TO_ANALYZE });

	// Close the database
	mongo.closeDatabase();

	for (i = 0; i < data.length; i++)
	{
		team = data[i];

		// Collect the relevant data from each team that will be used to determine that team's pass-rushing efficiency
		hurriesScore = team.hurriesAllowed * 1;
		hitsScore = team.hitsAllowed * 1.5;
		sacksScore = team.sacksAllowed * 2.5;
		passBlockAttempts = team.passBlockAttempts;

		// Now calculate and store each team's pass-rushing efficiency
		team.passProtection = (4 * (hurriesScore + hitsScore + sacksScore)) / team.passBlockAttempts;

		// Push the modified record into an array for sorting later
		teams.push(team);
	}

	// Sort the teams array by pass-rushing efficiency
	teams.sort(function(x, y)
	{
		if (x.passProtection > y.passProtection)
		{
			return 1;
		}

		if (x.passProtection < y.passProtection)
		{
			return -1;
		}

		return 0;
	});

	// Now output the sorted list
	for (i = 0; i < teams.length; i++)
	{
		console.log('---');
		console.log(teams[i].team);
		console.log(teams[i].passProtection.toFixed(3));
		console.log('---');
	}
});