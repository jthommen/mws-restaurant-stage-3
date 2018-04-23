// Lazy load images
window.addEventListener('load', function() {
	let images = document.getElementsByTagName('img');

	for(var i=0; i < images.length; i++) {
		if (images[i].getAttribute('data-src')) {
			images[i].setAttribute('src', images[i].getAttribute('data-src'));
		}
	}
}, false);

/**
 * 
	* Common database helper functions.
	*/
class DBHelper {
	/**
			* Database URL.
			* Change this to restaurants.json file location on your server.
			*/
	static get DATABASE_URL() {
		const port = 1337; // Change this to your server port
		return `http://localhost:${port}/restaurants`;
	}

	/**
			* Fetch all restaurants.
			*/
	static fetchRestaurants(callback) {

		// Crating idb object store
		var dbPromise = idb.open('restaurants', 2, (upgradeDB) => {
			var restaurantStore = upgradeDB.createObjectStore('restaurants', {keyPath: 'id'}); // Value, Key!
		});

		// Get restaurants from the store
		dbPromise.then( (db) => {
			var tx = db.transaction('restaurants');
			var restaurantStore = tx.objectStore('restaurants');

			return restaurantStore.getAll();
		}).then( (restaurants) => {
			let callbackSent;

			if(restaurants.length > 0) {
				console.log('Restaurants: ', restaurants);
				callbackSent = true;
				callback(null, restaurants);
			}

			let xhr = new XMLHttpRequest();
			xhr.open('GET', DBHelper.DATABASE_URL);
			xhr.onload = () => {
				if (xhr.status === 200) {

					// Got a success response from server!
					const restaurants = JSON.parse(xhr.responseText);
					if(!callbackSent)
					{
						callback(null, restaurants);
					}

					// Put values into idb
					dbPromise.then( db => {
						var tx = db.transaction('restaurants', 'readwrite');
						var restaurantStore = tx.objectStore('restaurants');
				
						restaurants.forEach( restaurant => {
							restaurantStore.put(restaurant);
							console.log(`Restaurant added: ${restaurant.name}`);
						});

						// Ensure DB is not overloaded with entries
						restaurantStore.openCursor(null, 'prev').then(cursor => {
							return cursor.advance(15);
						}).then( function deleteRest(cursor) {
							if(!cursor) return;
							cursor.delete();
							return cursor.continue().then(deleteRest);	
						});
					});

				} else {

					// Oops!. Got an error from server.
					const error = `Request failed. Returned status of ${xhr.status}`;
					callback(error, null);
				}
			};
			xhr.send();
		});
	}

	/**
			* Fetch a restaurant by its ID.
	*/
	static fetchRestaurantById(id, callback) {
		// fetch all restaurants with proper error handling.
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				const restaurant = restaurants.find(r => r.id == id);
				if (restaurant) {
					// Got the restaurant
					callback(null, restaurant);
				} else {
					// Restaurant does not exist in the database
					callback('Restaurant does not exist', null);
				}
			}
		});
	}

	/**
			* Fetch restaurants by a cuisine type with proper error handling.
			*/
	static fetchRestaurantByCuisine(cuisine, callback) {
		// Fetch all restaurants  with proper error handling
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Filter restaurants to have only given cuisine type
				const results = restaurants.filter(r => r.cuisine_type == cuisine);
				callback(null, results);
			}
		});
	}

	/**
			* Fetch restaurants by a neighborhood with proper error handling.
			*/
	static fetchRestaurantByNeighborhood(neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Filter restaurants to have only given neighborhood
				const results = restaurants.filter(r => r.neighborhood == neighborhood);
				callback(null, results);
			}
		});
	}

	/**
	* Fetch restaurants by a cuisine and a neighborhood with proper error handling.
	*/
	static fetchRestaurantByCuisineAndNeighborhood(
		cuisine,
		neighborhood,
		callback
	) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				let results = restaurants;
				if (cuisine != 'all') {
					// filter by cuisine
					results = results.filter(r => r.cuisine_type == cuisine);
				}
				if (neighborhood != 'all') {
					// filter by neighborhood
					results = results.filter(r => r.neighborhood == neighborhood);
				}
				callback(null, results);
			}
		});
	}

	/**
	* Fetch all neighborhoods with proper error handling.
	*/
	static fetchNeighborhoods(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all neighborhoods from all restaurants
				const neighborhoods = restaurants.map(
					(v, i) => restaurants[i].neighborhood
				);
				// Remove duplicates from neighborhoods
				const uniqueNeighborhoods = neighborhoods.filter(
					(v, i) => neighborhoods.indexOf(v) == i
				);
				callback(null, uniqueNeighborhoods);
			}
		});
	}

	/**
			* Fetch all cuisines with proper error handling.
	*/

	static fetchCuisines(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all cuisines from all restaurants
				const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
				// Remove duplicates from cuisines
				const uniqueCuisines = cuisines.filter(
					(v, i) => cuisines.indexOf(v) == i
				);
				callback(null, uniqueCuisines);
			}
		});
	}

	/**
			* Restaurant page URL.
			*/
	static urlForRestaurant(restaurant) {
		return `./restaurant.html?id=${restaurant.id}`;
	}

	/**
			* Restaurant image URL.
			*/
	static imageUrlForRestaurant(restaurant) {
		return `/img/${restaurant.photograph}.jpg`;
	}

	/**
			* Map marker for a restaurant.
			*/
	static mapMarkerForRestaurant(restaurant, map) {
		const marker = new google.maps.Marker({
			position: restaurant.latlng,
			title: restaurant.name,
			url: DBHelper.urlForRestaurant(restaurant),
			map: map,
			animation: google.maps.Animation.DROP
		});
		return marker;
	}
}
