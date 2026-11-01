/* DEKKO GLOBAL THEME CONTROLLER */
(function () {
    "use strict";

    const KEY = "dekkoDisplayTheme";

    function getTheme() {
        try {
            return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
        } catch (e) {
            return "light";
        }
    }

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;

        const button = document.getElementById("dekkoThemeToggle");
        if (!button) return;

        button.textContent = theme === "dark" ? "☀ Light Mode" : "☾ Dark Mode";
        button.setAttribute("aria-label",
            theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode");
        button.setAttribute("aria-pressed", String(theme === "dark"));
    }

    function initTheme() {
        const button = document.getElementById("dekkoThemeToggle");
        if (!button) {
            console.error("Dekko theme button was not found.");
            return;
        }

        applyTheme(getTheme());

        button.addEventListener("click", function () {
            const next = getTheme() === "dark" ? "light" : "dark";

            try {
                localStorage.setItem(KEY, next);
            } catch (e) {
                console.warn("Theme preference could not be saved.", e);
            }

            applyTheme(next);
        });
    }

    initTheme();
})();
