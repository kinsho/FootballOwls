/**
 * Keep in mind that this is module is nothing but a collection of ranges
 *
 * 'Long' distances are distances of 8 yards or more before the offense gains a new set of downs or breaks into the end zone
 * 'Medium' distances are distances between 4 and 7 yards (inclusive) before the offense gains a new set of downs or breaks into the end zone
 * 'Short' distances are describes of 3 yards or less (include) before the offense gains a new set of downs or breaks into the end zone
 *
 * Plays in the red zone range are plays that take place in the red zone
 *
 * @author kinsho
 */

// ----------------- MODULE DEFINITION --------------------------
module.exports =
{
	FIRST_AND_LONG:
	{
		1: 0.1,
		2: 0.2,
		3: 0.3,
		4: 0.5,
		5: 0.8
	},

	SECOND_AND_LONG:
	{
		1: 0.1,
		2: 0.3,
		3: 0.5,
		4: 0.75,
		5: 1.0
	},

	THIRD_AND_LONG:
	{
		1: 0.2,
		2: 0.5,
		3: 0.7,
		4: 0.7,
		5: 1.0
	},

	// Highly improbable
	FOURTH_AND_LONG:
	{
		1: 0.5,
		2: 0.5,
		3: 0.7,
		4: 1.0,
		5: 1.0
	},

	FIRST_AND_MID:
	{
		1: 0.2,
		2: 0.2,
		3: 0.4,
		4: 0.7,
		5: 1.0
	},

	SECOND_AND_MID:
	{
		1: 0.2,
		2: 0.3,
		3: 0.5,
		4: 0.7,
		5: 1.0
	},

	THIRD_AND_MID:
	{
		1: 0.33,
		2: 0.66,
		3: 1.0,
		4: 7,
		5: 9
	},

	FOURTH_AND_MID:
	{
		1: 0.8,
		2: 0.8,
		3: 1.0,
		4: 7,
		5: 9
	},

	// Highly improbable
	FIRST_AND_SHORT:
	{
		1: 0.33,
		2: 0.66,
		3: 0.66,
		4: 1.0,
		5: 5
	},

	SECOND_AND_SHORT:
	{
		1: 0.33,
		2: 0.66,
		3: 1.0,
		4: 1.0,
		5: 5
	},

	THIRD_AND_SHORT:
	{
		1: 0.33,
		2: 0.66,
		3: 1.0,
		4: 5,
		5: 8
	},

	// Running on fourth down indicates that the team does not care to turn the ball over
	FOURTH_AND_SHORT:
	{
		1: 0.0,
		2: 0.0,
		3: 1.0,
		4: 6,
		5: 9
	}
}