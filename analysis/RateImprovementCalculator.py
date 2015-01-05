import json
import math
import pdb
from SiteScraper import *
from formatter import GenericFormatter
from utility import Sorter

# Class is responsible for determining whether a team has progressed in a specific area over the course of the year
#
# @author kinsho
#
class RateImprovementCalculator:

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
				'early_base_stats': [],
				'late_base_stats': [],
				'early_divisor_stats': [],
				'late_divisor_stats': [],
				'early_rate': 0,
				'late_rate': 0,
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

					if len(self.team_rates[away_team['name']]['early_base_stats']) < 12:
						self.team_rates[away_team['name']]['early_base_stats'].append(away_team['base'])
						self.team_rates[away_team['name']]['early_divisor_stats'].append(away_team['divisor'])
					else:
						self.team_rates[away_team['name']]['late_base_stats'].append(away_team['base'])
						self.team_rates[away_team['name']]['late_divisor_stats'].append(away_team['divisor'])

					if len(self.team_rates[home_team['name']]['early_base_stats']) < 12:
						self.team_rates[home_team['name']]['early_base_stats'].append(home_team['base'])
						self.team_rates[home_team['name']]['early_divisor_stats'].append(home_team['divisor'])
					else:
						self.team_rates[home_team['name']]['late_base_stats'].append(home_team['base'])
						self.team_rates[home_team['name']]['late_divisor_stats'].append(home_team['divisor'])

			for team, rate in self.team_rates.iteritems():
				self.team_rates[team]['early_average'] = math.fsum(rate['early_base_stats']) / math.fsum(rate['early_divisor_stats'])
				self.team_rates[team]['late_average'] = math.fsum(rate['late_base_stats']) / math.fsum(rate['late_divisor_stats'])

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

		return SiteScraper.read_from_file(self.STATS_TEXT_FILE)

# Code to execute the code above
parser = RateImprovementCalculator()
parser.calculate()

# Final message to output indicating everything was a success
print('\n=====Finito=====\n')