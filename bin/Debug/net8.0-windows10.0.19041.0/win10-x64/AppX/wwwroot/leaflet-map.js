let map;
let marker;        // Hedef marker
let robotMarker;   // Robotun konumunu gösteren marker

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

// ✅ Robotun harita üzerindeki konumunu güncelle
function updateRobotPosition(lat, lng) {
    if (!map) return;

    if (!robotMarker) {
        robotMarker = L.circleMarker([lat, lng], {
            radius: 8,
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.8
        }).addTo(map);
    } else {
        robotMarker.setLatLng([lat, lng]);
    }
}

// ✅ Elle girilen hedef koordinatı haritada göster
function setManualMarker(lat, lng) {
    if (!map) return;

    if (marker) {
        map.removeLayer(marker);
    }

    marker = L.marker([lat, lng]).addTo(map).bindPopup("Target").openPopup();
}

// ✅ Hedefi temizle (marker'ı kaldır)
function clearTargetMarker() {
    if (marker) {
        map.removeLayer(marker);
        marker = null;
    }
}