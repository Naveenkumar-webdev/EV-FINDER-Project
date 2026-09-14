// ==========================
// EV Finder Dashboard
// ==========================

// Load logged in user
const user = JSON.parse(localStorage.getItem("loggedUser"));

if (user) {
    const displayName = user.fullName || user.name || (user.email ? user.email.split('@')[0] : "User");
    const nameElem = document.getElementById("userName");
    if (nameElem) {
        nameElem.innerText = displayName;
    }
} else {
    const nameElem = document.getElementById("userName");
    if (nameElem) {
        nameElem.innerText = "Guest";
    }
}

// Make profile icon clickable
const profileDiv = document.querySelector(".profile");
if (profileDiv) {
    profileDiv.style.cursor = "pointer";
    profileDiv.addEventListener("click", function() {
        window.location.href = "profile.html";
    });
}

// Add Admin Portal nav option if logged in as Admin
if (user && user.role && user.role.toUpperCase() === "ADMIN") {
    const sidebarUl = document.querySelector(".sidebar ul");
    if (sidebarUl && !document.getElementById("adminNavLi")) {
        const adminLi = document.createElement("li");
        adminLi.id = "adminNavLi";
        adminLi.innerHTML = `<a href="admin-stations.html" style="color: #f59e0b; font-weight: 700;"><i class="fa-solid fa-user-shield"></i> Admin Portal</a>`;
        sidebarUl.insertBefore(adminLi, sidebarUl.children[1] || null);
    }
}

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

// -------------------------
// Total Stations
// -------------------------

fetch(`https://ev-finder-project-production-2026.up.railway.app/api/stations`)
.then(response => response.json())
.then(data => {
    document.getElementById("stationCount").innerText =
        data.length;
})
.catch(error => {
    console.log(error);
});

// -------------------------
// Total Bookings
// -------------------------

fetch(`https://ev-finder-project-production-2026.up.railway.app/api/bookings`)

.then(response => response.json())

.then(data => {
    const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
    const userEmail = loggedUser ? loggedUser.email : "";

    // Filter bookings by email (exact match) with fallback to name
    const userBookings = data.filter(b => {
        if (b.customerEmail && userEmail) {
            return b.customerEmail.toLowerCase() === userEmail.toLowerCase();
        }
        if (loggedUser) {
            const displayName = loggedUser.fullName || loggedUser.name;
            return b.customerName === displayName;
        }
        return false;
    });

    document.getElementById("bookingCount").innerText = userBookings.length;

    let table = document.getElementById("recentBookings");
    table.innerHTML = "";

    if(userBookings.length === 0){
        table.innerHTML = `
        <tr>
        <td colspan="4">
        No Bookings Found
        </td>
        </tr>
        `;
        return;
    }

    userBookings.slice(-5).reverse().forEach(booking => {
        const rawStatus = booking.paymentStatus || "Confirmed";
        const isCancelled = rawStatus.toUpperCase() === "CANCELLED";
        const completed = isBookingCompleted(booking.bookingDate, booking.slot);

        let statusText = rawStatus;
        let statusClass = "status-confirmed";

        if (isCancelled) {
            statusText = "Cancelled";
            statusClass = "status-cancelled";
        } else if (completed) {
            statusText = "Completed";
            statusClass = "status-completed";
        }

        table.innerHTML += `
        <tr>
            <td>${booking.station}</td>
            <td>${booking.vehicleNumber}</td>
            <td>${booking.bookingDate}</td>
            <td>
                <span class="status-pill ${statusClass}">
                    ${statusText}
                </span>
            </td>
        </tr>
        `;
    });

    // Check if returning/relogged user has bookings and prompt for Star Rating Review
    if (userBookings.length > 0) {
        checkAndShowReviewModal(userBookings, userEmail);
    }

})

.catch(error => {

    console.log(error);

});

// -------------------------
// Customer Star Rating Review System
// -------------------------

let selectedRating = 0;
let currentReviewBooking = null;

function setupStarRatingEvents() {
    const starBtns = document.querySelectorAll("#starRatingRow .star-btn");
    const label = document.getElementById("ratingLabel");
    const labelsMap = {
        1: "1 Star - Poor 😞",
        2: "2 Stars - Fair 😐",
        3: "3 Stars - Good 🙂",
        4: "4 Stars - Very Good 😊",
        5: "5 Stars - Excellent! ⭐"
    };

    starBtns.forEach(btn => {
        btn.addEventListener("mouseenter", function () {
            const r = parseInt(this.getAttribute("data-rating"));
            highlightStars(r, true);
        });

        btn.addEventListener("mouseleave", function () {
            highlightStars(selectedRating, false);
        });

        btn.addEventListener("click", function () {
            selectedRating = parseInt(this.getAttribute("data-rating"));
            highlightStars(selectedRating, false);
            if (label) {
                label.innerText = labelsMap[selectedRating] || "Select rating";
            }
        });
    });
}

function highlightStars(count, isHover) {
    const starBtns = document.querySelectorAll("#starRatingRow .star-btn");
    starBtns.forEach((btn, idx) => {
        const starNum = idx + 1;
        btn.classList.remove("active", "hovered");
        if (starNum <= count) {
            if (isHover) {
                btn.classList.add("hovered");
            } else {
                btn.classList.add("active");
            }
        }
    });
}

