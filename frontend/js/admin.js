// ===============================
// Admin Panel - Stations & Bookings Management
// ===============================

let allBookingsData = [];
let allStationsData = [];

window.onload = function () {
    // Auth guard check
    const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
    if (!loggedUser || !loggedUser.role || loggedUser.role.toUpperCase() !== "ADMIN") {
        alert("Access Denied: Only Admins can access this page.");
        window.location.href = "login.html";
        return;
    }
    
    loadStations();
    loadAllBookings();
};

// ----------------------
// Slot & Status Helpers
// ----------------------
function parseSlotEndTime(slotText) {
    if (!slotText || slotText === "N/A") return { hours: 23, minutes: 59 };
    
    let targetTimeStr = slotText.trim();
    if (targetTimeStr.includes('-')) {
        const parts = targetTimeStr.split('-');
        targetTimeStr = parts[parts.length - 1].trim();
    }
    
    const parts = targetTimeStr.split(' ');
    if (parts.length < 2) return { hours: 23, minutes: 59 };
    
    const [time, period] = parts;
    const timeParts = time.split(':').map(Number);
    let hours = timeParts[0] || 0;
    let minutes = timeParts[1] || 0;
    
    const upperPeriod = period.toUpperCase();
    if (upperPeriod === 'PM' && hours !== 12) hours += 12;
    if (upperPeriod === 'AM' && hours === 12) hours = 0;
    
    return { hours, minutes };
}

function isBookingCompleted(bookingDateStr, slotStr) {
    if (!bookingDateStr) return false;
    
    const now = new Date();
    const dateParts = bookingDateStr.split('-').map(Number);
    if (dateParts.length !== 3 || isNaN(dateParts[0])) return false;
    
    const year = dateParts[0];
    const month = dateParts[1] - 1;
    const day = dateParts[2];
    
    const { hours, minutes } = parseSlotEndTime(slotStr);
    const slotEndTime = new Date(year, month, day, hours, minutes, 59);
    
    return now > slotEndTime;
}

// ----------------------
// Load all stations
// ----------------------
function loadStations() {
    fetch(`https://ev-finder-backend-production.up.railway.app/api/stations`)
        .then(res => res.json())
        .then(data => {
            allStationsData = data;
            
            // Update Stations Count Label & KPI
            const countElem = document.getElementById("stationCountLabel");
            if (countElem) countElem.innerText = `${data.length} Stations`;
            
            const kpiElem = document.getElementById("statTotalStations");
            if (kpiElem) kpiElem.innerText = data.length;

            // Populate Station Filter Dropdown
            populateStationFilter(data);

            let table = document.getElementById("stationTable");
            if (!table) return;
            table.innerHTML = "";

            if (data.length === 0) {
                table.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center; padding: 20px; color: var(--muted);">
                            No stations found. Add one above!
                        </td>
                    </tr>
                `;
                return;
            }

            data.forEach((s, index) => {
                let row = `
                    <tr>
                        <td><strong>#${s.id}</strong></td>
                        <td><strong>${s.name}</strong></td>
                        <td>${s.location || "N/A"}</td>
                        <td><code>${s.contactNumber || "+91 9876543210"}</code></td>
                        <td><span class="status-pill pill-blue">${s.chargerType || "Standard"}</span></td>
                        <td><span class="status-pill ${s.availableSlots > 0 ? 'pill-green' : 'pill-red'}">${s.availableSlots} slots</span></td>
                        <td>
                            <button onclick="deleteStation(${s.id})" class="btn-sm btn-danger">
                                <i class="fa-solid fa-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `;
                table.innerHTML += row;
            });
        })
        .catch(err => {
            console.error("Error loading stations:", err);
            let table = document.getElementById("stationTable");
            if (table) table.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Failed to load stations</td></tr>`;
        });
}

function populateStationFilter(stations) {
    const filterSelect = document.getElementById("stationFilterSelect");
    if (!filterSelect) return;

    const currentValue = filterSelect.value;
    filterSelect.innerHTML = `<option value="ALL">All Stations</option>`;
    
    stations.forEach(s => {
        let opt = document.createElement("option");
        opt.value = s.name;
        opt.textContent = s.name;
        filterSelect.appendChild(opt);
    });

    filterSelect.value = currentValue || "ALL";
}

// ----------------------
// Add station
// ----------------------
function addStation() {
    const name = document.getElementById("name").value.trim();
    const location = document.getElementById("location").value.trim();
    const contactNumber = document.getElementById("contactNumber") ? document.getElementById("contactNumber").value.trim() : "";
    const chargerType = document.getElementById("chargerType").value;
    const availableSlots = parseInt(document.getElementById("availableSlots").value, 10);

    if (!name || !location || !contactNumber || !chargerType || isNaN(availableSlots)) {
        alert("Please fill in Station Name, Location, Station Contact Number, Charger Type, and Available Slots.");
        return;
    }

    const imageUrl = document.getElementById("imageUrl").value.trim();
    if (imageUrl && !/\.(jpe?g)$/i.test(imageUrl)) {
        alert("Please enter an image URL ending with .jpg or .jpeg");
        return;
    }

    const supportedVehicles = document.getElementById("supportedVehicles") ? document.getElementById("supportedVehicles").value : "Car,Bike";

    let station = {
        name: name,
        location: location,
        contactNumber: contactNumber,
        chargerType: chargerType,
        supportedVehicles: supportedVehicles,
        availableSlots: availableSlots || 0,
        imageUrl: imageUrl,
        latitude: parseFloat(document.getElementById("lat").value) || 0,
        longitude: parseFloat(document.getElementById("lng").value) || 0
    };

    fetch(`https://ev-finder-backend-production.up.railway.app/api/stations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(station)
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to add station");
        return res.json();
    })
    .then(() => {
        alert("Station added successfully!");
        document.getElementById("name").value = "";
        document.getElementById("location").value = "";
        if (document.getElementById("contactNumber")) document.getElementById("contactNumber").value = "";
        document.getElementById("chargerType").value = "";
        document.getElementById("availableSlots").value = "";
        document.getElementById("imageUrl").value = "";
        document.getElementById("lat").value = "";
        document.getElementById("lng").value = "";
        loadStations();
    })
    .catch(err => alert("Error adding station: " + err.message));
}

