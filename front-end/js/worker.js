importScripts('idb.js');

onmessage = (e) => {

    console.log('Worker IDB: Checking for changes');

    let objects = e.data.objects;
    let api = e.data.api

    let dbPromise = idb.open(api, 1, (upgradeDB) => {
        let restaurantStore = upgradeDB.createObjectStore(api, {keyPath: 'id'}); // Value: Key
    });

    dbPromise.then( (db) => {
        let tx = db.transaction(api, 'readwrite');
        let store = tx.objectStore(api);
        
        // TODO: Use web worker to do this.                
        objects.forEach( object => {
            store.get(object.id).then( idbObject => {
                if(JSON.stringify(restaurant) !== JSON.stringify(idbObject)) {
                    store.put(object)
                        .then( (object) => console.log(`Worker IDB: ${api} updated`));
                }
            });
        });
    });
    
    // TODO: Trigger update if restaurant changed
    
    postMessage(`Worker IDB: ${api} checked`);
}
