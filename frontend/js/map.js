let map;

// Initialize Google Map
function initMap() {

    // Center (Coimbatore example — change if needed)
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 11.0168, lng: 76.9558 },
        zoom: 12
    });

    loadStations();
}

// Load stations from backend
function loadStations() {
    const host = window.location.hostname || "127.0.0.1";
    fetch(`http://${host}:8080/api/stations`)
        .then(res => res.json())
        .then(data => {

            data.forEach(station => {

                // If your DB has lat/lng columns
                if (station.latitude && station.longitude) {

                    let marker = new google.maps.Marker({
                        position: {
                            lat: station.latitude,
                            lng: station.longitude
                        },
                        map: map,
                        title: station.name
                    });

                    const supported = (station.supportedVehicles || "Car,Bike").toLowerCase();
                    let vTag = "🚘 Car & 🛵 Bike Compatible";
                    if (supported === "bike") vTag = "🛵 EV Bike Only";
                    if (supported === "car") vTag = "🚘 EV Car Only";

                    let info = new google.maps.InfoWindow({
                        content: `
                            <div style="font-family: sans-serif; padding: 4px;">
                                <h3 style="margin: 0 0 4px 0; color: #0f5d82;">${station.name}</h3>
                                <p style="margin: 0 0 4px 0; font-size: 13px;">${station.location || "EV Station"}</p>
                                <p style="margin: 0; font-size: 12px; font-weight: bold; color: #059669;">${vTag}</p>
                            </div>
                        `
                    });

                    marker.addListener("click", () => {
                        info.open(map, marker);
                    });
                }
            });

        })
        .catch(err => console.error("Map load error:", err));
}