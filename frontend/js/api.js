// Dynamic Backend API Base URL Resolver
function getApiBaseUrl() {
    if (window.CONFIG && window.CONFIG.API_URL) {
        return window.CONFIG.API_URL;
    }
    const host = (window.location && window.location.hostname) ? window.location.hostname : "127.0.0.1";
    
    // Local development (direct to Spring Boot on port 8080)
    if (host === "localhost" || host === "127.0.0.1") {
        return "http://127.0.0.1:8080/api";
    }
    
    // Production / Railway domain (uses origin + /api proxied via server)
    return `${window.location.origin}/api`;
}

const BASE_URL = getApiBaseUrl();
window.BASE_URL = BASE_URL;
window.getApiBaseUrl = getApiBaseUrl;

async function makeApiRequest(endpoint, method = "GET", data = null) {
    const config = {
        method: method,
        headers: {
            "Content-Type": "application/json"
        }
    };

    const token = localStorage.getItem("token");
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }

    if (data && (method === "POST" || method === "PUT")) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Server responded with status ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Connection Interface Error:", error);
        throw error;
    }
}