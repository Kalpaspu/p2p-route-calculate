const map = L.map('map', { zoomControl: false }).setView([-33.862, 151.212], 14);
L.control.zoom({ position: 'bottomright' }).addTo(map);
// The main tile.openstreetmap.org endpoint can be rate-limited or blocked in
// local/demo environments. This OpenStreetMap-operated mirror is compatible
// with the same Leaflet tile layer and attribution requirements.
L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19, subdomains: ['a', 'b', 'c'] }).addTo(map);

let routeLayer, startMarker, endMarker, accuracyCircle, userMarker, watchId, hasCenteredOnUser = false;
const startInput = document.querySelector('#startInput'), endInput = document.querySelector('#endInput');
const setStatus = (message, active = false) => { const status = document.querySelector('#statusText'); const pulse = document.querySelector('.pulse'); if (status) status.textContent = message; if (pulse) pulse.style.background = active ? '#65b7e8' : '#a7df5e'; };
const parsePoint = value => { const parts = value.split(',').map(Number); if (parts.length !== 2 || parts.some(Number.isNaN) || Math.abs(parts[0]) > 90 || Math.abs(parts[1]) > 180) throw Error('Use latitude, longitude'); return [parts[0], parts[1]]; };
const markerIcon = (letter, color) => L.divIcon({ className:'custom-pin', html:`<div style="background:${color};color:#fff;border:3px solid white;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:11px;box-shadow:0 2px 8px #24382a55">${letter}</div>`, iconSize:[28,28], iconAnchor:[14,14] });

async function drawRoute() {
  try {
    const start = parsePoint(startInput.value), end = parsePoint(endInput.value);
    setStatus('Calculating route…', true);
    if (startMarker) map.removeLayer(startMarker); if (endMarker) map.removeLayer(endMarker);
    startMarker = L.marker(start, {icon: markerIcon('A','#719653')}).addTo(map).bindPopup('Starting point');
    endMarker = L.marker(end, {icon: markerIcon('B','#bd765d')}).addTo(map).bindPopup('Destination');
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
    const data = await response.json(); if (!data.routes?.length) throw Error('No route found');
    if (routeLayer) map.removeLayer(routeLayer);
    const route = data.routes[0]; routeLayer = L.geoJSON(route.geometry, {style:{color:'#4c6b50',weight:6,opacity:.88,lineCap:'round',lineJoin:'round'}}).addTo(map);
    const distance = document.querySelector('#distance'); const duration = document.querySelector('#duration');
    if (distance) distance.textContent = `${(route.distance / 1000).toFixed(1)} km`;
    const mins = Math.round(route.duration / 60); if (duration) duration.textContent = mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins} min`;
    map.fitBounds(routeLayer.getBounds(), {padding:[55,55]}); setStatus('Route ready');
  } catch (error) { setStatus(error.message || 'Could not calculate route'); }
}
function locate() {
  if (!navigator.geolocation) return setStatus('Geolocation is not supported');
  setStatus('Finding your location…', true);
  const options = { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 };
  navigator.geolocation.getCurrentPosition(position => { updateLocation(position); if (watchId === undefined) watchId = navigator.geolocation.watchPosition(updateLocation, () => setStatus('Location access unavailable'), options); }, () => setStatus('Location permission was denied'), options);
}
function updateLocation({coords}) { const point = [coords.latitude, coords.longitude]; startInput.value = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`; if (!userMarker) userMarker = L.circleMarker(point, {radius:8, color:'#fff', weight:3, fillColor:'#76bf50', fillOpacity:1}).addTo(map).bindPopup('Your current location'); else userMarker.setLatLng(point); if (accuracyCircle) accuracyCircle.setLatLng(point).setRadius(coords.accuracy); else accuracyCircle = L.circle(point, {radius:coords.accuracy, color:'#8aca62', weight:1, fillOpacity:.08}).addTo(map); if (!hasCenteredOnUser) { map.setView(point, 15); hasCenteredOnUser = true; } setStatus('Live location active', true); }
document.querySelector('#routeButton').addEventListener('click', drawRoute); document.querySelector('#locateButton').addEventListener('click', locate); document.querySelector('#mapLocateButton').addEventListener('click', locate);
document.querySelector('#fitButton').addEventListener('click', () => routeLayer ? map.fitBounds(routeLayer.getBounds(), {padding:[55,55]}) : map.setView([-33.862,151.212],14));
map.on('click', e => { const value = `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`; endInput.value = value; if (endMarker) map.removeLayer(endMarker); endMarker = L.marker([e.latlng.lat, e.latlng.lng], {icon: markerIcon('B','#bd765d')}).addTo(map).bindPopup('Destination').openPopup(); setStatus('Destination updated — click Update route'); });
locate();
