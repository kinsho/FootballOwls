import pdb
import json
from SiteScraper import *

# Class is responsible for fetching rushing stats over the course of the season to to determine whether a team
# has progressed positively
#
# @author kinsho
#
class RushYardageOverSeason:

	# Constants
	BOX_SCORES_TEXT_FILE = '../info/boxScores.txt'
	STATS_TEXT_FILE = '../info/teamStats.txt'
	RUN_STATS_TABLE_ID = 'skill_stats'

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

					# Section of code below is responsible for calculating the rushing yardage taken as a ratio
					# over attempted rushes
					rows = soup.find(id=self.RUN_STATS_TABLE_ID).find('tbody').find_all('tr')
					current_team = 'away_team'
					away_team_ra = 0
					home_team_ra = 0
					away_team_ry = 0
					home_team_ry = 0

					for row in rows:

						if len(row.attrs['class']) == 1:

							rushes_attempted = row.find_all('td')[8]
							total_yardage = row.find_all('td')[9]

							if len(rushes_attempted.contents) > 0:

								if current_team == 'away_team':
									away_team_ra += int(rushes_attempted.contents[0])
									away_team_ry += int(total_yardage.contents[0]) if len(total_yardage.contents) > 0 else 0
								else:
									home_team_ra += int(rushes_attempted.contents[0])
									home_team_ry += int(total_yardage.contents[0]) if len(total_yardage.contents) > 0 else 0

						else:

							current_team = 'home_team'

					# Section of code below records the information that was scraped in the lines of
					# code above
					away_team = game['away_team']
					home_team = game['home_team']

					records[year][week][index] = {
						'away_team' : {
							'name' : away_team,
							'divisor' : away_team_ra,
							'base' : away_team_ry
						},
						'home_team' : {
							'name' : home_team,
							'divisor' : home_team_ra,
							'base' : home_team_ry
						},
					}

					print("{} rushed for {} yards through {} runs".format(away_team, away_team_ry, away_team_ra))
					print("{} rushed for {} yards through {} runs".format(home_team, home_team_ry, home_team_ra))
					print("\n")

		# Syntactic sugar meant to aid presentation logic. While we shouldn't be concerned about presentation here,
		# we handle this here so that we free ourselves from having to write multiple formatters with incredibly
		# similar logic
		records['stat_descriptor'] = 'Rushing Yardage Improvement Over The Season (Expressed as Rushing Yards over Runs Attempted)'

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
parser = RushYardageOverSeason()
parser.write_to_file(parser.collect_stats())

# Final message to output indicating everything was a success
print('\n=========Finito=========\n')