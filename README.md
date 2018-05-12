# Mobile Web Specialist Nanodegree - Project Stage 3
---
## Usage
1. Clone/download repository and navigate to folder in console/terminal window
### Back-End
2. change into back-end folder with ```cd back-end```
3. Install Sails.js globally with ```npm i sails -g``` 
4. Run API server in back-end folder with ```node server```
### Front-End 
5. Open new console/terminal window
6. change into front-end folder with ```cd front-end```
7. Install npm packages with ```npm install```
8. Install gulp globally with ```npm i gulp -g```
9. Install serve globally  with ```npm i serve -g```
10. Build production files with ```gulp prod```
11. Change into production directory with ```cd dist```
12. Run node server with ```serve```
13. Open  browserwindow/tab in incognito/private mode & paste URL from clipboard
14. Open Dev Tools, run performance audit
---
 ## Web Technologies used
* HTML
* Vanilla JS
* IndexedDB wrapper by [Jake Archibald](https://github.com/jakearchibald/idb)
* Modern Browser APIs:
  * Service Worker
  * IndexedDB
  * Web Worker
  * onLine
  * IntersectionObserver
---
## User Interface Features
### Main Page Featues
* See chosen restaurants on Google Maps
* Filter restaurants by cuisine or neighborhood
* Scroll through cards of restaurants
* Favorite restaurant by click on the hearth
* Go to restaurant details 

### Detail Page Features
* Check restaurant location
* Check restaurant address
* Check restaurant opening hours
* Check restaurant reviews
* Add your own review

## Responsivness & Accessibility Features
* Application is fully mobile responsible
* Main page scales cards according to viewport size
* Detail page uses major break point to expand Google Maps
* Traps TAB focus when the ADD REVIEW modal is open
* Allows navigating the ADD REVIEW modal by keyboard only, including close on pressing ESC.

## Offline Features
* Register service worker
* Cache html, css, js & images
* Centrally manage application state via IndexedDB & API handlers in JS
* Save JSON returned from API in IndexedDB
* Form can be submited offline, browser will store form data in localstorage until online again and fetch POST request is successful

## Performance Measures Taken
* Lazy loading of Google Maps on click/tab or applying cuisine or neighborhood filter
* Serving viewport appropriate Google Maps placeholder image
* Lazy loading images with an intersection observer on scrolling
* Optimizing request chains
* Control API fetches in dbhelper JS library by:
  * Checking when API data got last refreshed
  * Only reach out to the server when data is older than 5 minutes
  * Only update IndexedDB when new data is different from stored one via webworker to unload pressure from main thread
  * Fetch reviews restaurant specific not for all restaurants
