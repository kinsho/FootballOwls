import json
import math
import pdb
from formatters import GenericFormatter
from utility import Sorter
from utility import SiteScraper

# Class is responsible for determining whether a team has progressed in a specific area over the course of the year
#
# @author kinsho
#
class SingleStatCalculator:

	# Constants
	STATS_TEXT_FILE = 'info/teamStats.txt'

	def __init__(self):

		#Attributes/Params

		self.team_rates = {}


	def initialize(self):

		self.team_rates = {
			'Giants' : {},
			'Eagles' : {},
			'Cowboys' : {},
			'Redskins' : {},
			'Bears' : {},
			'Lions' : {},
			'Packers' : {},
			'Vikings' : {},
			'Buccaneers' : {},
			'Saints' : {},
			'Falcons' : {},
			'Panthers' : {},
			'49ers' : {},
			'Seahawks' : {},
			'Rams' : {},
			'Cardinals' : {},
			'Jets' : {},
			'Patriots' : {},
			'Dolphins' : {},
			'Bills' : {},
			'Chiefs' : {},
			'Broncos' : {},
			'Chargers' : {},
			'Raiders' : {},
			'Ravens' : {},
			'Steelers' : {},
			'Bengals' : {},
			'Browns' : {},
			'Colts' : {},
			'Texans' : {},
			'Jaguars' : {},
			'Titans' : {}
		}

		for team, team_rate in self.team_rates.iteritems():

			self.team_rates[team] = {
				'early_stats': [],
				'late_stats': [],
				'early_average': 0,
				'late_average': 0,
			}

	# Function is massaging all the collected stats into actionable data to try to figure
	# out which team will win the Super Bowl
	#
	# @author kinsho
	#
	def calculate(self):

		records = json.loads(self.read_from_file())
		formatter = GenericFormatter.Formatter()

		formatter.set_header(records['stat_descriptor'])
		del records['stat_descriptor']

		records = Sorter.Sorter.sort_by_index(records)

		for year, weeks in records.iteritems():

			self.initialize()

			weeks = Sorter.Sorter.sort_by_index(weeks)

			for week, games in weeks.iteritems():

				for index, game in enumerate(games):

					away_team = game['away_team']
					home_team = game['home_team']

					if len(self.team_rates[away_team['name']]['early_stats']) < 12:
						self.team_rates[away_team['name']]['early_stats'].append(away_team['stat'])
					else:
						self.team_rates[away_team['name']]['late_stats'].append(away_team['stat'])

					if len(self.team_rates[home_team['name']]['early_stats']) < 12:
						self.team_rates[home_team['name']]['early_stats'].append(home_team['stat'])
					else:
						self.team_rates[home_team['name']]['late_stats'].append(home_team['stat'])

			for team, rate in self.team_rates.iteritems():
				self.team_rates[team]['early_average'] = math.fsum(rate['early_stats']) / len(rate['early_stats'])
				self.team_rates[team]['late_average'] = math.fsum(rate['late_stats']) / len(rate['late_stats'])

#				self.team_rates[team] = self.team_rates[team]['late_average'] - self.team_rates[team]['early_average']
				self.team_rates[team] = self.team_rates[team]['late_average']
				self.team_rates[team] = round(self.team_rates[team], 3)

			formatter.prettify(self.team_rates, year)

		formatter.write_to_file()

	# Function is responsible for fetching all the stats data from the text cache
	#
	# @param {JSON} data - the data to read
	#
	# @author kinsho
	#
	def read_from_file(self):

		return SiteScraper.SiteScraper.read_from_file(self.STATS_TEXT_FILE)

# Code to execute the code above
parser = SingleStatCalculator()
parser.calculate()

# Final message to output indicating everything was a success
print('\n=====Finito=====\n')