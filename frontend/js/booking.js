// Auth Check: Redirect unauthenticated users to login page first
const loggedUser = localStorage.getItem("loggedUser");
if (!loggedUser) {
    localStorage.setItem("redirectAfterLogin", "booking.html");
    window.location.href = "login.html";
}

let selectedSlot = "";

// Load stations from backend
window.onload = function () {
    loadStations();
    
    // Auto-fill logged-in user details if available
    const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
    if (loggedUser) {
        document.getElementById("customerName").value = loggedUser.fullName || loggedUser.name || "";
        document.getElementById("vehicleNumber").value = loggedUser.vehicleNumber || "";
        if (loggedUser.vehicleType && document.getElementById("vehicleCategory")) {
            document.getElementById("vehicleCategory").value = loggedUser.vehicleType;
            onVehicleCategoryChange();
        }
    }

    const bookingDateInput = document.getElementById('bookingDate');
    const stationSelect = document.getElementById('station');

    // Set min date to today's date so user cannot select previous dates
    const todayStr = new Date().toISOString().split('T')[0];
    bookingDateInput.min = todayStr;
    bookingDateInput.value = todayStr; // default to today's date

    bookingDateInput.addEventListener('change', updateSelectedSlotTime);
    stationSelect.addEventListener('change', updateSelectedSlotTime);
    updateSelectedSlotTime();
};

function onVehicleCategoryChange() {
    const category = document.getElementById("vehicleCategory").value;
    const typeSelect = document.getElementById("type");
    
    if (category === "Bike") {
        typeSelect.innerHTML = `
            <option value="15A Bike Socket">15A Standard Socket (Bike) - ₹30/hr</option>
            <option value="Fast Bike DC">Fast DC Bike Charger (Ather/Ola) - ₹50/hr</option>
            <option value="Portable Dock">Portable EV Dock (Bike) - ₹35/hr</option>
        `;
    } else {
        typeSelect.innerHTML = `
            <option value="DC">DC Fast Charging (Car) - ₹150/hr</option>
            <option value="AC">AC Standard Charging (Car) - ₹100/hr</option>
            <option value="Ultra Fast Charging">Ultra Fast Charging (Car) - ₹250/hr</option>
        `;
    }
    updateSummary();
}

