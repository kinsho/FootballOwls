import json
from SiteScraper import *
from analysis.formatter import PassEfficiencyFormatter
from analysis.utility import Sorter

# Class is responsible for crunching pass stats
# @author kinsho
#
class PassEfficiencyCalculator:

	# Constants
	STATS_TEXT_FILE = 'info/passStats.txt'

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

		for team, value in self.team_rates.iteritems():

			self.team_rates[team] = {
				'pc' : 0,
				'pa' : 0,
				'pp' : 0,
				'yds' : 0,
				'tds' : 0,
				'ints' : 0,
				'ypp' : 0
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
		formatter = PassEfficiencyFormatter.PassEfficiencyFormatter()

		for year, weeks in records.iteritems():

			print ("\nAbout to crunch pass stats for the recorded weeks for the year of {}...".format(year))
			self.initialize()

			num_weeks = 0

			for week, games in weeks.iteritems():

				num_weeks += 1

				for index, game in enumerate(games):

					away_team = game['away_team']
					home_team = game['home_team']

					self.team_rates[away_team['name']]['pa'] += (away_team['passes_attempted'])
					self.team_rates[away_team['name']]['pc'] += (away_team['passes_completed'])
					self.team_rates[away_team['name']]['yds'] += (away_team['yardage'])
					self.team_rates[away_team['name']]['tds'] += (away_team['touchdowns'])
					self.team_rates[away_team['name']]['ints'] += (away_team['interceptions'])

					self.team_rates[home_team['name']]['pa'] += (home_team['passes_attempted'])
					self.team_rates[home_team['name']]['pc'] += (home_team['passes_completed'])
					self.team_rates[home_team['name']]['yds'] += (home_team['yardage'])
					self.team_rates[home_team['name']]['tds'] += (home_team['touchdowns'])
					self.team_rates[home_team['name']]['ints'] += (home_team['interceptions'])

			for team, rate in self.team_rates.iteritems():
				self.team_rates[team]['ypp'] = round(float(rate['yds']) / float(rate['pc']), 3)
				self.team_rates[team]['pp'] = round(float(rate['pc']) / float(rate['pa']), 3) * 100
				self.team_rates[team]['differential'] = rate['tds'] - rate['ints']

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
parser = PassEfficiencyCalculator()
parser.calculate()

# Final message to output indicating everything was a success
print('Finito')