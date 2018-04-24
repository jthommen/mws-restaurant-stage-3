document.addEventListener('DOMContentLoaded', (event) => {
    fetchData();
});

// Service to fetch api data from server
getAPIData = (callback) => {

    // Configure api data here: Port & URL's
    API_URL = (id) => {
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

    fetch(API_URL()).then( (response) => {
        console.log('Server: Restaurants fetched');
        return response.json();
    }).then( (restaurants) => {
        callback(restaurants);
    }).catch( error => console.error(error));

};


// Get's data from the server and puts it into the DB
fetchData = () => {
    
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

            renderRestaurants(restaurants, 'all');

            getAPIData( (restaurants) => {

                let worker = new Worker('js/worker.js');
                worker.postMessage(restaurants);
                worker.onmessage = (e) => console.log(e.data);

            });

        } else {
            console.log('IDB: No restaurants found');
            getAPIData((restaurants) => {
                
                renderRestaurants(restaurants, 'all');

                // Put data into IDB
                dbPromise.then( db => {
                    let tx = db.transaction('restaurants', 'readwrite');
                    let restaurantStore = tx.objectStore('restaurants');

                    restaurants.forEach( restaurant => {
                        restaurantStore.put(restaurant);
                    });

                    // TODO: Ensure DB is not overloaded with entries --> Delete old ones

                    return tx.complete;
                }).then( () => console.log('IDB: Objects stored'));
            });
        }

        
        
    });

};


// RENDER RESTAURANT DATA
renderRestaurants = (data, param) => {
    console.log('Render: Restaurants, ', data);

};


// INITIALIZE MAP
window.initMap = () => {
	let loc = {
		lat: 40.722216,
		lng: -73.987501
	};
	self.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: loc,
		scrollwheel: false
	});
	//updateRestaurants();
};