// -------------------------------
// Fetch stations from Spring Boot
// -------------------------------
function loadStations() {
    const baseUrl = (window.BASE_URL || (typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : ((window.location && window.location.hostname && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://127.0.0.1:8080/api' : `${window.location.origin}/api`)));
    fetch(`${baseUrl}/stations`)
        .then(response => response.json())
        .then(data => {
            let stationSelect = document.getElementById("station");
            stationSelect.innerHTML = '<option value="">Select Station</option>';

            data.forEach(s => {
                const sName = s.name || s.stationName || "EV Station";
                const location = s.location ? ` (${s.location})` : "";
                const available = s.availableSlots ?? 0;
                
                let option = document.createElement("option");
                option.value = sName;
                if (available <= 0) {
                    option.text = `${sName}${location} - ❌ FULL (0 Slots)`;
                    option.disabled = true;
                } else {
                    option.text = `${sName}${location} - ⚡ ${available} Slots Available`;
                }
                stationSelect.appendChild(option);
            });

            // Pre-select station if coming from view-stations.html
            const preselected = localStorage.getItem("selectedStation");
            if (preselected) {
                for (let i = 0; i < stationSelect.options.length; i++) {
                    const optVal = stationSelect.options[i].value.toLowerCase();
                    const preVal = preselected.toLowerCase();
                    if (optVal === preVal || preVal.includes(optVal) || optVal.includes(preVal)) {
                        stationSelect.selectedIndex = i;
                        break;
                    }
                }
            }

            updateSelectedSlotTime();
        })
        .catch(error => {
            console.error("Error loading stations:", error);
        });
}

function parseSlotTime(slotText) {
    if (!slotText) return { hours: 0, minutes: 0 };
    const [time, period] = slotText.trim().split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
}

function getSlotDateTime(slotText, dateString) {
    const date = new Date(dateString);
    const { hours, minutes } = parseSlotTime(slotText);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

// -------------------------------
// Time Slot Selector (Hours & Minutes)
// -------------------------------
async function updateSelectedSlotTime() {
    const hour = document.getElementById("slotHour") ? document.getElementById("slotHour").value : "10";
    const minute = document.getElementById("slotMinute") ? document.getElementById("slotMinute").value : "00";
    const ampm = document.getElementById("slotAmpm") ? document.getElementById("slotAmpm").value : "AM";
    
    selectedSlot = `${hour}:${minute} ${ampm}`;
    
    const bookingDate = document.getElementById("bookingDate") ? document.getElementById("bookingDate").value : "";
    const selectedCity = document.getElementById("station") ? document.getElementById("station").value : "";
    const notice = document.getElementById("slotNotice");
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    if (bookingDate && bookingDate === today) {
        const slotDateTime = getSlotDateTime(selectedSlot, bookingDate);
        if (slotDateTime <= now) {
            if (notice) {
                notice.innerHTML = `<span style="color: #ef4444; font-weight: 700;">⚠️ Selected time (${selectedSlot}) has already passed for today. Please choose a future time.</span>`;
            }
            updateSummary();
            return;
        }
    }

    if (notice) {
        notice.innerHTML = `<span style="color: #10b981; font-weight: 700;">✅ Selected Charging Start Time: ${selectedSlot}</span>`;
    }

    updateSummary();
}

// -------------------------------
// Live summary update
// -------------------------------
function updateSummary() {
    const categoryElem = document.getElementById("vehicleCategory");
    const category = categoryElem ? categoryElem.value : "Car";
    
    document.getElementById("sName").innerText =
        "Name : " + document.getElementById("customerName").value;

    document.getElementById("sVehicle").innerText =
        "Vehicle : " + document.getElementById("vehicleNumber").value;

    const sCatElem = document.getElementById("sCategory");
    if (sCatElem) {
        sCatElem.innerText = "Category : " + (category === "Bike" ? "🛵 EV Bike / Scooter" : "🚘 EV Car");
    }

    document.getElementById("sStation").innerText =
        "Station : " + document.getElementById("station").value;

    document.getElementById("sType").innerText =
        "Charging : " + document.getElementById("type").value;

    const hoursVal = document.getElementById("chargingHours").value;
    document.getElementById("sHours").innerText =
        "Hours : " + (hoursVal || "-");

    // Rate calculation: Bike = ₹30/hr, Car = ₹150/hr
    const ratePerHour = category === "Bike" ? 30 : 150;
    const hoursMatch = hoursVal ? hoursVal.match(/\d+/) : null;
    const hours = hoursMatch ? parseInt(hoursMatch[0]) : 0;
    const calculatedAmount = hours * ratePerHour;
    
    document.getElementById("sAmount").innerText =
        "Amount : " + (hours > 0 ? "₹" + calculatedAmount : "-");

    document.getElementById("sDate").innerText =
        "Date : " + document.getElementById("bookingDate").value;

    document.getElementById("sSlot").innerText =
        "Slot : " + selectedSlot;
}

// Attach live update events
document.addEventListener("input", updateSummary);
document.addEventListener("change", updateSummary);

// -------------------------------
// Confirm booking (Send to backend)
// -------------------------------
function confirmBooking() {
    const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
    const userEmail = loggedUser ? loggedUser.email : "";
    const categoryElem = document.getElementById("vehicleCategory");
    const vehicleType = categoryElem ? categoryElem.value : "Car";

    let bookingData = {
        customerName: document.getElementById("customerName").value,
        customerEmail: userEmail,
        vehicleNumber: document.getElementById("vehicleNumber").value,
        vehicleType: vehicleType,
        station: document.getElementById("station").value,
        type: document.getElementById("type").value,
        chargingHours: document.getElementById("chargingHours").value,
        bookingDate: document.getElementById("bookingDate").value,
        slot: selectedSlot
    };

    if (!bookingData.customerName ||
        !bookingData.vehicleNumber ||
        !bookingData.station ||
        !bookingData.chargingHours ||
        !bookingData.bookingDate ||
        !bookingData.slot) {

        alert("Please fill all details and select a slot!");
        return;
    }

    // Calculate amount to save in local storage for payment page fallback
    const hoursVal = document.getElementById("chargingHours").value;
    const hoursMatch = hoursVal ? hoursVal.match(/\d+/) : null;
    const hours = hoursMatch ? parseInt(hoursMatch[0]) : 1;
    const ratePerHour = vehicleType === "Bike" ? 30 : 150;
    const calculatedAmount = hours * ratePerHour;

    const baseUrl = (window.BASE_URL || (typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : ((window.location && window.location.hostname && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://127.0.0.1:8080/api' : `${window.location.origin}/api`)));
    fetch(`${baseUrl}/bookings`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(bookingData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Booking failed");
        }
        return response.json();
    })
    .then(data => {
        alert("Booking Successful! Proceeding to payment...");
        localStorage.setItem("bookingId", data.id);
        localStorage.setItem("vid", data.vehicleNumber);
        localStorage.setItem("bookingAmount", calculatedAmount);
        window.location.href = "payment.html";
    })
    .catch(error => {
        console.error(error);
        alert("Booking failed. Try again!");
    });
}