function checkAndShowReviewModal(userBookings, userEmail) {
    if (!userBookings || userBookings.length === 0) return;

    // Pick latest non-cancelled booking
    const validBookings = userBookings.filter(b => (b.paymentStatus || "").toUpperCase() !== "CANCELLED");
    if (validBookings.length === 0) return;

    currentReviewBooking = validBookings[validBookings.length - 1];

    // Check backend API if user already reviewed
    fetch(`https://ev-finder-project-production-2026.up.railway.app/api/reviews/user/${encodeURIComponent(userEmail)}`)
        .then(res => res.json())
        .then(reviews => {
            const currentStation = (currentReviewBooking.station || "").trim().toLowerCase();
            const alreadyReviewedThisStation = reviews.some(r => (r.stationName || "").trim().toLowerCase() === currentStation);
            const sessionSkipped = sessionStorage.getItem("skip_review_" + currentReviewBooking.id);

            if (!alreadyReviewedThisStation && !sessionSkipped) {
                const textElem = document.getElementById("reviewStationText");
                if (textElem) {
                    textElem.innerHTML = `We noticed you previously booked a charging slot at <strong>${currentReviewBooking.station}</strong>. How was your experience?`;
                }
                
                setupStarRatingEvents();
                setTimeout(() => {
                    const modal = document.getElementById("reviewModal");
                    if (modal) modal.style.display = "flex";
                }, 700);
            }
        })
        .catch(err => {
            console.error("Error checking user reviews:", err);
        });
}

function closeReviewModal(skipSession = false) {
    const modal = document.getElementById("reviewModal");
    if (modal) modal.style.display = "none";
    if (currentReviewBooking) {
        sessionStorage.setItem("skip_review_" + currentReviewBooking.id, "true");
    }
}

function submitUserReview() {
    if (selectedRating === 0) {
        alert("Please select a star rating (1 to 5 stars).");
        return;
    }

    const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
    const userEmail = loggedUser ? loggedUser.email : "";
    const customerName = loggedUser ? (loggedUser.fullName || loggedUser.name || "Customer") : "Customer";
    const comment = document.getElementById("reviewComment") ? document.getElementById("reviewComment").value.trim() : "";
    const stationName = currentReviewBooking ? currentReviewBooking.station : "EV Station";

    const reviewPayload = {
        userEmail: userEmail,
        customerName: customerName,
        stationName: stationName,
        rating: selectedRating,
        reviewText: comment
    };

    fetch(`https://ev-finder-project-production-2026.up.railway.app/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewPayload)
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to save review");
        return res.json();
    })
    .then(data => {
        alert("Thank you for your rating & feedback! ⭐⭐⭐⭐⭐");
        closeReviewModal(true);
        loadDashboardRating();
        loadUserReviewsTable();
    })
    .catch(err => {
        console.error(err);
        alert("Thank you for your rating! ⭐⭐⭐⭐⭐");
        closeReviewModal(true);
    });
}

// -------------------------
// Load Customer Reviews Table & Overall Rating
// -------------------------
function loadUserReviewsTable() {
    fetch(`https://ev-finder-project-production-2026.up.railway.app/api/reviews`)
        .then(res => res.json())
        .then(reviews => {
            const tableBody = document.getElementById("userReviewsTable");
            const countElem = document.getElementById("totalReviewsCount");
            
            if (!tableBody) return;

            if (countElem) {
                countElem.innerText = `${reviews.length} Review${reviews.length === 1 ? '' : 's'}`;
            }

            if (!reviews || reviews.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; color: #64748b;">No user reviews submitted yet.</td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = "";
            reviews.slice().reverse().slice(0, 10).forEach(rev => {
                const numRating = rev.rating || 5;
                const stars = "⭐".repeat(numRating);
                const reviewComment = rev.reviewText ? rev.reviewText : `<span style="color: #94a3b8; font-style: italic;">No comment</span>`;
                const date = rev.reviewDate || "N/A";
                const customer = rev.customerName || "Customer";
                const station = rev.stationName || "EV Station";

                tableBody.innerHTML += `
                    <tr>
                        <td><strong>${station}</strong></td>
                        <td>${customer}</td>
                        <td><span style="color: #f59e0b; font-weight: 700;">${stars}</span> (${numRating}/5)</td>
                        <td>${reviewComment}</td>
                        <td>${date}</td>
                    </tr>
                `;
            });
        })
        .catch(err => {
            console.error("Error loading user reviews table:", err);
            const tableBody = document.getElementById("userReviewsTable");
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="5" style="color: #ef4444;">Failed to load reviews.</td></tr>`;
            }
        });
}

function loadDashboardRating() {
    fetch(`https://ev-finder-project-production-2026.up.railway.app/api/reviews`)
        .then(res => res.json())
        .then(reviews => {
            if (reviews && reviews.length > 0) {
                const total = reviews.reduce((sum, r) => sum + (r.rating || 5), 0);
                const avg = (total / reviews.length).toFixed(1);
                const ratingCard = document.querySelector(".card:nth-child(4) h2");
                if (ratingCard) {
                    ratingCard.innerText = `${avg}★`;
                }
            }
        })
        .catch(err => console.error("Error loading rating:", err));
}

loadDashboardRating();
loadUserReviewsTable();

// -------------------------
// Logout
// -------------------------

function logout(){

    localStorage.removeItem("loggedUser");

    window.location.href="login.html";

}