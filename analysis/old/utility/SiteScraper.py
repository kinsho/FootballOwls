import urllib2
from bs4 import BeautifulSoup

class SiteScraper:

	def __init__(self):
		pass

	# Function is responsible fetching the contents of the web site whose URL is passed
	# as a parameter. The contents are then wrapped within a BeautifulSoup object
	#
	# @param {String} url - the URL of the site that will need to be scraped
	#
	# @return {Object} a BeautifulSoup object that contains all the HTML content from the passed URL
	#
	# @author kinsho
	#
	@staticmethod
	def cook_soup(url):

		site = urllib2.urlopen(url)
		site_html = site.read()
		return BeautifulSoup(site_html)

	# Function is responsible for transforming an HTML string into an actionable BeautifulSoup object
	#
	# @param {String} html - the HTML to wrap into a BeautifulSoup object
	#
	# @return {Object} - the aforementioned BeautifulSoup object
	#
	# @author kinsho
	#
	@staticmethod
	def soupify(html):

		return BeautifulSoup(html)

	# Function is responsible fetching the contents of the web site whose URL is passed
	# as a parameter.
	#
	# @param {String} url - the URL of the site that will need to be scraped
	#
	# @return {String} the HTML of the aforementioned web site
	#
	# @author kinsho
	#
	@staticmethod
	def scrape_html(url):

		site = urllib2.urlopen(url)
		return site.read()

	# Function is responsible for writing passed data into the indicated text file
	#
	# @param {String} data - the data to write out to the text file
	# @param {String} file_path - the location of the text file that will receive the data
	#
	# @author kinsho
	#
	@staticmethod
	def write_into_file(data, file_path):

		text_file = open(file_path, 'w')
		text_file.write(data)
		text_file.close()

	# Function is responsible for reading data out of files
	#
	# @param {String} file_path - the location of the text file from which to read data
	#
	# @author kinsho
	#
	@staticmethod
	def read_from_file(file_path):

		text_file = open(file_path, 'r')
		return text_file.read()