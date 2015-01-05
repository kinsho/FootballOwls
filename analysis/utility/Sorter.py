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

	# Function is responsible for sorting dictionary data by the numeric keys associated
	# with the dara
	#
	# @param {Dictionary} data - the data to format
	#
	# @returns {OrderedDictionary} - a dictionary object where the values are ordered appropriately by key
	#
	# @author kinsho
	#
	@staticmethod
	def sort_by_index(data):

		return collections.OrderedDict(sorted(data.items(), key=lambda x: int(x[0])))