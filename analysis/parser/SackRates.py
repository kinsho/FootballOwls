import pdb
import json
from SiteScraper import *

# Class is responsible for fetching sack rates over the last four weeks of any season
# @author kinsho
#
class SackRates:

	# Constants
	BOX_SCORES_TEXT_FILE = 'info/boxScores.txt'
	STATS_TEXT_FILE = 'info/sackRates.txt'
	PASS_STATS_TABLE_ID = 'skill_stats'
	DEF_STATS_TABLE_ID = 'def_stats'

	def __init__(self):
		pass

	# Function is responsible for collecting all the relevant stats to calculate sack rates
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

					soup = SiteScraper.soupify(game['content'])

					# Section of code below is responsible for calculating the passes attempted by each
					# team over the course of the game
					rows = soup.find(id=self.PASS_STATS_TABLE_ID).find('tbody').find_all('tr')
					current_team = 'away_team'
					away_team_pa = 0
					home_team_pa = 0

					for row in rows:

						if len(row.attrs['class']) == 1:

							passes_attempted = row.find_all('td')[3]
							if len(passes_attempted.contents) > 0:

								if current_team == 'away_team':
									away_team_pa += int(passes_attempted.contents[0])

								else:
									home_team_pa += int(passes_attempted.contents[0])

						else:

							current_team = 'home_team'

					# Section of code below is responsible for calculating the sacks made by each team
					# over the course of the game
					rows = soup.find(id=self.DEF_STATS_TABLE_ID).find('tbody').find_all('tr')
					current_team = 'away_team'
					away_team_sacks = 0.0
					home_team_sacks = 0.0

					for row in rows:

						if len(row.attrs['class']) == 1:

							sacks = row.find_all('td')[2]
							if len(sacks.contents) > 0:

								if current_team == 'away_team':
									away_team_sacks += float(sacks.contents[0])

								else:
									home_team_sacks += float(sacks.contents[0])

						else:

							current_team = 'home_team'

					# Section of code below records the information that was scraped in the lines of
					# code above
					away_team = game['away_team']
					home_team = game['home_team']

					records[year][week][index] = {
						'away_team' : {
							'name' : away_team,
							'passes_attempted' : away_team_pa,
							'sacks' : away_team_sacks
						},
						'home_team' : {
							'name' : home_team,
							'passes_attempted' : home_team_pa,
							'sacks' : home_team_sacks
						},
					}

					print("{} recorded {} sacks over {} passes attempted".format(away_team, away_team_sacks, home_team_pa))
					print("{} recorded {} sacks over {} passes attempted".format(home_team, home_team_sacks, away_team_pa))
					print("\n")

		return json.dumps(records)

	# Function is responsible for fetching all the box score data from the text cache
	#
	# @param {JSON} data - the data to write out
	#
	# @author kinsho
	#
	def read_from_file(self):

		return SiteScraper.read_from_file(self.BOX_SCORES_TEXT_FILE)

	# Function is responsible for writing out the newly touched-up box score data to an external
	# text file
	#
	# @param {JSON} data - the data to write out
	#
	# @author kinsho
	#
	def write_to_file(self, data):

		SiteScraper.write_into_file(data, self.STATS_TEXT_FILE)

# Code to execute the code above
parser = SackRates()
parser.write_to_file(parser.collect_stats())

# Final message to output indicating everything was a success
print('Finito')