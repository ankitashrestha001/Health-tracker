
/* ==============================
   DASHBOARD JAVASCRIPT
============================== */

document.addEventListener("DOMContentLoaded", function () {

    const currentUser = JSON.parse(
        localStorage.getItem("healthtracker_currentUser")
    );

    // Check whether user is logged in
    if (window.location.pathname.endsWith("dashboard.html")) {

        if (!currentUser) {
            window.location.href = "login.html";
            return;
        }

        // Display user's name
        document.getElementById("userName").textContent =
            currentUser.name || "User";

        // Get today's date
        const today = new Date().toISOString().split("T")[0];

        // Get saved daily health records
        const healthRecords = JSON.parse(
            localStorage.getItem("healthtracker_healthRecords")
        ) || {};

        const todayRecord = healthRecords[currentUser.email]?.[today] || {};

        // Display steps
        document.getElementById("dashboardSteps").textContent =
            todayRecord.steps ?? 0;

        

        // Display Body Mass Index
        document.getElementById("dashboardBody Mass Index").textContent =
            todayRecord.Body Mass Index ?? 0;

        // Display blood pressure
        const bp = todayRecord.bloodPressure;

        document.getElementById("dashboardBP").textContent =
            bp || "Not recorded";
    }

    // User logout
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.removeItem("healthtracker_currentUser");
            window.location.href = "login.html";
        });
    }

});
