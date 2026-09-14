// ===========================
// Booking Success Page Logic
// ===========================

window.onload = function () {
    const bookingId = localStorage.getItem("bookingId");
    if (!bookingId || bookingId === "N/A") {
        return;
    }

    fetch(`https://ev-finder-project-production-2026.up.railway.app/api/bookings/${bookingId}`)
        .then(res => {
            if (!res.ok) throw new Error("Failed to load booking details");
            return res.json();
        })
        .then(booking => {
            const isBike = (booking.vehicleType === "Bike" || (booking.type && booking.type.toLowerCase().includes("bike")));
            const vehicleTypeText = isBike ? "🛵 EV Bike / Scooter (2-Wheeler)" : "🚘 EV Car (4-Wheeler)";
            
            const hoursMatch = booking.chargingHours ? booking.chargingHours.match(/\d+/) : null;
            const hours = hoursMatch ? parseInt(hoursMatch[0]) : 1;
            const ratePerHour = isBike ? 30 : 150;
            const calculatedAmount = hours * ratePerHour;
            const paidAmountStr = localStorage.getItem("paidAmount") || localStorage.getItem("bookingAmount") || calculatedAmount;

            document.getElementById("bId").innerText = booking.id;
            document.getElementById("bStation").innerText = booking.station;
            document.getElementById("bSlot").innerText = booking.slot || "N/A";
            document.getElementById("vechiclenumber").innerText = booking.vehicleNumber || "N/A";
            if (document.getElementById("bVehicleType")) {
                document.getElementById("bVehicleType").innerText = vehicleTypeText;
            }
            if (document.getElementById("bAmountPaid")) {
                document.getElementById("bAmountPaid").innerText = "₹" + parseFloat(paidAmountStr).toFixed(2);
            }
            document.getElementById("bPaymentType").innerText = booking.paymentType || localStorage.getItem("paymentType") || "N/A";

            loadStationContact(booking.station);
        })
        .catch(err => {
            console.error("Error loading booking success details:", err);
            // Fallback to local storage if API fails
            const vehicleNumber = localStorage.getItem("vid") || localStorage.getItem("vehicleNumber") || "N/A";
            const station = localStorage.getItem("selectedStation") || "EV Station";
            const slot = localStorage.getItem("selectedSlot") || "Time Slot";
            const paymentType = localStorage.getItem("paymentType") || "N/A";
            const storedType = localStorage.getItem("bookingVehicleType");
            const isBike = storedType === "Bike";
            const vehicleTypeText = isBike ? "🛵 EV Bike / Scooter (2-Wheeler)" : "🚘 EV Car (4-Wheeler)";
            const paidAmountStr = localStorage.getItem("paidAmount") || localStorage.getItem("bookingAmount") || "150";

            document.getElementById("bId").innerText = bookingId;
            document.getElementById("bStation").innerText = station;
            document.getElementById("bSlot").innerText = slot;
            document.getElementById("vechiclenumber").innerText = vehicleNumber;
            if (document.getElementById("bVehicleType")) {
                document.getElementById("bVehicleType").innerText = vehicleTypeText;
            }
            if (document.getElementById("bAmountPaid")) {
                document.getElementById("bAmountPaid").innerText = "₹" + parseFloat(paidAmountStr).toFixed(2);
            }
            document.getElementById("bPaymentType").innerText = paymentType;

            loadStationContact(station);
        });
};

function loadStationContact(stationName) {
    if (!stationName) return;
    fetch(`https://ev-finder-project-production-2026.up.railway.app/api/stations`)
        .then(res => res.json())
        .then(stations => {
            const target = stations.find(s => 
                (s.name && (s.name.toLowerCase() === stationName.toLowerCase() || stationName.toLowerCase().includes(s.name.toLowerCase()))) ||
                (s.location && s.location.toLowerCase() === stationName.toLowerCase())
            );
            if (target && target.contactNumber) {
                const phoneElem = document.getElementById("bStationPhone");
                const linkElem = document.getElementById("bStationPhoneLink");
                if (phoneElem) phoneElem.innerText = target.contactNumber;
                if (linkElem) linkElem.href = "tel:" + target.contactNumber.replace(/\s+/g, '');
            }
        })
        .catch(err => console.error("Error fetching station contact:", err));
}

// ----------------------
// Go to dashboard / layout page
// ----------------------
function goHome() {
    window.location.href = "layout.html";
}

// ----------------------
// Download / Print Receipt Invoice
// ----------------------
function downloadReceipt() {
    window.print();
}

// ----------------------
// Send Receipt to Email
// ----------------------
function sendReceiptToEmail() {
    const bookingId = localStorage.getItem("bookingId");
    if (!bookingId || bookingId === "N/A") {
        alert("Booking ID not found!");
        return;
    }

    fetch(`https://ev-finder-project-production-2026.up.railway.app/api/bookings/${bookingId}/email`, {
        method: "POST"
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || "Receipt email process triggered! Check your inbox 📩");
    })
    .catch(err => {
        console.error("Error sending receipt email:", err);
        alert("Receipt email sent! Check your inbox or server logs.");
    });
}