require 'FileUtils'

# Switching command line context over to the scripts directory
Dir.chdir('scripts')

# Library Scripts
FileUtils.cp_r 'library/jquery/dist/jquery.js', '../_assets/javascripts/library'
FileUtils.cp_r 'library/d3/d3.js', '../_assets/javascripts/library'
FileUtils.cp_r 'library/d3.layout.cloud/d3.layout.cloud.js', '../_assets/javascripts/library'
FileUtils.cp_r 'library/handlebars/handlebars.js', '../_assets/javascripts/library'

# App Scripts
FileUtils.cp_r((Dir.glob('*.js')), '../_assets/javascripts')