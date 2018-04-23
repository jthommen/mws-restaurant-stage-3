fetchData();

function API_URL(id) {
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

// Get's data from the server and puts it into the DB
function fetchData() {
    
    // CHECK IF DATA IN IDB
    // Check if idb store exists, create otherwise
    var dbPromise = idb.open('restaurants', 1, (upgradeDB) => {
        var restaurantStore = upgradeDB.createObjectStore('restaurants', {keyPath: 'id'}); // Value: Key
    });

    // Get restaurants from the store
    dbPromise.then( (db) => {
        var tx = db.transaction('restaurants');
        var restaurantStore = tx.objectStore('restaurants');
        return restaurantStore.getAll();
    }).then( (restaurants) => {
        let idbFull = false;

        // Restaurants found
        if(restaurants.length > 0) {
            console.log('Restaurants: ', restaurants);
            idbFull = true;

            // TODO: Replace with callback to trigger update later
            return restaurants;
        } else {
            console.log('No restaurants found in IDB');
        }

        // Fetch restaurants from server
        fetch(API_URL()).then( (response) => {
            console.log(response);
            return response.json();
        })
        .then( (restaurants) => {
            console.log(restaurants);

            // TODO: Get Data to render
            if(!idbFull){
                // render page
            } else {
                // check if data is different than in IDB
                // if so, update page, otherwise discard and return
            }

            // Put data into IDB
            dbPromise.then( db => {
                var tx = db.transaction('restaurants', 'readwrite');
                var restaurantStore = tx.objectStore('restaurants');

                restaurants.forEach( restaurant => {
                    // TODO: Search if it already exists / if data is the same
                    restaurantStore.put(restaurant);
                });

                // TODO: Ensure DB is not overloaded with entries --> Delete old ones
            });
        }).catch( error => console.error(error))

    })

};


// RENDER RESTAURANT DATA
function renderRestaurants(data, param) {


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