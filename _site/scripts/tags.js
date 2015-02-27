(function()
{

// ----------------- ENUM/CONSTANTS --------------------------

	var TAG_PARENT_HEADER_CLASS = 'tagParentHeader',
		TAG_HEADER_CLASS = 'tagHeader',

		REVEAL_CLASS = 'reveal';

// ----------------- PRIVATE VARIABLES --------------------------

	var parentContainerDefaultHeight = 60,
		childContainerDefaultHeight = 60,

		childTagHeaderHeight = 30;

// ----------------- MODULE DEFINITION --------------------------

	var my =
	{
		toggleContainer: function(event)
		{
			var container = event.currentTarget.parentNode;

			if (container.classList.contains(REVEAL_CLASS))
			{
				container.classList.remove(REVEAL_CLASS);
			}
			else
			{
				container.classList.add(REVEAL_CLASS);
			}
		}
	};

// ----------------- INITIALIZATION LOGIC --------------------------

	document.addEventListener("DOMContentLoaded", function()
	{

// ----------------- LISTENERS --------------------------

		var parentHeaders = document.querySelectorAll('.' + TAG_PARENT_HEADER_CLASS),
			childHeaders = document.querySelectorAll('.' + TAG_HEADER_CLASS),
			i;

		for (i = parentHeaders.length - 1; i >= 0; i--)
		{
			parentHeaders[i].addEventListener('click', my.toggleContainer, false);
		}
		for (i = childHeaders.length - 1; i >= 0; i--)
		{
			childHeaders[i].addEventListener('click', my.toggleContainer, false);
		}

	});

// ----------------- END --------------------------

	if (!(window.footballOwls))
	{
		window.footballOwls = {};
	}

	window.footballOwls.tags = my;
}());