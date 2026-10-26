# RouteLine Code and Logic Guide

This document explains how the application is structured and how the main functions work together.

## Application structure

The application has three main files:

- `index.html` — page elements, input fields, buttons, and library links.
- `styles.css` — layout and visual styles.
- `app.js` — map initialization, routing, markers, and device tracking.

The application is frontend-only. It does not have a backend server or database.

## Startup process

When `app.js` loads, it performs these actions:

```js
const map = L.map('map', { zoomControl: false });
```

This creates the Leaflet map inside the HTML element with `id="map"`.

```js
L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {...}).addTo(map);
```

This loads OpenStreetMap map tiles.

```js
locate();
```

This requests the device’s current location when the page starts.

The destination starts as `0, 0`, so the application does not calculate a route until the user selects a destination and clicks **Update route**.

## Coordinate format

The input fields display coordinates in this format:

```text
latitude, longitude
```

Example:

```text
13.7563, 100.5018
```

The `parsePoint()` function validates this format and returns:

```js
[latitude, longitude]
```

OSRM requires the reverse order:

```text
longitude, latitude
```

Therefore, the route request uses `start[1], start[0]` and `end[1], end[0]`.

## Finding a route

The main route function is:

```js
async function drawRoute() { ... }
```

The function follows this sequence:

1. Read the start and destination input values.
2. Validate and convert both values with `parsePoint()`.
3. Remove old markers and the previous route.
4. Add marker `A` for the start point.
5. Add marker `B` for the destination.
6. Send both points to the OSRM API.
7. Read the returned JSON response.
8. Take the first route from `data.routes`.
9. Draw the returned GeoJSON geometry with `L.geoJSON()`.
10. Fit the map view around the complete route.

The API request has this structure:

```text
https://router.project-osrm.org/route/v1/driving/
startLongitude,startLatitude;
endLongitude,endLatitude
?overview=full&geometries=geojson
```

## Updating the destination

The map click handler listens for clicks:

```js
map.on('click', e => { ... });
```

When the map is clicked:

1. Leaflet provides `e.latlng.lat` and `e.latlng.lng`.
2. The coordinates are rounded to five decimal places.
3. The destination input is updated.
4. Any old destination marker is removed.
5. A new `B` marker is added.
6. The route is not calculated immediately.

The user must click **Update route** to call `drawRoute()`.

## Device location tracking

The `locate()` function uses the Browser Geolocation API:

```js
navigator.geolocation.getCurrentPosition(...)
```

The options request fresh, accurate coordinates:

```js
{
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 15000
}
```

After the first location is received, the application starts a watcher:

```js
navigator.geolocation.watchPosition(updateLocation, ...)
```

The watcher calls `updateLocation()` whenever the device position changes.

## Updating the current position

The `updateLocation()` function:

1. Reads the new latitude, longitude, and accuracy.
2. Updates the starting-point input field.
3. Creates or moves the green current-location marker.
4. Creates or updates the accuracy circle.
5. Centers the map on the user the first time only.

The route is not automatically recalculated every time the device moves. The user can click **Update route** when a new route is needed.

## Marker management

The application keeps references to map objects:

```js
let routeLayer;
let startMarker;
let endMarker;
let userMarker;
let accuracyCircle;
```

Keeping these references is important because old objects can be removed or updated instead of creating duplicates on every action.

## Error handling

The route function is wrapped in a `try/catch` block. It can handle:

- Invalid coordinate input
- Missing coordinates
- No route returned by OSRM
- Network or API errors

The geolocation code can handle:

- Browser geolocation not being supported
- Location permission being denied
- Location access becoming unavailable
- GPS timing out

## User interaction flow

```text
Page loads
    ↓
Request current location
    ↓
Set current location as start point
    ↓
User clicks map
    ↓
Set clicked point as destination
    ↓
User clicks Update route
    ↓
Validate coordinates
    ↓
Request route from OSRM
    ↓
Draw route on Leaflet map
```

## Important design decision

The application separates selecting a destination from calculating a route. This prevents a network request every time the user clicks the map and gives the user control over when the route is updated.
