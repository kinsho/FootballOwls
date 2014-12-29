import pdb
import collections
import operator

# Class is responsible for assisting the formatters in presenting the data by sorting the data
#
# @author kinsho
#
class Sorter:

	def __init__(self):

		pass

	# Function is responsible for sorting data by year
	#
	# @param {Dictionary} data - the data to format
	#
	# @returns {OrderedDictionary} - a dictionary object where the 'year' keys are ordered appropriately
	#
	# @author kinsho
	#
	@staticmethod
	def sort_by_year(data):

		return collections.OrderedDict(sorted(data.items(), key=lambda x: x[0]))