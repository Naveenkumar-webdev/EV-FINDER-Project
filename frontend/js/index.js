document.addEventListener("DOMContentLoaded", () => {
    const isLoggedIn = !!localStorage.getItem("loggedUser");

    document.querySelectorAll("a[data-requires-auth='true']").forEach((link) => {
        link.addEventListener("click", (event) => {
            if (!isLoggedIn) {
                event.preventDefault();
                const targetUrl = link.getAttribute("href");
                localStorage.setItem("redirectAfterLogin", targetUrl);
                window.location.href = "login.html";
            }
        });
    });
});
