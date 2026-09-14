// ===========================
// Payment Page Logic
// ===========================

let method = "card";

// Load booking info from localStorage
window.onload = function () {
    let bookingId = localStorage.getItem("bookingId");
    if (!bookingId) return;

    document.getElementById("bId").innerText = "Booking ID: " + bookingId;
    document.getElementById("bAmount").innerText = "Amount: -";

    fetch(`https://ev-finder-project-production-2026.up.railway.app/api/bookings/${bookingId}`)
        .then(res => res.json())
        .then(booking => {
            document.getElementById("bStation").innerText = "Station: " + booking.station;
            document.getElementById("bSlot").innerText = "Slot: " + (booking.slot || "-");
            
            // Extract numeric hours (e.g. "2 Hours" -> 2)
            const hoursMatch = booking.chargingHours ? booking.chargingHours.match(/\d+/) : null;
            const hours = hoursMatch ? parseInt(hoursMatch[0]) : 1;
            const isBike = (booking.vehicleType === "Bike" || (booking.type && booking.type.toLowerCase().includes("bike")));
            const ratePerHour = isBike ? 30 : 150;
            const calculatedAmount = hours * ratePerHour;

            localStorage.setItem("paidAmount", calculatedAmount);
            localStorage.setItem("bookingVehicleType", isBike ? "Bike" : "Car");

            const amountInput = document.getElementById("paymentAmount");
            if (amountInput) {
                amountInput.value = calculatedAmount;
                amountInput.readOnly = true; // Block manual edit
            }
            document.getElementById("bAmount").innerText = `Amount: ₹${calculatedAmount.toFixed(2)}`;
        })
        .catch(err => {
            console.error("Error loading booking for payment:", err);
            // Local storage fallback
            const localAmount = localStorage.getItem("bookingAmount") || "150";
            localStorage.setItem("paidAmount", localAmount);
            const amountInput = document.getElementById("paymentAmount");
            if (amountInput) {
                amountInput.value = localAmount;
                amountInput.readOnly = true;
            }
            document.getElementById("bAmount").innerText = `Amount: ₹${parseFloat(localAmount).toFixed(2)}`;
        });
};

// ----------------------
// Payment method switch
// ----------------------
function selectMethod(type, evt) {
    method = type;

    document.querySelectorAll(".methods button")
        .forEach(btn => btn.classList.remove("active"));

    const target = evt?.currentTarget || evt?.target || document.querySelector(`.methods button[onclick*="${type}"]`);
    if (target) {
        target.classList.add("active");
    }

    document.getElementById("cardSection").classList.add("hidden");
    document.getElementById("upiSection").classList.add("hidden");
    document.getElementById("walletSection").classList.add("hidden");
    document.getElementById("upiQR").classList.add("hidden");

    if (type === "card") {
        document.getElementById("cardSection").classList.remove("hidden");
    }
    if (type === "upi") {
        document.getElementById("upiSection").classList.remove("hidden");
        document.getElementById("upiQR").classList.remove("hidden");
    }
    if (type === "wallet") {
        document.getElementById("walletSection").classList.remove("hidden");
    }
}

// ----------------------
// Payment success
// ----------------------
function payNow() {
    const bookingId = localStorage.getItem("bookingId");
    const amountValue = document.getElementById("paymentAmount").value;
    const amount = parseFloat(amountValue);
    const upiId = document.querySelector("#upiSection input")?.value.trim();

    if (Number.isNaN(amount) || amount <= 0) {
        alert("Please enter a valid payment amount.");
        return;
    }

    if (method === "upi" && !upiId) {
        alert("Please enter your UPI ID to continue.");
        return;
    }

    alert("Processing Payment...");

    setTimeout(() => {
        fetch(`https://ev-finder-project-production-2026.up.railway.app/api/bookings/${bookingId}/pay`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, method, upiId })
        })
        .then(res => res.json())
        .then(data => {
            localStorage.setItem("paymentType", method.toUpperCase());
            alert(`Payment Successful 🎉\nPaid: ₹${amount.toFixed(2)}`);
            window.location.href = "booking-success.html";
        })
        .catch(err => {
            console.error(err);
            alert("Payment failed!");
        });
    }, 1200);
}
