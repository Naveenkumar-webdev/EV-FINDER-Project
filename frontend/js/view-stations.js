// Auth Check: Redirect unauthenticated users to login page first
const loggedUser = localStorage.getItem("loggedUser");
if (!loggedUser) {
    localStorage.setItem("redirectAfterLogin", "view-stations.html");
    window.location.href = "login.html";
}

let stations = [];
let filteredStations = [];

// -------------------------------
// Load Stations
// -------------------------------

async function loadStations() {
    try {
        const response = await fetch(`https://ev-finder-backend-production.up.railway.app/api/stations`);

        if (!response.ok) {
            throw new Error("Unable to load stations");
        }

        stations = await response.json();
        filteredStations = stations;
        displayStations(filteredStations);
    } catch (error) {
        console.error(error);
        const container = document.getElementById("stationContainer");
        if (container) {
            container.innerHTML = `
                <h2 style="text-align:center;color:red;">
                    Failed to load stations
                </h2>
            `;
        }
    }
}

// -------------------------------
// Display Stations

function displayStations(data) {
    const container = document.getElementById("stationContainer");
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `
            <h2 style="text-align:center; color:#333; grid-column: 1 / -1;">
                No stations found matching filters.
            </h2>
        `;
        return;
    }

    container.innerHTML = "";

    data.forEach(station => {
        const stationName = station.name || station.stationName || "Unnamed Station";
        const stationLocation = station.location || "Unknown location";
        const availableSlots = station.availableSlots ?? 0;
        const chargerType = station.chargerType || "N/A";
        const imageUrl = station.imageUrl || "images/ev-car-image.jpeg";
        const supported = (station.supportedVehicles || "Car,Bike").toLowerCase();
        
        let badgesHtml = "";
        if (supported.includes("bike") || chargerType.toLowerCase().includes("bike") || chargerType.toLowerCase().includes("15a")) {
            badgesHtml += `<span style="background: #059669; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-right: 4px;">🛵 EV Bike</span>`;
        }
        if (supported.includes("car") || chargerType.toLowerCase().includes("dc") || chargerType.toLowerCase().includes("ac") || chargerType.toLowerCase().includes("ultra")) {
            badgesHtml += `<span style="background: #2563eb; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">🚘 EV Car</span>`;
        }

        let statusStyle = "background: #10b981; color: white;";
        let statusText = `⚡ ${availableSlots} Slots Available`;
        let actionBtn = `<button class="book-btn" onclick="bookStation('${stationName.replace(/'/g, "\\'")}')">Book Now</button>`;

        if (availableSlots <= 0) {
            statusStyle = "background: #ef4444; color: white;";
            statusText = `❌ FULL (0 Slots)`;
            actionBtn = `<button class="book-btn" disabled style="background: #94a3b8; cursor: not-allowed; opacity: 0.7;">No Slots</button>`;
        }

        container.innerHTML += `
            <div class="station-card">
                <img src="${imageUrl}" alt="${stationName} image" onerror="this.src='images/ev-car-image.jpeg'">
                <div class="station-content">
                    <div style="margin-bottom: 8px;">${badgesHtml}</div>
                    <span class="status" style="${statusStyle}">
                        ${statusText}
                    </span>
                    <h2>${stationName}</h2>
                    <p><i class="fa-solid fa-location-dot"></i> ${stationLocation}</p>
                    <p><i class="fa-solid fa-phone"></i> ${station.contactNumber || "+91 9876543210"}</p>
                    <p><i class="fa-solid fa-bolt"></i> ${chargerType}</p>
                    <p><i class="fa-solid fa-star"></i> 4.8 / 5</p>
                    <div class="buttons">
                        <button class="map-btn" onclick="openMap(${station.latitude}, ${station.longitude})">View Map</button>
                        ${actionBtn}
                    </div>
                </div>
            </div>
        `;
    });
}

// -------------------------------
// Combined Search & Filters

function applyFilters() {
    const keyword = (document.getElementById("search") ? document.getElementById("search").value : "").toLowerCase().trim();
    const vehicleVal = document.getElementById("vehicleFilter") ? document.getElementById("vehicleFilter").value : "";
    const chargerVal = document.getElementById("chargerFilter") ? document.getElementById("chargerFilter").value : "";

    filteredStations = stations.filter(s => {
        const name = (s.name || s.stationName || "").toLowerCase();
        const location = (s.location || "").toLowerCase();
        const supported = (s.supportedVehicles || "Car,Bike").toLowerCase();
        const charger = (s.chargerType || "").toLowerCase();

        // Keyword filter
        const matchesKeyword = !keyword || name.includes(keyword) || location.includes(keyword);

        // Vehicle filter
        let matchesVehicle = true;
        if (vehicleVal === "Bike") {
            matchesVehicle = supported.includes("bike") || charger.includes("bike") || charger.includes("15a");
        } else if (vehicleVal === "Car") {
            matchesVehicle = supported.includes("car") || charger.includes("dc") || charger.includes("ac") || charger.includes("ultra");
        }

        // Charger filter
        let matchesCharger = true;
        if (chargerVal === "DC") {
            matchesCharger = charger.includes("dc");
        } else if (chargerVal === "AC") {
            matchesCharger = charger.includes("ac");
        } else if (chargerVal === "Ultra Fast Charging") {
            matchesCharger = charger.includes("ultra");
        } else if (chargerVal) {
            matchesCharger = (s.chargerType === chargerVal);
        }

        return matchesKeyword && matchesVehicle && matchesCharger;
    });

    displayStations(filteredStations);
}

const searchInput = document.getElementById("search");
if (searchInput) searchInput.addEventListener("keyup", applyFilters);

const vehicleFilter = document.getElementById("vehicleFilter");
if (vehicleFilter) vehicleFilter.addEventListener("change", applyFilters);

const chargerFilter = document.getElementById("chargerFilter");
if (chargerFilter) chargerFilter.addEventListener("change", applyFilters);

// -------------------------------
// Book Station

function bookStation(name) {
    localStorage.setItem("selectedStation", name);
    window.location.href = "booking.html";
}

// -------------------------------
// Open Google Maps

function openMap(lat, lng) {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
}

// -------------------------------

loadStations();
