import pdb
import json
import operator
from SiteScraper import *

# Class is responsible for fetching sack rates over the last four weeks of any season
# @author kinsho
#
class SackRateFormatter:

	# Constants
	END_CALCULATIONS_TEXT_FILE = 'info/sackCalculations.txt'

	def __init__(self):

		#Attributes/Params
		self.text = ''

	# Function is responsible for cleaning out the data for restoring the text buffer back to its
	# initialized state
	#
	# @author kinsho
	#
	def reset_data(self):

		self.text = ''

	# Function is responsible for sorting and styling the presentation of the sack rate stats
	#
	# @param {Dictionary} data - the data to format
	# @param {int} year - the year that the data references
	#
	# @author kinsho
	#
	def prettify(self, data, year):

		self.text += "\n======================\n"
		self.text += str(year)
		self.text += "\n======================\n\n"

		sorted_data = sorted(data.items(), key=operator.itemgetter(1))

		for datum in sorted_data:
			self.text += (datum[0] + "  -------->   " + str(datum[1]) + '\n')

		print(self.text)

	# Function is responsible for writing out the newly formatted data into a presentable format
	#
	# @param {JSON} text - the text to write out
	#
	# @author kinsho
	#
	def write_to_file(self):

		SiteScraper.write_into_file(self.text, self.END_CALCULATIONS_TEXT_FILE)