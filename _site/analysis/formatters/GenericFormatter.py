import pdb
import json
import operator
from utility import SiteScraper

# Class is responsible for presenting teams in ranked order according to a particular statistic or rate
#
# @author kinsho
#
class Formatter:

	# Constants
	END_CALCULATIONS_TEXT_FILE = 'info/data.txt'

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

	# Function is responsible for setting a header on the stylized text file. Should be the first
	# function called, even before the prettify method is invoked
	#
	# @author kinsho
	#
	def set_header(self, header):

		self.text += "\n~~~~~~~~~~~~    {}    ~~~~~~~~~~~~~\n".format(header)


	# Function is responsible for sorting and styling the presentation of the improvement data
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

		SiteScraper.SiteScraper.write_into_file(self.text, self.END_CALCULATIONS_TEXT_FILE)