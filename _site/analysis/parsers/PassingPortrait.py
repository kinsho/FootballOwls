import pdb
import json
from SiteScraper import *

# Class is responsible for fetching pass efficiency stats over the last four weeks of any season
#
# @author kinsho
#
class PassEfficiency:

	# Constants
	BOX_SCORES_TEXT_FILE = 'info/boxScores.txt'
	STATS_TEXT_FILE = 'info/passStats.txt'
	PASS_STATS_TABLE_ID = 'skill_stats'

	def __init__(self):
		pass

	# Function is responsible for collecting all the relevant stats for pass efficiency metrics
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

					# Section of code below is responsible for collecting all the relevant pass stats
					rows = soup.find(id=self.PASS_STATS_TABLE_ID).find('tbody').find_all('tr')
					current_team = 'away_team'
					away_team_pa = 0
					away_team_pc = 0
					away_team_ints = 0
					away_team_yds = 0
					away_team_tds = 0
					home_team_pa = 0
					home_team_pc = 0
					home_team_ints = 0
					home_team_tds = 0
					home_team_yds = 0

					for row in rows:

						if len(row.attrs['class']) == 1:

							passes_completed = row.find_all('td')[2]
							passes_attempted = row.find_all('td')[3]
							yardage = row.find_all('td')[4]
							touchdowns = row.find_all('td')[5]
							interceptions = row.find_all('td')[6]

							if len(passes_completed.contents) > 0:

								if current_team == 'away_team':
									away_team_pc += int(passes_completed.contents[0])

								else:
									home_team_pc += int(passes_completed.contents[0])

							if len(passes_attempted.contents) > 0:

								if current_team == 'away_team':
									away_team_pa += int(passes_attempted.contents[0])

								else:
									home_team_pa += int(passes_attempted.contents[0])

							if len(yardage.contents) > 0:

								if current_team == 'away_team':
									away_team_yds += int(yardage.contents[0])

								else:
									home_team_yds += int(yardage.contents[0])

							if len(touchdowns.contents) > 0:

								if current_team == 'away_team':
									away_team_tds += int(touchdowns.contents[0])

								else:
									home_team_tds += int(touchdowns.contents[0])

							if len(interceptions.contents) > 0:

								if current_team == 'away_team':
									away_team_ints += int(interceptions.contents[0])

								else:
									home_team_ints += int(interceptions.contents[0])

						else:

							current_team = 'home_team'

					# Section of code below records the information that was scraped in the lines of
					# code above
					away_team = game['away_team']
					home_team = game['home_team']

					records[year][week][index] = {
						'away_team' : {
							'name' : away_team,
							'passes_completed' : away_team_pc,
							'passes_attempted' : away_team_pa,
							'yardage' : away_team_yds,
							'touchdowns' : away_team_tds,
							'interceptions' : away_team_ints
						},
						'home_team' : {
							'name' : home_team,
							'passes_completed' : home_team_pc,
							'passes_attempted' : home_team_pa,
							'yardage' : home_team_yds,
							'touchdowns' : home_team_tds,
							'interceptions' : home_team_ints
						},
					}

					print("{} completed {} passes out of {} passes attempted for {} yards".format(away_team, away_team_pc, away_team_pa, away_team_yds))
					print("{} completed {} passes out of {} passes attempted for {} yards".format(home_team, home_team_pc, home_team_pa, home_team_yds))
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
parser = PassEfficiency()
parser.write_to_file(parser.collect_stats())

# Final message to output indicating everything was a success
print('Finito')