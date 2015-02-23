import pdb
import json
import operator
from SiteScraper import *

# Class is responsible for presenting pass stats in a easy-to-read format
# @author kinsho
#
class PassEfficiencyFormatter:

	# Constants
	END_CALCULATIONS_TEXT_FILE = 'info/passCalculations.txt'

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

	# Function is responsible for sorting and styling the presentation of the pass stats
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

		sorted_data = sorted(data.items(), key=lambda x: x[1]['pa'])

		for datum in sorted_data:
			self.text += (datum[0] + "  --->   " + str(datum[1]['pc']) + ' / ' + str(datum[1]['pa']) +
				" passes completed (" + str(datum[1]['pp']) + "%) with a TD/Int ratio of " +
				str(datum[1]['tds']) + '/' + str(datum[1]['ints']) + ' and a YPP of ' + str(datum[1]['ypp']) + '\n')

		print(self.text)

	# Function is responsible for writing out the newly formatted data into a presentable format
	#
	# @param {JSON} text - the text to write out
	#
	# @author kinsho
	#
	def write_to_file(self):

		SiteScraper.write_into_file(self.text, self.END_CALCULATIONS_TEXT_FILE)