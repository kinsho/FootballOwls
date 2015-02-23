(function()
{

// ----------------- MODULE DEFINITION --------------------------

	var my =
	{
		/**
		  * The template to use to populate posts within the post carousel in the left pane
		  */
		postCarousel:
			'{{#each postData}}' +
				'<div class="postListingDate">' +
					'{{ this.date }}' +
				'</div>' +
				'<div class="postListingTitle">' +
					'{{ this.title }}' +
				'</div>' +
			'{{/each}}'
	};

// ----------------- END --------------------------

	if (!(window.footballOwls))
	{
		window.footballOwls = {};
	}

	window.footballOwls.templates = my;
}());