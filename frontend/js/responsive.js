// ======================================================
// EV Finder - Mobile Navigation & Responsive Helper JS
// ======================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Setup Mobile Header & Sidebar Drawer for Dashboard Pages
    const sidebar = document.querySelector(".sidebar");
    const container = document.querySelector(".container");

    if (sidebar && container) {
        // Check if mobile header already exists
        if (!document.querySelector(".mobile-header")) {
            const mobileHeader = document.createElement("div");
            mobileHeader.className = "mobile-header";
            mobileHeader.innerHTML = `
                <button class="mobile-menu-toggle" id="mobileMenuBtn" aria-label="Toggle navigation">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <a href="layout.html" class="mobile-logo">
                    <i class="fa-solid fa-bolt"></i>
                    <span>EV Finder</span>
                </a>
            `;
            document.body.insertBefore(mobileHeader, document.body.firstChild);
        }

        // Overlay element for background click
        let overlay = document.querySelector(".mobile-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.className = "mobile-overlay";
            document.body.appendChild(overlay);
        }

        const menuBtn = document.getElementById("mobileMenuBtn");

        function toggleMobileSidebar() {
            const isActive = sidebar.classList.contains("mobile-active");
            if (isActive) {
                sidebar.classList.remove("mobile-active");
                overlay.classList.remove("active");
                if (menuBtn) menuBtn.innerHTML = `<i class="fa-solid fa-bars"></i>`;
            } else {
                sidebar.classList.add("mobile-active");
                overlay.classList.add("active");
                if (menuBtn) menuBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
            }
        }

        if (menuBtn) {
            menuBtn.addEventListener("click", toggleMobileSidebar);
        }
        if (overlay) {
            overlay.addEventListener("click", toggleMobileSidebar);
        }

        // Close sidebar when clicking any navigation link
        const sidebarLinks = sidebar.querySelectorAll("a");
        sidebarLinks.forEach(link => {
            link.addEventListener("click", function () {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove("mobile-active");
                    overlay.classList.remove("active");
                    if (menuBtn) menuBtn.innerHTML = `<i class="fa-solid fa-bars"></i>`;
                }
            });
        });
    }

    // 2. Setup Hamburger Menu for Top Navbar Pages (e.g. index.html)
    const navbar = document.querySelector(".navbar");
    if (navbar && !sidebar) {
        const navLinks = navbar.querySelector(".nav-links");
        if (navLinks && !navbar.querySelector(".mobile-nav-toggle")) {
            const toggleBtn = document.createElement("button");
            toggleBtn.className = "mobile-menu-toggle mobile-nav-toggle";
            toggleBtn.innerHTML = `<i class="fa-solid fa-bars"></i>`;
            toggleBtn.style.marginRight = "14px";
            toggleBtn.style.marginLeft = "0";
            
            navbar.insertBefore(toggleBtn, navbar.firstChild);

            toggleBtn.addEventListener("click", function () {
                const isOpen = navLinks.classList.contains("mobile-open");
                if (isOpen) {
                    navLinks.classList.remove("mobile-open");
                    toggleBtn.innerHTML = `<i class="fa-solid fa-bars"></i>`;
                } else {
                    navLinks.classList.add("mobile-open");
                    toggleBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
                }
            });
        }
    }

    // 3. Setup Hamburger Menu for Header Pages (e.g. admin-stations.html)
    const headerElem = document.querySelector("header");
    if (headerElem && !sidebar && !navbar) {
        const headerNavLinks = headerElem.querySelector(".nav-links");
        if (headerNavLinks && !headerElem.querySelector(".mobile-nav-toggle")) {
            const toggleBtn = document.createElement("button");
            toggleBtn.className = "mobile-menu-toggle mobile-nav-toggle";
            toggleBtn.innerHTML = `<i class="fa-solid fa-bars"></i>`;
            toggleBtn.style.marginRight = "14px";
            toggleBtn.style.marginLeft = "0";

            headerElem.insertBefore(toggleBtn, headerElem.firstChild);

            toggleBtn.addEventListener("click", function () {
                const isOpen = headerNavLinks.classList.contains("mobile-open");
                if (isOpen) {
                    headerNavLinks.classList.remove("mobile-open");
                    toggleBtn.innerHTML = `<i class="fa-solid fa-bars"></i>`;
                } else {
                    headerNavLinks.classList.add("mobile-open");
                    toggleBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
                }
            });
        }
    }

    // 4. Register PWA Service Worker for Native Mobile App Behavior & Offline Support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(function (registration) {
            console.log('[EV Finder PWA] ServiceWorker registered with scope:', registration.scope);
        }).catch(function (error) {
            console.log('[EV Finder PWA] ServiceWorker registration failed:', error);
        });
    }
});
