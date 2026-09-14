// =====================================
// EV Finder - AI Recommendation
// =====================================

let recommendedStation = null;

// -------------------------------------
// Load Best Station
// -------------------------------------

async function loadRecommendation() {

    try {

        const baseUrl = (window.BASE_URL || (typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:8080/api' : `${window.location.origin}/api`)));
        const response = await fetch(`${baseUrl}/stations`);

        if (!response.ok) {

            throw new Error("Unable to load stations.");

        }

        const stations = await response.json();

        if (stations.length === 0) {

            document.querySelector(".container").innerHTML =

            "<h2 style='text-align:center'>No Stations Available</h2>";

            return;

        }

        // ======================================
        // AI Logic
        // Choose station with maximum available slots
        // ======================================

        recommendedStation = stations.reduce((best, current) => {

            return current.availableSlots > best.availableSlots
                ? current
                : best;

        });

        // ======================================
        // Update UI
        // ======================================

        document.getElementById("stationName").innerText =
            recommendedStation.stationName;

        document.getElementById("stationLocation").innerText =
            recommendedStation.location;

        document.getElementById("chargerType").innerText =
            recommendedStation.chargerType;

        document.getElementById("availableSlots").innerText =
            recommendedStation.availableSlots;

        // Fake distance (until GPS is added)

        let distance = (Math.random() * 5 + 1).toFixed(1);

        document.getElementById("distance").innerText =
            distance + " km";

    }

    catch (error) {

        console.error(error);

        alert("Unable to load AI Recommendation.");

    }

}

// -------------------------------------
// Google Map
// -------------------------------------

function openMap() {

    if (!recommendedStation) return;

    window.open(

        `https://www.google.com/maps?q=${recommendedStation.latitude},${recommendedStation.longitude}`,

        "_blank"

    );

}

// -------------------------------------
// Booking
// -------------------------------------

function bookNow() {

    if (recommendedStation) {

        localStorage.setItem(

            "selectedStation",

            recommendedStation.stationName

        );

    }

    window.location.href = "booking.html";

}

// -------------------------------------

loadRecommendation();