// ----------------------
// Delete station
// ----------------------
function deleteStation(id) {
    if (!confirm("Are you sure you want to delete this station?")) {
        return;
    }
    fetch(`https://ev-finder-backend-production.up.railway.app/api/stations/${id}`, {
        method: "DELETE"
    })
    .then(res => {
        if (!res.ok) throw new Error("Delete failed");
        alert("Station deleted successfully!");
        loadStations();
    })
    .catch(err => alert("Delete failed: " + err.message));
}

// ----------------------
// Load All Stations Bookings
// ----------------------
function loadAllBookings() {
    fetch(`https://ev-finder-backend-production.up.railway.app/api/bookings`)
        .then(res => res.json())
        .then(data => {
            allBookingsData = data;
            
            // Calculate KPI Stats
            const totalBookings = data.length;
            const cancelledBookings = data.filter(b => (b.paymentStatus || "").toUpperCase() === "CANCELLED").length;
            const activeBookings = totalBookings - cancelledBookings;

            const totalElem = document.getElementById("statTotalBookings");
            if (totalElem) totalElem.innerText = totalBookings;

            const activeElem = document.getElementById("statActiveBookings");
            if (activeElem) activeElem.innerText = activeBookings;

            const cancelledElem = document.getElementById("statCancelledBookings");
            if (cancelledElem) cancelledElem.innerText = cancelledBookings;

            renderBookingsTable(data);
        })
        .catch(err => {
            console.error("Error fetching bookings:", err);
            const table = document.getElementById("allBookingsTable");
            if (table) {
                table.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red; padding: 20px;">Error loading bookings from server.</td></tr>`;
            }
        });
}

function filterBookings() {
    const searchText = (document.getElementById("bookingSearchInput").value || "").toLowerCase().trim();
    const selectedStation = document.getElementById("stationFilterSelect").value;
    const selectedStatus = document.getElementById("statusFilterSelect").value;

    const filtered = allBookingsData.filter(b => {
        // Station Filter
        if (selectedStation !== "ALL" && b.station !== selectedStation) {
            return false;
        }

        // Status Filter
        const rawStatus = (b.paymentStatus || "Confirmed").toUpperCase();
        const isCancelled = rawStatus === "CANCELLED";
        const completed = isBookingCompleted(b.bookingDate, b.slot);

        if (selectedStatus === "CANCELLED" && !isCancelled) return false;
        if (selectedStatus === "COMPLETED" && (isCancelled || !completed)) return false;
        if (selectedStatus === "CONFIRMED" && (isCancelled || completed)) return false;

        // Search text matching (Customer Name, Email, Station, Vehicle Number, ID)
        if (searchText) {
            const idMatch = (b.id + "").includes(searchText);
            const nameMatch = (b.customerName || "").toLowerCase().includes(searchText);
            const emailMatch = (b.customerEmail || "").toLowerCase().includes(searchText);
            const stationMatch = (b.station || "").toLowerCase().includes(searchText);
            const vehicleMatch = (b.vehicleNumber || "").toLowerCase().includes(searchText);

            return idMatch || nameMatch || emailMatch || stationMatch || vehicleMatch;
        }

        return true;
    });

    renderBookingsTable(filtered);
}

