//= require library/d3/d3
//= require library/d3.layout.cloud/d3.layout.cloud

(function()
{

// ----------------- ENUM/CONSTANTS --------------------------

	var TAGS_CONTAINER = 'tagsContainer',
		TAGS_SELECTOR = 'tag',
		WORD_CLOUD_ID = 'tagCloud',
		WORD_CLOUD_TAG_LABEL_ID = 'tagsLabel',

		FADE_CLASS = 'fadeIn',

		RANGE = ['#BBB', '#AAA', '#999', '#888', '#777', '#666', '#555', '#444'],
		CONTAINER_WIDTH = 170,
		CONTAINER_HEIGHT = 300,
		CLOUD_WIDTH = 300,
		CLOUD_HEIGHT = 400,

		HEADER_HEIGHT = 150;

// ----------------- MODULE DEFINITION --------------------------

	var my =
	{
		fadeInTagLabel: function()
		{
			document.getElementById(WORD_CLOUD_TAG_LABEL_ID).classList.add(FADE_CLASS);
		},

		fadeOutTagLabel: function()
		{
			document.getElementById(WORD_CLOUD_TAG_LABEL_ID).classList.remove(FADE_CLASS);
		}
	};

// ----------------- INITIALIZATION LOGIC --------------------------

	document.addEventListener("DOMContentLoaded", function()
	{
		var tagsContainer = document.getElementById(TAGS_CONTAINER),
			tagNodes = tagsContainer.querySelectorAll('.' + TAGS_SELECTOR),
			tagCollection = [],
			words,
			colors,
			j;

		// Extract all the tags from the HTML and store them in an array
		for (j = tagNodes.length - 1; j >= 0; j--)
		{
			tagCollection.push(tagNodes[j].innerHTML);
		}

		// Empty out the tag container first before putting in the word cloud
		while(tagsContainer.firstChild)
		{
			tagsContainer.removeChild(tagsContainer.firstChild);
		}

		// Process the tags into a format that can be readily ingested by the cloud library
		words = tagCollection.map(function(d)
		{
			return { text: d, size: 10 + Math.random() * 10 };
		});

		// Ready the colors that will be used within the cloud
		colors = d3.scale.linear()
			.domain([0, 1, 2, 3, 4, 5, 6, 10, 15, 20, 100])
			.range(RANGE);

		// Initialize the cloud before generation
		d3.layout.cloud().size([CLOUD_WIDTH, CLOUD_HEIGHT])
			.words(words)
			.rotate(0)
			.font("Georgia")
			.fontSize(function(d) { return d.size; })
			.on("end", draw)
			.start();

		// Function will be responsible for the actual rendering of the cloud
		function draw(words)
		{
			d3.select("#" + TAGS_CONTAINER).append("svg")
				.attr("width", CONTAINER_WIDTH)
				.attr("height", CONTAINER_HEIGHT)
				.attr("id", WORD_CLOUD_ID)
				.append("g")
				.attr("transform", "translate(30, " + HEADER_HEIGHT + ")")
				.selectAll("text")
				.data(words)
				.enter().append("text")
				.style("font-size", function(d) { return d.size + "px"; })
				.style("fill", function(d, i) { return colors(i); })
				.attr("transform", function(d)
				{
					return "translate(" + [d.x, d.y] + ")";
				})
				.text(function(d) { return d.text; });
		}

// ----------------- LISTENERS --------------------------

		tagsContainer.addEventListener('mouseover', my.fadeInTagLabel, false);
		tagsContainer.addEventListener('mouseleave', my.fadeOutTagLabel, false);
	});


// ----------------- END --------------------------

	if (!(window.footballOwls))
	{
		window.footballOwls = {};
	}

	window.footballOwls.tags = my;
}());