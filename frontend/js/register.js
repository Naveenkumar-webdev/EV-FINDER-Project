// ==========================
// EV Finder Register
// ==========================

document.getElementById("registerForm").addEventListener("submit", startRegistration);
document.getElementById("cancelOtpBtn").addEventListener("click", hideOtpModal);
document.getElementById("otpForm").addEventListener("submit", verifyOtpAndCompleteRegister);
document.getElementById("role").addEventListener("change", toggleVehicleField);

let pendingUserData = null; // Store form data temporarily until OTP is verified

function showOtpModal(phone, email) {
    document.getElementById("otpPhoneDisplay").innerText = email; // Show email address in the modal
    document.getElementById("otpModal").style.display = "flex";
    document.getElementById("otpCode").value = "";
    document.getElementById("otpCode").focus();
}

function hideOtpModal() {
    document.getElementById("otpModal").style.display = "none";
    pendingUserData = null;
}

function toggleVehicleField() {
    const role = document.getElementById("role").value;
    const vehicleBox = document.getElementById("vehicleBox");
    const vehicleTypeBox = document.getElementById("vehicleTypeBox");
    const vehicleInput = document.getElementById("vehicleNumber");

    if (role === "ADMIN") {
        vehicleBox.style.display = "none";
        if (vehicleTypeBox) vehicleTypeBox.style.display = "none";
        vehicleInput.required = false;
        vehicleInput.value = "";
    } else {
        vehicleBox.style.display = "block";
        if (vehicleTypeBox) vehicleTypeBox.style.display = "block";
        vehicleInput.required = true;
    }
}

async function startRegistration(e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const role = document.getElementById("role").value;
    const vehicleNumber = role === "ADMIN" ? "ADMIN" : document.getElementById("vehicleNumber").value.toUpperCase().trim();
    const vehicleTypeElem = document.getElementById("vehicleType");
    const vehicleType = vehicleTypeElem ? vehicleTypeElem.value : "Car";
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Validation
    if (name === "" ||
        email === "" ||
        phone === "" ||
        (role !== "ADMIN" && vehicleNumber === "") ||
        password === "" ||
        confirmPassword === "") {

        alert("Please fill all fields.");
        return;
    }

    if (phone.length !== 10 || isNaN(phone)) {
        alert("Enter a valid 10-digit phone number.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    // Check if email or mobile number is already registered
    try {
        const checkResponse = await fetch(`https://ev-finder-backend-production.up.railway.app/api/users/check-exists?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
        if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            if (checkData.exists) {
                alert(checkData.message);
                window.location.href = "login.html";
                return;
            }
        }
    } catch (error) {
        console.error("Duplicate check error:", error);
    }

    // Store user data temporarily
    pendingUserData = {
        fullName: name,
        email: email,
        phone: phone,
        vehicleNumber: vehicleNumber,
        vehicleType: vehicleType,
        password: password,
        role: role
    };

    // Send OTP request to backend (emails the code via Gmail SMTP)
    const submitBtn = e.target.querySelector("button[type='submit']");
    const originalText = submitBtn.innerText;
    submitBtn.disabled = true;
    submitBtn.innerText = "Sending OTP...";

    try {
        const response = await fetch(`https://ev-finder-backend-production.up.railway.app/api/users/register/send-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ phone: phone, email: email })
        });

        if (!response.ok) {
            const errorMsg = await response.text();
            alert("Error: " + errorMsg);
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
            return;
        }

        // Show the verification modal
        showOtpModal(phone, email);
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
        alert("An OTP code has been sent to your email address (" + email + "). Please check your inbox.");
    } catch (error) {
        console.error("OTP send error:", error);
        alert("Failed to connect to backend server. Make sure it's running.");
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
}

async function verifyOtpAndCompleteRegister(e) {
    e.preventDefault();

    const otpCode = document.getElementById("otpCode").value.trim();
    if (!otpCode || otpCode.length < 4) {
        alert("Please enter a valid OTP.");
        return;
    }

    if (!pendingUserData) {
        alert("Registration context lost. Please try again.");
        hideOtpModal();
        return;
    }

    const verifyBtn = e.target.querySelector("button[type='submit']");
    verifyBtn.disabled = true;
    verifyBtn.innerText = "Verifying...";

    try {
        const verifyResponse = await fetch(`https://ev-finder-backend-production.up.railway.app/api/users/verify-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                phone: pendingUserData.phone,
                otp: otpCode
            })
        });

        if (!verifyResponse.ok) {
            const errorMsg = await verifyResponse.text();
            alert("Verification Failed: " + errorMsg);
            verifyBtn.disabled = false;
            verifyBtn.innerText = "Verify & Register";
            return;
        }

        const registerResponse = await fetch(`https://ev-finder-backend-production.up.railway.app/api/users/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(pendingUserData)
        });

        const result = await registerResponse.text();

        if (!registerResponse.ok) {
            alert("Registration Failed\n\n" + result);
            verifyBtn.disabled = false;
            verifyBtn.innerText = "Verify & Register";
            return;
        }

        alert("Registration Successful!");
        hideOtpModal();
        window.location.href = "login.html";
    } catch (error) {
        console.error("Verification/Registration error:", error);
        alert("Connection interface error. Please check backend status.");
        verifyBtn.disabled = false;
        verifyBtn.innerText = "Verify & Register";
    }
}