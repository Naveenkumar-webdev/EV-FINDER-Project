const API_HOST = (window.location && window.location.hostname) ? window.location.hostname : "127.0.0.1";
const BASE_URL = `http://${API_HOST}:8080/api`;

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