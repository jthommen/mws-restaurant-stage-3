
// Database Helper Functions
class DBHelper {

	// Service to fetch api data from server
	// Configure apis call here: API, callback, restaurant/review ID and optional parameters
	static getAPIData(api, callback, id = null, param = null) {

		const port = 1337;
		let api_url;
		let fetch_options;

		switch (api) {
			case 'restaurants':
				api_url = `http://localhost:${port}/restaurants`;
				fetch_options = { method: 'GET' };
				break;
			case 'reviews':
				api_url = `http://localhost:${port}/reviews`;
				fetch_options = { method: 'GET' };
				break;
			case 'favorize':
				api_url = `http://localhost:${port}/restaurants/${id}/?is_favorite=${param}`;
				fetch_options = { method: 'PUT' };
				break;
			default:
				break;
		}

		fetch(api_url, fetch_options).then(response => {
			console.log(`Server: ${api} Called`);

			const contentType = response.headers.get('content-type');
			if (contentType && contentType.indexOf('application/json') !== -1) {
				return response.json();
			} else {
				return 'API call successfull';
			}
		}).then(data => {
			callback(data);
		}).catch(error => console.error(error));
	}

	// Get's data from the server and puts it into the DB
	static fetchData(mode, callback) {
		console.log('FetchMode: ', mode);

		// Check if idb store exists, create otherwise
		let restaurantDbPromise = idb.open('restaurants', 1, upgradeDB => {
			let restaurantStore = upgradeDB.createObjectStore('restaurants', { keyPath: 'id' }); // Value: Key
		});

		let reviewDbPromise = idb.open('reviews', 1, upgradeDB => {
			let reviewStore = upgradeDB.createObjectStore('reviews', { keyPath: 'id' });
			reviewStore.createIndex('by-restaurantId', 'restaurant_id');
		});

		// Get restaurants from the store
		if (mode !== 'reviews') {
			restaurantDbPromise.then(db => {
				let tx = db.transaction('restaurants');
				let restaurantStore = tx.objectStore('restaurants');
				return restaurantStore.getAll();
			}).then(restaurants => {

				// Restaurants found
				if (restaurants.length > 0) {
					console.log('IDB: Restaurants retrieved ', restaurants);

					callback(null, restaurants);

					if (mode === 'restaurantById' || mode === 'restaurantByCuisineAndNeighborhood') {
						DBHelper.getAPIData('restaurants', restaurants => {

							let worker = new Worker('js/worker.js');
							worker.postMessage(restaurants);
							worker.onmessage = e => console.log(e.data);
						});
					}
				} else {
					console.log('IDB: No restaurants found');

					DBHelper.getAPIData('restaurants', restaurants => {

						callback(null, restaurants);

						// Put data into IDB
						restaurantDbPromise.then(db => {
							let tx = db.transaction('restaurants', 'readwrite');
							let restaurantStore = tx.objectStore('restaurants');

							restaurants.forEach(restaurant => {
								restaurantStore.put(restaurant);
							});

							return tx.complete;
						}).then(() => console.log('IDB: Objects stored'));
					});
				}
			});
		}

		if (mode === 'reviews') {

			// Get Reviews from the store
			reviewDbPromise.then(db => {
				let tx = db.transaction('reviews');
				let reviewStore = tx.objectStore('reviews');
				return reviewStore.getAll();
			}).then(reviews => {
				DBHelper.getAPIData('reviews', reviews => {

					callback(null, reviews);

					// Put Reviews in DB
					reviewDbPromise.then(db => {
						let tx = db.transaction('reviews', 'readwrite');
						let reviewStore = tx.objectStore('reviews');

						reviews.forEach(review => {
							reviewStore.put(review);
						});
					});
				});
			});
		}
	}

	// Fetch restaurant by ID
	static fetchRestaurantById(id, callback) {

		// fetch all restaurants with proper error handling.
		DBHelper.fetchData('restaurantById', (error, restaurants) => {
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

	// Fetch restaurant by cuisine type
	static fetchRestaurantByCuisine(cuisine, callback) {

		// Fetch all restaurants  with proper error handling
		DBHelper.fetchData('RestaurantByCuisines', (error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Filter restaurants to have only given cuisine type
				const results = restaurants.filter(r => r.cuisine_type == cuisine);
				callback(null, results);
			}
		});
	}

	// Fetch restaurant by neighhborhood with proper error handling
	static fetchRestaurantByNeighborhood(neighborhood, callback) {

		// Fetch all restaurants
		DBHelper.fetchData('restaurantByNeighborhood', (error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {

				// Filter restaurants to have only given neighborhood
				const results = restaurants.filter(r => r.neighborhood == neighborhood);
				callback(null, results);
			}
		});
	}

	// Fetch restaurants by a cuisine and a neighborhood with proper error handling
	static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {

		// Fetch all restaurants
		DBHelper.fetchData('restaurantByCuisineAndNeighborhood', (error, restaurants) => {
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

	// Fetch all neighborhoods with proper error handling
	static fetchNeighborhoods(callback) {

		// Fetch all restaurants
		DBHelper.fetchData('neighborhoods', (error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {

				// Get all neighborhoods from all restaurants
				const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);

				// Remove duplicates from neighborhoods
				const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
				callback(null, uniqueNeighborhoods);
			}
		});
	}

	// Fetch all cuisines with proper error handling
	static fetchCuisines(callback) {

		// Fetch all restaurants
		DBHelper.fetchData('cuisines', (error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {

				// Get all cuisines from all restaurants
				const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);

				// Remove duplicates from cuisines
				const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
				callback(null, uniqueCuisines);
			}
		});
	}

	static getReviewsByRestaurant(restaurantId, callback) {
		DBHelper.fetchData('reviews', (error, reviews) => {
			if (error) {
				callback(error, null);
			} else {
				const filteredReviews = reviews.filter(review => review.restaurant_id === restaurantId);
				callback(null, filteredReviews);
			}
		});
	}

	// Restaurant page URL
	static urlForRestaurant(restaurant) {
		return `./restaurant.html?id=${restaurant.id}`;
	}

	// Restaurant image URL
	static imageUrlForRestaurant(restaurant) {
		return `/img/${restaurant.photograph}.jpg`;
	}

	// Map marker for restaurant
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

	// Toggles favorite mode
	static toggleFavorite(mode, id) {

		id = parseInt(id);

		// Check if restaurant idb exist, create otherwise
		let restaurantDbPromise = idb.open('restaurants', 1, upgradeDB => {
			let restaurantStore = upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
		});

		DBHelper.getAPIData('favorize', () => {
			console.log(`Server: Restaurant ID ${id} updated!`);
		}, id, mode);

		restaurantDbPromise.then(db => {
			let tx = db.transaction('restaurants');
			let restaurantStore = tx.objectStore('restaurants');
			return restaurantStore.get(id);
		}).then(restaurant => {

			mode ? restaurant.is_favorite = true : restaurant.is_favorite = false;

			restaurantDbPromise.then(db => {
				let tx = db.transaction('restaurants', 'readwrite');
				let restaurantStore = tx.objectStore('restaurants');
				restaurantStore.put(restaurant);
				return restaurantStore.get(id);
			}).then(restaurant => console.log(`Restaurant ${restaurant.name} Favorized!`));
		});
	}
}