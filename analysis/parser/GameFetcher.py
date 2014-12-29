import string
import pdb
import json
from SiteScraper import *

# Class is responsible for fetching sack rates over the last four weeks of any season
# @author kinsho
#
class GameFetcher:

	# Constants
	WEEK_URL = 'http://www.pro-football-reference.com/years/$year/week_$week.htm'
	BOX_SCORE_URL = 'http://www.pro-football-reference.com$box'
	BOX_SCORES_TEXT_FILE = 'info/boxScores.txt'

	def __init__(self):

		#Attributes/Params

		self.weeks = [14, 15, 16, 17]
		self.years = [2009, 2010, 2011, 2012, 2013]

	# Function is responsible for fetching the box scores of all relevant games
	#
	# @return {JSON} - a JSON string containing all the HTML comprising the box scores for the weeks and years
	#       that are indicated
	#
	# @author kinsho
	#
	def fetch_box_scores(self):

		records = {}
		week_template = string.Template(self.WEEK_URL)
		box_score_template = string.Template(self.BOX_SCORE_URL)

		for year in self.years:

			for week in self.weeks:

				print("About to pull the box scores for all the games in week {} of {}".format(week, year))

				# Fetch the contents of the website with the current week's scoreboard

				url = week_template.substitute( {'year' : year, 'week' : week} )
				soup = SiteScraper.cook_soup(url)

				links = soup.find_all('a')
				for link in links:

					if len(link.contents) > 0 and 'View full boxscore' in link.contents[0]:

						url = box_score_template.substitute( {'box' : link.attrs['href']} )
						soup = SiteScraper.scrape_html(url)

						try:
							records[year]
						except KeyError:
							records[year] = {}

						try:
							records[year][week]
						except KeyError:
							records[year][week] = []

						records[year][week].append(soup)

				print('The HTML has been pulled!\n')

		return json.dumps(records)

	# Function is responsible for writing out box score data to an external text file
	#
	# @param {JSON} data - the data to write out
	#
	# @author kinsho
	#
	def write_to_file(self, data):

		SiteScraper.write_into_file(data, self.BOX_SCORES_TEXT_FILE)

# Code to execute the code above
parser = GameFetcher()
parser.write_to_file(parser.fetch_box_scores())

# Final message to output indicating everything was a success
print('Finito')