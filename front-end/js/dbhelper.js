// API Handling
class ApiService {

	static fetchApiData(api, callback){

		const port = 1337;
		let api_url;
		let fetch_options;

		switch(api.name) {
			case 'restaurants':
				api_url = `http://localhost:${port}/restaurants`;
				fetch_options = {method: 'GET'};
				break;
			case 'restaurantById':
				api_url = `http://localhost:${port}/restaurants/restaurant_id=${api.id}`;
				fetch_options = {method: 'GET'};
			case 'reviews':
				api_url = `http://localhost:${port}/reviews`;
				fetch_options = {method: 'GET'};
				break;
			case 'reviewById':
				api_url = `http://localhost:${port}/reviews/?restaurant_id=${api.id}`;
				fetch_options = {method: 'GET'};
				break;
			case 'addReview':
				api_url = `http://localhost:${port}/reviews`;
				
				let review = api.data; 
				// {
				// 	"restaurant_id": parseInt(param[3]),
				// 	"name": param[0],
				// 	"rating": parseInt(param[1]),
				// 	"comments": param[2]
				// };

				fetch_options = {
					method: 'POST',
					body: JSON.stringify(review),
					headers: new Headers({
						'Content-Type': 'application/json'
					}) 
				};
				break;
			case 'favorize':
				api_url = `http://localhost:${port}/restaurants/${api.id}/?is_favorite=${api.data}`;
				fetch_options = {method: 'PUT'};
				break;
			default:
				break;
		}

		fetch(api_url,fetch_options).then( (response) => {
			console.log(`Server: ${api.name} Called`);
			
			const contentType = response.headers.get('content-type');
			if(contentType && contentType.indexOf('application/json') !== -1 ) {
				return response.json();
			} else { 
				return 'API call successfull';
			}
		}).then( (data) => {
			callback(null, data);
		}).catch( error => callback(error, null));

	};

}

// State Management
class LocalState {

	// === UTILITY FUNCTIONS ===
	// Creates or returns IndexedDB stores
	static setupIDBStores(store) {
		switch(store) {
			case 'restaurants':
				let restaurantDbPromise = idb.open('restaurants', 1, (upgradeDB) => {
					let restaurantStore = upgradeDB.createObjectStore('restaurants', {keyPath: 'id'}); // Value: Key
				});
				return restaurantDbPromise;
			case 'reviews':
				let reviewDbPromise = idb.open('reviews', 1, (upgradeDB) => {
					let reviewStore = upgradeDB.createObjectStore('reviews', {keyPath: 'id'});
					reviewStore.createIndex('by-restaurantId', 'restaurant_id');
				});
				return reviewDbPromise;
		}
	}

	// Return data from the IDB Store
	static retrieveDataFromIDB(dbPromise, storeKey, callback) {

		dbPromise.then( (db) => {
			let tx = db.transaction(storeKey);
			let store = tx.objectStore(storeKey);
			return store.getAll();
		}).then(data => callback(null, data));
	}

	// Check for Data in IDB, serve, fetch and update
	static checkforIDBData(api, data, callback) {

		// Data in IDB: Send to front-end, fetch from API, compare & update
		if(data.length > 0) {
			console.log(`IDB: ${api.name} retrieved: ${data}`);

			callback(null, data);

			APIService.fetchApiData(api, (error, data) => {
				let worker = new Worker('js/worker.js');
				worker.postMessage(data);
				worker.onmessage = (e) => console.log(e.data);
			});
		
		// Data not in IDB: Fetch from API, send to front-end, store in IDB
		} else {
			console.log(`IDB: No ${api.name} found`);

			APIService.fetchApiData(api, (error, data) => {

				callback(null, data);

				LocalState.setupIDBStores(api.name).then( db => {
					let tx = db.transaction(api.name, 'readwrite');
					let store = tx.objectStore(api.name);

					data.forEach( object => {
						store.put(object);
					});

					return tx.complete;
				}).then( () => console.log(`IDB: ${data} stored`));
			});
		}
	}

	// === Getter FUNCTIONS ===

	// TODO: Rewrite Getter functions
	static getRestaurantById(id, callback) {

	}

	static getRestaurantByCuisine(cuisine, callback) {

	}

	static  getRestaurantByNeighborhood(neighborhood, callback) {

	}

	static getRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {

	}

	static gethNeighborhoods(callback) {

	}

	static getCuisines(callback) {

	}

	static getReviewsByRestaurant(restaurantId, callback) {
	}

	static getUrlForRestaurant(restaurant) {

	}

	static getImageUrlForRestaurant(restaurant) {

	}

	static getMapMarkerForRestaurant(restaurant, map) {

	}

	static toggleFavorite(mode, id) {
	}

	static sendFormWhenOnline(){
		
	}

}

// Database Helper Functions
class DBHelper {

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
	static fetchRestaurantByCuisineAndNeighborhood(
		cuisine,
		neighborhood,
		callback
	) {

		// Fetch all restaurants
		DBHelper.fetchData('restaurantByCuisineAndNeighborhood',(error, restaurants) => {
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
		DBHelper.fetchData('neighborhoods',(error, restaurants) => {
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

	// Fetch all cuisines with proper error handling
	static fetchCuisines(callback) {

		// Fetch all restaurants
		DBHelper.fetchData('cuisines',(error, restaurants) => {
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

	static getReviewsByRestaurant(restaurantId, callback) {
		DBHelper.getAPIData('reviewById', (reviews) => {
				console.log(reviews);
				// console.log('Unfiltred: ', reviews);
				// const filteredReviews = reviews.filter( review => review.restaurant_id === restaurantId );
				// console.log('Filtered: ', filteredReviews);
				callback(null, reviews);
		}, restaurantId);

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
		let restaurantDbPromise = idb.open('restaurants', 1, (upgradeDB) => {
			let restaurantStore = upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
		});

		DBHelper.getAPIData('favorize', () => {
			console.log(`Server: Restaurant ID ${id} updated!`)}, id, mode);

		restaurantDbPromise.then( db => {
			let tx = db.transaction('restaurants');
			let restaurantStore = tx.objectStore('restaurants');
			return restaurantStore.get(id);

		}).then(restaurant => {

			mode ? restaurant.is_favorite = true : restaurant.is_favorite = false;

			restaurantDbPromise.then( db => {
				let tx = db.transaction('restaurants', 'readwrite');
				let restaurantStore = tx.objectStore('restaurants');
				restaurantStore.put(restaurant);
				return restaurantStore.get(id);
			}).then( (restaurant) => console.log(`Restaurant ${restaurant.name} Favorized!`));
			
		});
	};

	static addReview(review, callback) {

		callback();

		if(!navigator.onLine){
			// store locally
			localStorage.setItem('review', review);
			console.log('Local Storage: Review stored');

			// send request when online again document.body event "online" & "offline"

			// document.body.ononline or document.body.onoffline
			// delete from local storage if request succesful
		} else {
			DBHelper.getAPIData('addReview', (data) => console.log(data), null, review);
			console.log('data sent to api');
		}


	}
}

// For sending Form offline
window.addEventListener('offline', (event) => {
	console.log('Browser: Offline now!');
});

window.addEventListener('online', (event) => {

	let review = localStorage.getItem('review');

	if(review !== null) {

		review = review.split(',');
		console.log(review);

		DBHelper.getAPIData('addReview', (data) => console.log(data), null, review);
		console.log('data sent to api');

		localStorage.removeItem('review');
		console.log('Local Storage: Review removed')
	}
	console.log('Browser: Online again!');
});
