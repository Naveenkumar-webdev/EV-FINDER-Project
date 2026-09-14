// Auth Check: Redirect unauthenticated users to login page first
const loggedUserRaw = localStorage.getItem("loggedUser");
if (!loggedUserRaw) {
    localStorage.setItem("redirectAfterLogin", "history.html");
    window.location.href = "login.html";
}

const loggedUser = JSON.parse(loggedUserRaw || "{}");
const isLoggedAdmin = loggedUser && loggedUser.role && loggedUser.role.toUpperCase() === "ADMIN";

window.onload = function () {
    if (isLoggedAdmin) {
        const topHeader = document.querySelector(".topbar h1");
        if (topHeader) {
            topHeader.innerHTML = `📋 All Station Bookings <span style="background:#f59e0b; color:#78350f; font-size:0.75rem; font-weight:700; padding:3px 10px; border-radius:20px; text-transform:uppercase; margin-left:10px; vertical-align:middle;">Admin Mode</span>`;
        }
    }
    loadBookings();
};

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

// Fetch bookings from Spring Boot
function loadBookings() {
    fetch(`https://ev-finder-backend-production.up.railway.app/api/bookings`)
        .then(res => res.json())
        .then(data => {
            const table = document.getElementById("historyTableBody");
            if (!table) return;
            table.innerHTML = "";

            const userEmail = loggedUser ? loggedUser.email : "";

            let displayBookings = [];
            if (isLoggedAdmin) {
                displayBookings = data; // Admin views ALL station bookings!
            } else {
                // Filter bookings by email (exact match) with fallback to name
                displayBookings = data.filter(b => {
                    if (b.customerEmail && userEmail) {
                        return b.customerEmail.toLowerCase() === userEmail.toLowerCase();
                    }
                    if (loggedUser) {
                        const displayName = loggedUser.fullName || loggedUser.name;
                        return b.customerName === displayName;
                    }
                    return false;
                });
            }

            if (displayBookings.length === 0) {
                table.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; padding:24px; color:#64748b;">
                        No bookings found.
                    </td>
                </tr>
                `;
                return;
            }

            displayBookings.forEach(b => {
                const rawStatus = b.paymentStatus || "Confirmed";
                const isCancelled = rawStatus.toUpperCase() === "CANCELLED";
                const completed = isBookingCompleted(b.bookingDate, b.slot);

                let displayStatus = rawStatus;
                let statusColor = "#16a34a"; // Green
                let actionHtml = "";

                if (isCancelled) {
                    displayStatus = "Cancelled";
                    statusColor = "#ef4444"; // Red
                    actionHtml = '<span style="color:#94a3b8; font-weight:600;">Cancelled</span>';
                } else if (completed) {
                    displayStatus = "Completed";
                    statusColor = "#0284c7"; // Blue/cyan for Completed
                    actionHtml = '<span style="color:#0284c7; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Completed</span>';
                } else {
                    displayStatus = rawStatus.toUpperCase() === "PAID" ? "Paid" : "Confirmed";
                    statusColor = "#16a34a";
                    actionHtml = `<button onclick="cancelBooking(${b.id})" class="cancel-btn">Cancel</button>`;
                }

                const vCategory = (b.vehicleType === "Bike" || (b.type && b.type.toLowerCase().includes("bike"))) ? "🛵" : "🚘";

                let row = `
                <tr>
                    <td><strong>#${b.id}</strong></td>
                    <td>${b.customerName || "Customer"}</td>
                    <td><code>${vCategory} ${b.vehicleNumber || "N/A"}</code></td>
                    <td><strong>${b.station}</strong></td>
                    <td>${b.slot || "N/A"}</td>
                    <td>${b.bookingDate}</td>
                    <td style="color:${statusColor}; font-weight:bold;">
                        ${displayStatus}
                    </td>
                    <td>
                        ${actionHtml}
                    </td>
                </tr>
                `;

                table.innerHTML += row;
            });
        })
        .catch(err => {
            console.error("Error loading bookings:", err);
        });
}

async function cancelBooking(id) {
    if (!confirm("Are you sure you want to cancel this booking?")) {
        return;
    }

    try {
        const response = await fetch(`https://ev-finder-backend-production.up.railway.app/api/bookings/${id}/cancel`, {
            method: "POST"
        });

        if (!response.ok) {
            throw new Error("Failed to cancel booking");
        }

        alert("Booking cancelled successfully!");
        loadBookings(); // Reload table
    } catch (err) {
        console.error("Cancel booking error:", err);
        alert("Could not cancel booking. Please try again.");
    }
}