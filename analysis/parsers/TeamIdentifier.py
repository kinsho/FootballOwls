import pdb
import json
from SiteScraper import *

# Class is responsible for fetching sack rates over the last four weeks of any season
# @author kinsho
#
class TeamIdentifer:

	# Constants
	BOX_SCORES_TEXT_FILE = '../info/boxScores.txt'

	def __init__(self):

		#Attributes/Params

		self.teams = [
			'Giants',
			'Eagles',
			'Cowboys',
			'Redskins',
			'Bears',
			'Lions',
			'Packers',
			'Vikings',
			'Buccaneers',
			'Saints',
			'Falcons',
			'Panthers',
			'49ers',
			'Seahawks',
			'Rams',
			'Cardinals',
			'Jets',
			'Patriots',
			'Dolphins',
			'Bills',
			'Chiefs',
			'Broncos',
			'Chargers',
			'Raiders',
			'Ravens',
			'Steelers',
			'Bengals',
			'Browns',
			'Colts',
			'Texans',
			'Jaguars',
			'Titans'
		]

	# Function is identifying all the teams indicated within each box score
	#
	# @return {JSON} - a JSON string containing stats regarding sacks and passes attempted
	# 	for each team within every game noted within the passed HTML
	#
	# @author kinsho
	#
	def identify_teams(self):

		records = json.loads(self.read_from_file())

		for year, weeks in records.iteritems():

			for week, games in weeks.iteritems():

				print("\nAbout to identify who played what in week {} of {}".format(week, year))

				for index, game in enumerate(games):

					soup = SiteScraper.soupify(game)

					team_names = soup.find('h1').contents[0].split(' at ')

					away_team = ''
					home_team = ''

					for team in self.teams:

						if team in team_names[0]:
							away_team = team
						elif team in team_names[1]:
							home_team = team

					html_content = records[year][week][index]

					records[year][week][index] = {
						'content' : html_content,
						'away_team' : away_team,
						'home_team' : home_team
					}

					print("{} @ {}".format(away_team, home_team))

		return json.dumps(records)

	# Function is responsible for fetching all the HTML from the text cache
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

		SiteScraper.write_into_file(data, self.BOX_SCORES_TEXT_FILE)

# Code to execute the code above
parser = TeamIdentifer()
parser.write_to_file(parser.identify_teams())

# Final message to output indicating everything was a success
print('Finito')