// ==========================================
// EV Finder - Station Details
// ==========================================

let selectedStation = null;

// ------------------------------------------
// Load Station Details
// ------------------------------------------

async function loadStation() {

    try {

        const response = await fetch(`https://ev-finder-project-production-2026.up.railway.app/api/stations`);

        if (!response.ok) {

            throw new Error("Unable to load station data");

        }

        const stations = await response.json();

        // Get station selected from View Stations page
        const stationName = localStorage.getItem("selectedStation");

        // Find selected station
        selectedStation = stations.find(s => s.stationName === stationName);

        // If no station found, use first station
        if (!selectedStation && stations.length > 0) {

            selectedStation = stations[0];

        }

        if (!selectedStation) {

            document.querySelector(".container").innerHTML =
            "<h2>No station found.</h2>";

            return;

        }

        // Update page

        document.getElementById("stationName").innerText =
            selectedStation.stationName;

        document.getElementById("stationLocation").innerText =
            selectedStation.location;

        document.getElementById("chargerType").innerText =
            selectedStation.chargerType;

        document.getElementById("availableSlots").innerText =
            selectedStation.availableSlots;

    }

    catch(error){

        console.error(error);

        alert("Failed to load station details.");

    }

}

// ------------------------------------------
// Open Google Maps
// ------------------------------------------

function openMap(){

    if(!selectedStation) return;

    window.open(

        `https://www.google.com/maps?q=${selectedStation.latitude},${selectedStation.longitude}`,

        "_blank"

    );

}

// ------------------------------------------
// Booking Page
// ------------------------------------------

function goBooking(){

    if(selectedStation){

        localStorage.setItem(
            "selectedStation",
            selectedStation.stationName
        );

    }

    window.location.href = "booking.html";

}

// ------------------------------------------

loadStation();