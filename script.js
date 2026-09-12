// ============================
// HAMBURGER MENU (mobile nav)
// ============================

function toggleMenu() {
    const menu = document.getElementById("hamburgerMenu");
    const icon = document.getElementById("menuIcon");

    menu.classList.toggle("active");

    if (menu.classList.contains("active")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-xmark");
    } else {
        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");
    }
}

function closeMenu() {
    const menu = document.getElementById("hamburgerMenu");
    const icon = document.getElementById("menuIcon");

    if (menu && menu.classList.contains("active")) {
        menu.classList.remove("active");
        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const menu = document.getElementById("hamburgerMenu");
    const hamburgerBtn = document.querySelector(".hamburger");

    if (!menu) return;

    // Close the menu when any link inside it is tapped
    menu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    // Close the menu when tapping anywhere outside it
    document.addEventListener("click", (e) => {
        const clickedInsideMenu = menu.contains(e.target);
        const clickedHamburgerBtn = hamburgerBtn && hamburgerBtn.contains(e.target);

        if (!clickedInsideMenu && !clickedHamburgerBtn) {
            closeMenu();
        }
    });
});

// Close mobile menu automatically if the screen expands back to desktop size
window.addEventListener("resize", () => {
    if (window.innerWidth > 800) {
        closeMenu();
    }
});