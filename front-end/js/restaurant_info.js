let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.map = new google.maps.Map(document.getElementById('map'), {
				zoom: 16,
				center: restaurant.latlng,
				scrollwheel: false
			});
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
		}
	});
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) { // restaurant already fetched!
		callback(null, self.restaurant);
		return;
	}
	const id = getParameterByName('id');
	if (!id) { // no id found in URL
		error = 'No restaurant id in URL';
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			fillRestaurantHTML();
			callback(null, restaurant);
		});
	}
};

/**
 * Create restaurant HTML and add it to the webpage
 */

fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;
	const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img';
	image.setAttribute('alt', `Restaurant ${restaurant.name}`);

	// Check if image exists
	var regex = /undefined/;
	if(!regex.test(DBHelper.imageUrlForRestaurant(restaurant))) {
		image.src = DBHelper.imageUrlForRestaurant(restaurant);
		console.log('Image defined!');
	} else {
		image.src = '/img/icons/icon-placeholder.png';
		console.log('Image undefined!');
	}

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
	// fill reviews
	fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		const row = document.createElement('tr');

		const day = document.createElement('td');
		day.innerHTML = key;
		row.appendChild(day);

		const time = document.createElement('td');
		time.innerHTML = operatingHours[key];
		row.appendChild(time);

		hours.appendChild(row);
	}
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
	const container = document.getElementById('reviews-container');
	const title = document.createElement('h3');
	title.innerHTML = 'Reviews';
	container.appendChild(title);

	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ListContainer = document.getElementById('reviews-list');
	reviews.forEach(review => {
		ListContainer.appendChild(createReviewHTML(review));
	});
	container.appendChild(ListContainer);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
	const container = document.createElement('div');
	const header = document.createElement('div');
	const body = document.createElement('div');
	const name = document.createElement('div');
	container.setAttribute('class', 'review');
	header.setAttribute('class', 'review-header');
	body.setAttribute('class', 'review-body');
	name.innerHTML = review.name;
	name.setAttribute('class', 'reviewer-name');
	container.appendChild(header);
	container.appendChild(body);
	header.appendChild(name);

	const date = document.createElement('div');
	date.innerHTML = review.date;
	date.setAttribute('class', 'review-date');
	header.appendChild(date);

	const rating = document.createElement('div');
	rating.innerHTML = `Rating: ${review.rating}`;
	rating.setAttribute('class', 'review-rating');
	body.appendChild(rating);

	const comments = document.createElement('div');
	comments.innerHTML = review.comments;
	body.appendChild(comments);

	return container;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	li.innerHTML = restaurant.name;
	li.setAttribute('aria-current', 'page');
	breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
