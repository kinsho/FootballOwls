import pdb
import json
from utility import SiteScraper

# Class is responsible for figuring out how well teams have been performing better on defense over the course of the season
#
# @author kinsho
#
class YardageAllowedOverSeason:

	# Constants
	BOX_SCORES_TEXT_FILE = 'info/boxScores.txt'
	STATS_TEXT_FILE = 'info/teamStats.txt'
	PASS_STATS_TABLE_ID = 'skill_stats'
	DEF_STATS_TABLE_ID = 'def_stats'

	def __init__(self):
		pass

	# Function is responsible for collecting all the relevant stats to calculate defensive efficiency over the course
	# of a season
	#
	# @return {JSON} - wrapped stats
	#
	# @author kinsho
	#
	def collect_stats(self):

		records = json.loads(self.read_from_file())

		for year, weeks in records.iteritems():

			for week, games in weeks.iteritems():

				print("\nAbout to start collecting stats for week {} of {}\n".format(week, year))

				for index, game in enumerate(games):

					soup = SiteScraper.SiteScraper.soupify(game['content'])

					# Section of code below is responsible for calculating the total yardage accrued by both teams
					# over the duration of the game
					rows = soup.find(id=self.PASS_STATS_TABLE_ID).find('tbody').find_all('tr')
					current_team = 'away_team'
					away_team_ty = 0
					home_team_ty = 0

					for row in rows:

						if len(row.attrs['class']) == 1:

							pass_yardage = row.find_all('td')[4]
							rush_yardage = row.find_all('td')[9]

							if len(pass_yardage.contents) > 0:

								if current_team == 'away_team':
									away_team_ty += int(pass_yardage.contents[0])

								else:
									home_team_ty += int(pass_yardage.contents[0])

							if len(rush_yardage.contents) > 0:

								if current_team == 'away_team':
									away_team_ty += (int(rush_yardage.contents[0]) * 2.2)

								else:
									home_team_ty += (int(rush_yardage.contents[0]) * 2.2)

						else:

							current_team = 'home_team'

					# Section of code below records the information that was scraped in the lines of
					# code above
					away_team = game['away_team']
					home_team = game['home_team']

					records[year][week][index] = {
						'away_team' : {
							'name' : away_team,
							'stat' : home_team_ty
						},
						'home_team' : {
							'name' : home_team,
							'stat' : away_team_ty
						},
					}

					print("{} let up {} adjusted yards".format(away_team, home_team_ty))
					print("{} let up {} adjusted yards".format(home_team, away_team_ty))
					print("\n")

		# Syntactic sugar meant to aid presentation logic. While we shouldn't be concerned about presentation here,
		# we handle this here so that we free ourselves from having to write multiple formatters with incredibly
		# similar logic
		records['stat_descriptor'] = 'Improvement in Average Yardage Allowed by Team Defenses'

		return json.dumps(records)

	# Function is responsible for fetching all the box score data from the text cache
	#
	# @param {JSON} data - the data to write out
	#
	# @author kinsho
	#
	def read_from_file(self):

		return SiteScraper.SiteScraper.read_from_file(self.BOX_SCORES_TEXT_FILE)

	# Function is responsible for writing out the newly touched-up box score data to an external
	# text file
	#
	# @param {JSON} data - the data to write out
	#
	# @author kinsho
	#
	def write_to_file(self, data):

		SiteScraper.SiteScraper.write_into_file(data, self.STATS_TEXT_FILE)

# Code to execute the code above
parser = YardageAllowedOverSeason()
parser.write_to_file(parser.collect_stats())

# Final message to output indicating everything was a success
print('Finito')