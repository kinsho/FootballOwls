/**
 * Keep in mind that this is module is nothing but a collection of ranges
 *
 * 'Long' distances are distances of 8 yards or more before the offense gains a new set of downs or breaks into the end zone
 * 'Medium' distances are distances between 4 and 7 yards (inclusive) before the offense gains a new set of downs or breaks into the end zone
 * 'Short' distances are describes of 3 yards or less (include) before the offense gains a new set of downs or breaks into the end zone
 *
 * Plays in the midfield range are plays that take place between the offensive team's own 10-yard line and the defense's 20-yard line
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
		3: 0.4,
		4: 0.6,
		5: 0.8
	},

	SECOND_AND_LONG:
	{
		1: 0.1,
		2: 0.3,
		3: 0.5,
		4: 0.7,
		5: 0.9
	},

	THIRD_AND_LONG:
	{
		1: 0.2,
		2: 0.5,
		3: 0.7,
		4: 1.0,
		5: 12
	},

	FOURTH_AND_LONG:
	{
		1: 0.3,
		2: 0.5,
		3: 0.8,
		4: 1.0,
		5: 12
	},

	FIRST_AND_MID:
	{
		1: 0.1,
		2: 0.3,
		3: 0.6,
		4: 0.8,
		5: 1.0
	},

	SECOND_AND_MID:
	{
		1: 0.1,
		2: 0.3,
		3: 0.6,
		4: 0.8,
		5: 1.0
	},

	THIRD_AND_MID:
	{
		1: 0.2,
		2: 0.5,
		3: 0.8,
		4: 1.0,
		5: 10
	},

	FOURTH_AND_MID:
	{
		1: 0.2,
		2: 0.6,
		3: 1.0,
		4: 10,
		5: 13
	},

	// Highly improbable
	FIRST_AND_SHORT:
	{
		1: 0.33,
		2: 0.66,
		3: 1.0,
		4: 5,
		5: 10
	},

	SECOND_AND_SHORT:
	{
		1: 0.33,
		2: 0.66,
		3: 1.0,
		4: 5,
		5: 10
	},

	THIRD_AND_SHORT:
	{
		1: 0.66,
		2: 0.66,
		3: 1.0,
		4: 5,
		5: 10
	},

	FOURTH_AND_SHORT:
	{
		1: 1.0,
		2: 1.0,
		3: 1.0,
		4: 5,
		5: 10
	}
}