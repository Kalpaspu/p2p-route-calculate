# RouteLine

A simple web app for displaying a route between two points and tracking the user’s current device location.

## Libraries and services

- **Leaflet.js 1.9.4** — interactive map UI, markers, map controls, and route layers.
- **OpenStreetMap** — map tile data. Tiles are loaded from `tile.openstreetmap.de`.
- **OSRM** — route calculation through the public routing API.
- **Browser Geolocation API** — reads the device’s latitude, longitude, and GPS accuracy.
- **HTML, CSS, and vanilla JavaScript** — no framework or build process is required.

## Files

```text
index.html   Page structure and external library links
styles.css   Layout and visual styling
app.js       Map, routing, marker, and geolocation logic
README.md    Project documentation
```

## How to run

The project is a static website. Open `index.html` in a browser, or serve the folder with a local web server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

Geolocation works most reliably on `localhost` or HTTPS. The browser will ask for location permission when the page loads.

## How the system works

1. Leaflet creates the map and loads OpenStreetMap tiles.
2. The Browser Geolocation API requests the user’s current position.
3. The current position becomes the **Starting point** and is shown as a green marker.
4. The map initially has no destination and does not calculate a route.
5. Clicking the map updates the **Destination** field and places a red `B` marker.
6. Clicking **Update route** sends both coordinates to OSRM.
7. OSRM returns route geometry, distance, and estimated travel time.
8. The route geometry is drawn on the Leaflet map as a green line.
9. A geolocation watcher continues updating the user marker as the device moves.

## Route request

The app uses the OSRM driving endpoint:

```text
https://router.project-osrm.org/route/v1/driving/{startLng},{startLat};{endLng},{endLat}
```

The request asks for GeoJSON route geometry. Coordinates are sent as longitude first, latitude second, as required by OSRM.

## User interactions

- **Use my current location** — requests a fresh high-accuracy device position.
- **Click the map** — changes the destination and moves the destination marker.
- **Update route** — calculates and displays the route to the selected destination.
- **Fit route** — zooms the map to the full route.
- **Locate me** — centers the map on the latest device position.

## Important notes

- The public OSRM service is suitable for demos and small projects. A production application should use a managed routing provider or host its own OSRM instance.
- OpenStreetMap tile servers have usage policies and rate limits. A production deployment should follow the tile provider’s policy and consider a dedicated tile provider.
- Location accuracy depends on the device, browser permissions, and whether GPS is available.
- The app does not store or send location history; the current position is used in the browser and for route requests.
