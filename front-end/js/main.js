let restaurants,
	neighborhoods,
	cuisines;
let map;
let mapLoaded = false;
let markers = [];
let observer;


// Register service worker and fetch neighborhoods & cuisines
document.addEventListener('DOMContentLoaded', (event) => {

	let api = {
		name: 'restaurants',
		object_type: 'restaurants'
	};

	// Attach EventHandlers
	// Initialize Google Map on click or change filter
	document.getElementById('map').addEventListener('click', initMap);
	document.getElementById('cuisines-select').addEventListener('change', (e) => {
		if(!mapLoaded) initMap();
	});
	document.getElementById('neighborhoods-select').addEventListener('change', (e) => {
		if(!mapLoaded) initMap();
	});

	// Start loading data
	LocalState.checkforIDBData(api, (error, data) => {
		console.log('Initial Load finished!');
		fetchNeighborhoods();
		fetchCuisines();
		registerServiceWorker();
		updateRestaurants();
	});

});

// Register service worker
registerServiceWorker = () => {
	if(!navigator.serviceWorker) return;
	navigator.serviceWorker.register('./service-worker.js').then( () => {
		console.log('Service Worker: Registered!');
	}).catch( (err) => {
		console.log(`Service Worker: Registration failed: ${err}`);
	});
};

// Fetch neighborhoods and set their HTML
fetchNeighborhoods = () => {
	LocalState.getNeighborhoods((error, neighborhoods) => {
		if (error) { // Got an error
			console.error(error);
		} else {
			self.neighborhoods = neighborhoods;
			fillNeighborhoodsHTML();
		}
	});
};

// Set neighborhood HTML
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
	const select = document.getElementById('neighborhoods-select');
	neighborhoods.forEach(neighborhood => {
		const option = document.createElement('option');
		option.innerHTML = neighborhood;
		option.value = neighborhood;
		select.append(option);
	});
};

// Fetch suieines and set their HTML
fetchCuisines = () => {
	LocalState.getCuisines((error, cuisines) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.cuisines = cuisines;
			fillCuisinesHTML();
		}
	});
};

// Set cuisine HTML
fillCuisinesHTML = (cuisines = self.cuisines) => {
	const select = document.getElementById('cuisines-select');

	cuisines.forEach(cuisine => {
		const option = document.createElement('option');
		option.innerHTML = cuisine;
		option.value = cuisine;
		select.append(option);
	});
};

// Initialize Google Maps, called from HTML, update restaurants
initMap = () => {
	let loc = {
		lat: 40.722216,
		lng: -73.987501
	};
	self.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: loc,
		scrollwheel: false
	});
	// document.getElementById('map-placeholder').remove();
	updateRestaurants();
	mapLoaded = true;
};

// Update page and map for current restaurants
updateRestaurants = () => {
	const cSelect = document.getElementById('cuisines-select');
	const nSelect = document.getElementById('neighborhoods-select');

	const cIndex = cSelect.selectedIndex;
	const nIndex = nSelect.selectedIndex;

	const cuisine = cSelect[cIndex].value;
	const neighborhood = nSelect[nIndex].value;

	LocalState.getRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			resetRestaurants(restaurants);
			fillRestaurantsHTML();
		}
	});
};

// Image lazy loading

// Attach observer for image lazy loading
lazyLoadingObserver = () => {
	const restaurantImages = document.querySelectorAll('.restaurant-img');
	const observerConfig = {
		rootMargin: '50px 0px',
		threshold: 0.01
	};
	observer = new IntersectionObserver(onIntersection, observerConfig);
	restaurantImages.forEach( image => observer.observe(image));
};

// Lazy load images once rest of the page has fully loaded
function onIntersection(entries) {

	entries.forEach(entry => {
	  	if (entry.intersectionRatio > 0) {

			observer.unobserve(entry.target);

			if(entry.target.getAttribute('data-src')) {
				entry.target.setAttribute('src', entry.target.getAttribute('data-src'));
			}
		}
	});
  }


// Clear current restaurants, filter and map marker
resetRestaurants = (restaurants) => {
	// Remove all restaurants
	self.restaurants = [];
	const ul = document.getElementById('restaurants-list');
	ul.innerHTML = '';

	// Remove all map markers
	if(mapLoaded) self.markers.forEach(m => m.setMap(null));
	self.markers = [];
	self.restaurants = restaurants;
};

// Create all restaurant HTML and marker and add it to the page
fillRestaurantsHTML = (restaurants = self.restaurants) => {
	const ul = document.getElementById('restaurants-list');
	restaurants.forEach(restaurant => {
		ul.append(createRestaurantHTML(restaurant));
	});
	if(mapLoaded) addMarkersToMap();
	lazyLoadingObserver();
};

// Create restaurant HTML
// Placeholder image for image lazy loading

createRestaurantHTML = (restaurant) => {
	const li = document.createElement('li');

	const image = document.createElement('img');
	image.className = 'restaurant-img';
	image.setAttribute('src', '');

	// Check if image exists
	const imageUrl = LocalState.getImageUrlForRestaurant(restaurant);
	const regex = /undefined/;

	if(!regex.test(imageUrl)) {
		image.setAttribute('data-src', imageUrl);
	} else {
		image.setAttribute('data-src', '/img/icons/icon-placeholder.png');
		console.log('Image undefined!');
	}
	
	image.setAttribute('alt', `Restaurant ${restaurant.name}`);
	li.append(image);

	const name = document.createElement('h3');
	name.innerHTML = restaurant.name;
	li.append(name);

	const neighborhood = document.createElement('p');
	neighborhood.innerHTML = restaurant.neighborhood;
	li.append(neighborhood);

	const address = document.createElement('p');
	address.innerHTML = restaurant.address;
	li.append(address);

	const more = document.createElement('a');
	more.innerHTML = 'View Details';
	more.href = LocalState.getUrlForRestaurant(restaurant);
	li.append(more);

	// Toggle favorize icon
	const favorize = document.createElement('img');
	favorize.setAttribute('alt', 'Heart');
	favorize.classList.add('favorize');
	favorize.id = restaurant.id;

	if(restaurant.is_favorite === true || restaurant.is_favorite === 'true'){
		favorize.setAttribute('src', '/img/icons/favorized.svg'); // TODO: Fix bug on load with wrong class
		favorize.classList.add('favorized');
	} else {
		favorize.setAttribute('src', '/img/icons/favorite.svg');
	}

	favorize.onclick = function toggleFavorite() {
		
		if(this.classList.contains('favorized')) {
			this.src = '/img/icons/favorite.svg';
			this.classList.remove('favorized');
			LocalState.toggleFavorite(false, this.id);
		} else {
			this.src = '/img/icons/favorized.svg';
			this.classList.add('favorized');
			LocalState.toggleFavorite(true, this.id);
		}
	};

	li.append(favorize);
	
	return li;
};

// Add markers for current restaurants to the map
addMarkersToMap = (restaurants = self.restaurants) => {
	restaurants.forEach(restaurant => {
		// Add marker to the map
		const marker = LocalState.getMapMarkerForRestaurant(restaurant, self.map);
		google.maps.event.addListener(marker, 'click', () => {
			window.location.href = marker.url;
		});
		self.markers.push(marker);
	});

};
