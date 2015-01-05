import pdb
import json
from SiteScraper import *

# Class is responsible for fetching pass yardage stats over the course of the season to to determine whether a team
# has progressed positively
#
# @author kinsho
#
class PassYardageOverSeason:

	# Constants
	BOX_SCORES_TEXT_FILE = '../info/boxScores.txt'
	STATS_TEXT_FILE = '../info/teamStats.txt'
	PASS_STATS_TABLE_ID = 'skill_stats'

	def __init__(self):
		pass

	# Function is responsible for collecting the yardage stats for all teams over the course of any season
	#
	# @return {JSON} - wrapped pass-efficiency data
	#
	# @author kinsho
	#
	def collect_stats(self):

		records = json.loads(self.read_from_file())

		for year, weeks in records.iteritems():

			for week, games in weeks.iteritems():

				print("\nAbout to start collecting stats for week {} of {}\n".format(week, year))

				for index, game in enumerate(games):

					soup = SiteScraper.soupify(game['content'])

					# Section of code below is responsible for calculating the passing yardage taken as a ratio
					# over attempted passes
					rows = soup.find(id=self.PASS_STATS_TABLE_ID).find('tbody').find_all('tr')
					current_team = 'away_team'
					away_team_pa = 0
					home_team_pa = 0
					away_team_ty = 0
					home_team_ty = 0

					for row in rows:

						if len(row.attrs['class']) == 1:

							passes_attempted = row.find_all('td')[3]
							total_yardage = row.find_all('td')[4]

							if len(passes_attempted.contents) > 0:

								if current_team == 'away_team':
									away_team_pa += int(passes_attempted.contents[0])
									away_team_ty += int(total_yardage.contents[0]) if len(total_yardage.contents) > 0 else 0
								else:
									home_team_pa += int(passes_attempted.contents[0])
									home_team_ty += int(total_yardage.contents[0]) if len(total_yardage.contents) > 0 else 0

						else:

							current_team = 'home_team'

					# Section of code below records the information that was scraped in the lines of
					# code above
					away_team = game['away_team']
					home_team = game['home_team']

					records[year][week][index] = {
						'away_team' : {
							'name' : away_team,
							'divisor' : away_team_pa,
							'base' : away_team_ty
						},
						'home_team' : {
							'name' : home_team,
							'divisor' : home_team_pa,
							'base' : home_team_ty
						},
					}

					print("{} passed for {} yards through {} passes attempted".format(away_team, away_team_ty, away_team_pa))
					print("{} passed for {} yards through {} passes attempted".format(home_team, home_team_ty, home_team_pa))
					print("\n")

		# Syntactic sugar meant to aid presentation logic. While we shouldn't be concerned about presentation here,
		# we handle this here so that we free ourselves from having to write multiple formatters with incredibly
		# similar logic
		records['stat_descriptor'] = 'Passing Yardage Improvement Over The Season (Expressed as Passing Yards over Passes Attempted)'

		return json.dumps(records)

	# Function is responsible for fetching all the box score data from the text cache
	#
	# @param {JSON} data - the data to write out
	#
	# @author kinsho
	#
	def read_from_file(self):

		return SiteScraper.read_from_file(self.BOX_SCORES_TEXT_FILE)

	# Function is responsible for writing out the newly touched-up data to an external
	# text file
	#
	# @param {JSON} data - the data to write out
	#
	# @author kinsho
	#
	def write_to_file(self, data):

		SiteScraper.write_into_file(data, self.STATS_TEXT_FILE)

# Code to execute the code above
parser = PassYardageOverSeason()
parser.write_to_file(parser.collect_stats())

# Final message to output indicating everything was a success
print('\n=========Finito=========\n')