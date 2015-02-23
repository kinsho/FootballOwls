//= require library/handlebars

(function()
{

// ----------------- ENUM/CONSTANTS --------------------------

	var POSTS_CONTAINER = 'postsContainer',
		POST_DATE_SELECTOR = 'postListingDate',
		POST_TITLE_SELECTOR = 'postListingTitle',

		PREV_ARROW = 'leftPostIndexNavigator',
		NEXT_ARROW = 'rightPostIndexNavigator',

		EXIT_LEFT_ANIMATION = 'shiftLeft',
		EXIT_RIGHT_ANIMATION = 'shiftRight',
		ENTER_LEFT_ANIMATION = 'enterFromLeft',
		ENTER_RIGHT_ANIMATION = 'enterFromRight',

		FAUX_DISABLED_CLASS = 'disabled';

// ----------------- PRIVATE PROPERTIES/FUNCTIONS --------------------------

	var postTemplate = Handlebars.compile(window.footballOwls.templates.postCarousel), // the template to use to generate the post index
		posts = [], // the store that will contain all post metadata

		/**
		 * Function that deduces and returns the post metadata to display within the post index
		 *
		 * @param {Number} pageNumber - the page number to use to figure out which posts to return
		 *
		 * @return {String} - the HTML that will need to be loaded into the index
		 *
		 * @author kinsho
		 *
		 */
		findPostsToList = function(pageNumber)
		{
			// If the page number is not viable, return just an empty string, as nothing should be rendered here
			if (!posts[pageNumber * 5])
			{
				return "";
			}

			return postTemplate
			({
				postData: posts.slice(pageNumber * 5, pageNumber * 5 + 5)
			});
		},

		/**
		 * Function that wipes out all animation classes from the posts container so that we can readily shift pages
		 * again if need be
		 *
		 * @author kinsho
		 *
		 */
		removeAnimationClasses = function()
		{
			var container = document.getElementById(POSTS_CONTAINER);

			container.classList.remove(ENTER_LEFT_ANIMATION);
			container.classList.remove(ENTER_RIGHT_ANIMATION);
			container.classList.remove(EXIT_LEFT_ANIMATION);
			container.classList.remove(EXIT_RIGHT_ANIMATION);
		},

		/**
		 * Function that triggers the animation to shift a new post index page in from the left
		 *
		 * @param {HTML String} postsHTML - the HTML that will comprise the new page
		 *
		 * @author kinsho
		 *
		 */
		enterFromLeft = function(postsHTML)
		{
			var container = document.getElementById(POSTS_CONTAINER),
				// Function to invoke when the entrance animation is done
				postAnimationFunction = function()
				{
					removeAnimationClasses();
					// Remove this function as an event listener from the container. Try not to pollute the container
					// with listeners that do not matter for the time being
					container.removeEventListener('animationend', postAnimationFunction, false);
				};

			container.innerHTML = postsHTML;
			container.classList.add(ENTER_LEFT_ANIMATION);

			container.addEventListener('animationend', postAnimationFunction, false);
		},

		/**
		 * Function that triggers the animation to shift a new post index page in from the right
		 *
		 * @param {HTML String} postsHTML - the HTML that will comprise the new page
		 *
		 * @author kinsho
		 *
		 */
		enterFromRight = function(postsHTML)
		{
			var container = document.getElementById(POSTS_CONTAINER),
			// Function to invoke when the entrance animation is done
				postAnimationFunction = function()
				{
					removeAnimationClasses();
					// Remove this function as an event listener from the container. Try not to pollute the container
					// with listeners that do not matter for the time being
					container.removeEventListener('animationend', postAnimationFunction, false);
				};

			container.innerHTML = postsHTML;
			container.classList.add(ENTER_RIGHT_ANIMATION);

			container.addEventListener('animationend', postAnimationFunction, false);
		},

		/**
		 * Function that triggers the animation to shift an old post index page out to the left
		 *
		 * @param {HTML String} postsHTML - the HTML that will comprise the new page to slide into view afterwards
		 *
		 * @author kinsho
		 *
		 */
		exitLeft = function(postsHTML)
		{
			var container = document.getElementById(POSTS_CONTAINER),
				// Function to invoke when the exit animation is finished
				postAnimationFunction = function()
				{
					enterFromRight(postsHTML);
					// Remove this function as an event listener from the container. Try not to pollute the container
					// with listeners that do not matter for the time being
					container.removeEventListener('animationend', postAnimationFunction, false);
				};

			container.classList.add(EXIT_LEFT_ANIMATION);

			container.addEventListener('animationend', postAnimationFunction, false);
		},

		/**
		 * Function that triggers the animation to shift an old post index page out to the right
		 *
		 * @param {HTML String} postsHTML - the HTML that will comprise the new page to slide into view afterwards
		 *
		 * @author kinsho
		 *
		 */
		exitRight = function(postsHTML)
		{
			var container = document.getElementById(POSTS_CONTAINER),
			// Function to invoke when the exit animation is finished
				postAnimationFunction = function()
				{
					enterFromLeft(postsHTML);
					// Remove this function as an event listener from the container. Try not to pollute the container
					// with listeners that do not matter for the time being
					container.removeEventListener('animationend', postAnimationFunction, false);
				};

			container.classList.add(EXIT_RIGHT_ANIMATION);

			container.addEventListener('animationend', postAnimationFunction, false);
		};


// ----------------- MODULE DEFINITION --------------------------

	var my =
	{
		/**
		 * Function responsible for maintaining the pagination of the post index
		 *
		 * @param {Event} event - the event object that led to the invocation of this function
		 *
		 * @author kinsho
		 */
		shiftPage: function(event)
		{
			var element = event.currentTarget,
				leftArrowElement = document.getElementById(PREV_ARROW),
				rightArrowElement = document.getElementById(NEXT_ARROW),
				direction = (element.id === PREV_ARROW) ? -1 : 1,
				pageNumber = window.parseInt(element.dataset.pageNumber, 10),
				postsToDisplay = findPostsToList(pageNumber);

			// Only perform any actual processing if a new page can be transitioned into the index here
			if (postsToDisplay)
			{
				leftArrowElement.dataset.pageNumber = pageNumber - 1;
				rightArrowElement.dataset.pageNumber = pageNumber + 1;

				if (direction > 0)
				{
					exitLeft(postsToDisplay);
				}
				else
				{
					exitRight(postsToDisplay);
				}
			}

			// Should the user reach a book-end page, some indication must be there that the user cannot progress
			// any further leftward or any further rightward
			if (pageNumber <= 0)
			{
				leftArrowElement.classList.add(FAUX_DISABLED_CLASS);
			}
			else
			{
				leftArrowElement.classList.remove(FAUX_DISABLED_CLASS);
			}

			if ((pageNumber + 1) * 5 > posts.length)
			{
				rightArrowElement.classList.add(FAUX_DISABLED_CLASS);
			}
			else
			{
				rightArrowElement.classList.remove(FAUX_DISABLED_CLASS);
			}
		}

	};

// ----------------- INITIALIZATION LOGIC --------------------------

	document.addEventListener("DOMContentLoaded", function()
	{
		var postsContainer = document.getElementById(POSTS_CONTAINER),
			postDates = postsContainer.querySelectorAll('.' + POST_DATE_SELECTOR),
			postTitles = postsContainer.querySelectorAll('.' + POST_TITLE_SELECTOR),
			j;

		// Extract all the posts from the HTML and store them in an array
		for (j = postDates.length - 1; j >= 0; j--)
		{
			posts.unshift(
			{
				date: postDates[j].innerHTML.trim(),
				title: postTitles[j].innerHTML.trim()
			});
		}

		// Record all the extracted posts in the module for later referencing
		my.posts = posts;

		// Empty out the post container first before rendering the carousel
		while(postsContainer.firstChild)
		{
			postsContainer.removeChild(postsContainer.firstChild);
		}

		// Now draw out the post index
		postsContainer.innerHTML = findPostsToList(0);

// ----------------- LISTENERS --------------------------

		document.getElementById(PREV_ARROW).addEventListener('click', my.shiftPage, false);
		document.getElementById(NEXT_ARROW).addEventListener('click', my.shiftPage, false);
	});


// ----------------- END --------------------------

	if (!(window.footballOwls))
	{
		window.footballOwls = {};
	}

	window.footballOwls.postCarousel = my;
}());