function renderBookingsTable(bookings) {
    const table = document.getElementById("allBookingsTable");
    if (!table) return;
    table.innerHTML = "";

    if (bookings.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 28px; color: var(--muted);">
                    <i class="fa-solid fa-inbox" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
                    No bookings found matching criteria.
                </td>
            </tr>
        `;
        return;
    }

    bookings.forEach(b => {
        const rawStatus = b.paymentStatus || "Confirmed";
        const isCancelled = rawStatus.toUpperCase() === "CANCELLED";
        const completed = isBookingCompleted(b.bookingDate, b.slot);

        let statusPill = "";
        if (isCancelled) {
            statusPill = `<span class="status-pill pill-red"><i class="fa-solid fa-circle-xmark"></i> Cancelled</span>`;
        } else if (completed) {
            statusPill = `<span class="status-pill pill-blue"><i class="fa-solid fa-circle-check"></i> Completed</span>`;
        } else {
            statusPill = `<span class="status-pill pill-green"><i class="fa-solid fa-circle-check"></i> ${rawStatus.toUpperCase() === "PAID" ? "Paid" : "Confirmed"}</span>`;
        }

        const paymentInfo = b.paymentType ? `<span style="font-size: 0.8rem; font-weight: 600; color: #475569;">${b.paymentType}</span>` : `<span style="font-size: 0.8rem; color: #94a3b8;">Standard</span>`;

        let actionBtns = ``;
        if (!isCancelled && !completed) {
            actionBtns += `
                <button onclick="cancelBookingByAdmin(${b.id})" class="btn-sm btn-warning" title="Cancel Booking">
                    <i class="fa-solid fa-ban"></i> Cancel
                </button>
            `;
        }
        actionBtns += `
            <button onclick="deleteBookingByAdmin(${b.id})" class="btn-sm btn-danger" style="margin-left: 4px;" title="Delete Booking Record">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        let row = `
            <tr>
                <td><strong>#${b.id}</strong></td>
                <td>
                    <div style="font-weight: 600;">${b.customerName || "Customer"}</div>
                    <div style="font-size: 0.78rem; color: var(--muted);">${b.customerEmail || "No email"}</div>
                </td>
                <td><strong style="color: var(--primary);">${b.station}</strong></td>
                <td><span style="font-size: 0.82rem; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; font-weight: 500;">${b.type || "Standard"}</span></td>
                <td><code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.8rem;">${b.vehicleNumber || "N/A"}</code></td>
                <td>
                    <div style="font-weight: 500;">${b.bookingDate || "N/A"}</div>
                    <div style="font-size: 0.78rem; color: var(--muted);">${b.slot || "N/A"}</div>
                </td>
                <td>${paymentInfo}</td>
                <td>${statusPill}</td>
                <td>${actionBtns}</td>
            </tr>
        `;
        table.innerHTML += row;
    });
}

// ----------------------
// Admin Actions on Bookings
// ----------------------
function cancelBookingByAdmin(id) {
    if (!confirm("Are you sure you want to cancel this booking? Slot will be restored to the station.")) {
        return;
    }
    fetch(`https://ev-finder-backend-production.up.railway.app/api/bookings/${id}/cancel`, {
        method: "POST"
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to cancel booking");
        alert("Booking cancelled successfully!");
        loadAllBookings();
        loadStations(); // Refresh station slot counts
    })
    .catch(err => alert("Error: " + err.message));
}

function deleteBookingByAdmin(id) {
    if (!confirm("Are you sure you want to permanently delete this booking record?")) {
        return;
    }
    fetch(`https://ev-finder-backend-production.up.railway.app/api/bookings/${id}`, {
        method: "DELETE"
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to delete booking");
        alert("Booking record deleted successfully!");
        loadAllBookings();
    })
    .catch(err => alert("Error: " + err.message));
}