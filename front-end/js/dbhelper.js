// Lazy load images on initil page load
window.addEventListener('load', function() {
	let images = document.getElementsByTagName('img');

	for(var i=0; i < images.length; i++) {
		if (images[i].getAttribute('data-src')) {
			images[i].setAttribute('src', images[i].getAttribute('data-src'));
		}
	}
}, false);

// Database Helper Functions
class DBHelper {
	// Service to fetch api data from server
	// Configure api data here: Port & URL's

	static API_URL(id) {
		const port = 1337;
		id = id || null;
		
		switch(id) {
			case null:
				return `http://localhost:${port}/restaurants`;
			case id:
				return `http://localhost:${port}/restaurants/${id}`;
			default:
				return;
		}
	}

	static getAPIData(callback) {

		fetch(DBHelper.API_URL()).then( (response) => {
			console.log('Server: Restaurants fetched');
			return response.json();
		}).then( (restaurants) => {
			callback(restaurants);
		}).catch( error => console.error(error));

	};

	// Get's data from the server and puts it into the DB
	static fetchRestaurants(mode='all', callback) {
		console.log('FetchMode: ', mode);

		// CHECK IF DATA IN IDB
		// Check if idb store exists, create otherwise
		let dbPromise = idb.open('restaurants', 1, (upgradeDB) => {
			let restaurantStore = upgradeDB.createObjectStore('restaurants', {keyPath: 'id'}); // Value: Key
			restaurantStore.createIndex('by-cuisine', 'cuisine_type');
			restaurantStore.createIndex('by-neighborhood', 'neighborhood');
		});
	
		// Get restaurants from the store
		dbPromise.then( (db) => {
			let tx = db.transaction('restaurants');
			let restaurantStore = tx.objectStore('restaurants');
			return restaurantStore.getAll();
		}).then( (restaurants) => {
	
			// Restaurants found
			if(restaurants.length > 0) {
				console.log('IDB: Restaurants retrieved ', restaurants);
	
				callback(null, restaurants);
				
				if(mode === 'all' || mode === 'restaurantByCuisineAndNeighborhood') {
					DBHelper.getAPIData( (restaurants) => {
	
						let worker = new Worker('js/worker.js');
						worker.postMessage(restaurants);
						worker.onmessage = (e) => console.log(e.data);
		
					});
				}
				
			} else {
				console.log('IDB: No restaurants found');


					DBHelper.getAPIData((restaurants) => {
					
					callback(null, restaurants);
	
					// Put data into IDB
					dbPromise.then( db => {
						let tx = db.transaction('restaurants', 'readwrite');
						let restaurantStore = tx.objectStore('restaurants');
	
						restaurants.forEach( restaurant => {
							restaurantStore.put(restaurant);
						});
	
						return tx.complete;
	
					}).then( () => console.log('IDB: Objects stored'));
				});
			} 
			
		});
	
	};


	/**
			* Fetch a restaurant by its ID.
	*/
	static fetchRestaurantById(id, callback) {
		// fetch all restaurants with proper error handling.
		DBHelper.fetchRestaurants('restaurantById', (error, restaurants) => {
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
		DBHelper.fetchRestaurants('RestaurantByCuisines', (error, restaurants) => {
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
		DBHelper.fetchRestaurants('restaurantByNeighborhood', (error, restaurants) => {
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
		DBHelper.fetchRestaurants('restaurantByCuisineAndNeighborhood',(error, restaurants) => {
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
		DBHelper.fetchRestaurants('neighborhoods',(error, restaurants) => {
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
		DBHelper.fetchRestaurants('cuisines',(error, restaurants) => {
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
