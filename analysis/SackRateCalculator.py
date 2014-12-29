import json
from SiteScraper import *
from analysis.formatter import SackRateFormatter
from analysis.utility import Sorter

# Class is responsible for fetching sack rates over the last four weeks of any season
# @author kinsho
#
class SackRateCalculator:

	# Constants
	STATS_TEXT_FILE = 'info/sackRates.txt'

	def __init__(self):

		#Attributes/Params

		self.team_rates = {}


	def initialize(self):

		self.team_rates = {
			'Giants' : 0,
			'Eagles' : 0,
			'Cowboys' : 0,
			'Redskins' : 0,
			'Bears' : 0,
			'Lions' : 0,
			'Packers' : 0,
			'Vikings' : 0,
			'Buccaneers' : 0,
			'Saints' : 0,
			'Falcons' : 0,
			'Panthers' : 0,
			'49ers' : 0,
			'Seahawks' : 0,
			'Rams' : 0,
			'Cardinals' : 0,
			'Jets' : 0,
			'Patriots' : 0,
			'Dolphins' : 0,
			'Bills' : 0,
			'Chiefs' : 0,
			'Broncos' : 0,
			'Chargers' : 0,
			'Raiders' : 0,
			'Ravens' : 0,
			'Steelers' : 0,
			'Bengals' : 0,
			'Browns' : 0,
			'Colts' : 0,
			'Texans' : 0,
			'Jaguars' : 0,
			'Titans' : 0
		}

	# Function is massaging all the collected stats into actionable data to try to figure
	# out which team will win the Super Bowl
	#
	# @return {JSON} - a JSON string containing sack rates for each team within the last four
	#	weeks of any given season
	#
	# @author kinsho
	#
	def calculate(self):

		records = Sorter.Sorter.sort_by_year(json.loads(self.read_from_file()))
		formatter = SackRateFormatter.SackRateFormatter()

		for year, weeks in records.iteritems():

			print ("\nAbout to calculate sack rates for the recorded weeks for the year of {}...".format(year))
			self.initialize()

			num_weeks = 0

			for week, games in weeks.iteritems():

				num_weeks += 1

				for index, game in enumerate(games):

					away_team = game['away_team']
					home_team = game['home_team']

					self.team_rates[away_team['name']] += (away_team['sacks'] / home_team['passes_attempted'])
					self.team_rates[home_team['name']] += (home_team['sacks'] / away_team['passes_attempted'])

			for team, rate in self.team_rates.iteritems():
				self.team_rates[team] = round(rate / num_weeks, 3)

			formatter.prettify(self.team_rates, year)

		formatter.write_to_file()

	# Function is responsible for fetching all the stats data from the text cache
	#
	# @param {JSON} data - the data to write out
	#
	# @author kinsho
	#
	def read_from_file(self):

		return SiteScraper.read_from_file(self.STATS_TEXT_FILE)

# Code to execute the code above
parser = SackRateCalculator()
parser.calculate()

# Final message to output indicating everything was a success
print('Finito')