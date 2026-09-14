// ==========================
// EV Finder Login
// ==========================

document.getElementById("loginForm").addEventListener("submit", loginUser);

async function loginUser(e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (email === "" || password === "") {
        alert("Please enter email and password.");
        return;
    }

    const loginData = {
        email: email,
        password: password
    };

    try {
        const response = await fetch("https://ev-finder-backend-production.up.railway.app/api/users/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(loginData)

        });

        console.log("Status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            alert(errorText);
            return;
        }

        // Parse as JSON instead of storing raw text
        const user = await response.json();

        console.log("Response:", user);

        // Store the user object under "loggedUser" for consistency
        localStorage.setItem("loggedUser", JSON.stringify(user));

        alert("Login Successful");

        let redirectUrl = "layout.html";
        if (user.role && user.role.toUpperCase() === "ADMIN") {
            redirectUrl = "admin-stations.html";
        }

        const customRedirect = localStorage.getItem("redirectAfterLogin");
        if (customRedirect) {
            redirectUrl = customRedirect;
            localStorage.removeItem("redirectAfterLogin");
        }

        window.location.href = redirectUrl;

    }
    catch (error) {

        console.error(error);

        alert("Server Connection Failed");

    }

}
