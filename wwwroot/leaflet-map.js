let map;
let marker;

function initializeLeafletMap(dotNetHelper) {
    map = L.map('map').setView([39.92, 32.85], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    map.on('mousemove', function (e) {
        dotNetHelper.invokeMethodAsync('UpdateMousePosition', e.latlng.lat, e.latlng.lng);
    });

    map.on('click', function (e) {
        if (marker) {
            map.removeLayer(marker);
        }

        marker = L.marker(e.latlng).addTo(map).bindPopup("Target").openPopup();
        dotNetHelper.invokeMethodAsync('SetTargetPosition', e.latlng.lat, e.latlng.lng);
    });
}