
/* =================================
   COMMON FUNCTIONS
================================= */

const USERS_KEY = "healthtracker_users";
const CURRENT_USER_KEY = "healthtracker_currentUser";
const ADMIN_KEY = "healthtracker_admin";

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function showMessage(id, message, type) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = message;
        element.className = "message " + type;
    }
}

/* =================================
   SIGNUP PAGE
================================= */

const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim().toLowerCase();
        const age = Number(document.getElementById("signupAge").value);
        const password = document.getElementById("signupPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password.length < 6) {
            showMessage(
                "signupMessage",
                "Password must contain at least 6 characters.",
                "error"
            );
            return;
        }

        if (password !== confirmPassword) {
            showMessage(
                "signupMessage",
                "Passwords do not match.",
                "error"
            );
            return;
        }

        const users = getUsers();

        const existingUser = users.find(user => user.email === email);

        if (existingUser) {
            showMessage(
                "signupMessage",
                "Email is already registered.",
                "error"
            );
            return;
        }

        const newUser = {
            id: Date.now(),
            name: name,
            email: email,
            age: age,
            password: password,
            status: "Active",
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        showMessage(
            "signupMessage",
            "Registration successful! Redirecting to login...",
            "success"
        );

        signupForm.reset();

        setTimeout(function () {
            window.location.href = "login.html";
        }, 1200);
    });
}

/* =================================
   USER LOGIN PAGE
================================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value;

        const users = getUsers();

        const user = users.find(function (item) {
            return item.email === email &&
                   item.password === password;
        });

        if (!user) {
            showMessage(
                "loginMessage",
                "Invalid email or password.",
                "error"
            );
            return;
        }

        if (user.status !== "Active") {
            showMessage(
                "loginMessage",
                "Your account is inactive.",
                "error"
            );
            return;
        }

        localStorage.setItem(
            CURRENT_USER_KEY,
            JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email,
                age: user.age
            })
        );

        window.location.href = "dashboard.html";
    });
}

/* =================================
   ADMIN LOGIN PAGE
================================= */

const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("adminEmail").value.trim().toLowerCase();
        const password = document.getElementById("adminPassword").value;

        const adminEmail = "admin@healthtracker.com";
        const adminPassword = "HealthAdmin123";

        if (email === adminEmail && password === adminPassword) {

            localStorage.setItem(ADMIN_KEY, "true");

            window.location.href = "admin-dashboard.html";

        } else {
            showMessage(
                "adminLoginMessage",
                "Invalid admin email or password.",
                "error"
            );
        }
    });
}

/* =================================
   USER LOGOUT
================================= */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
        localStorage.removeItem(CURRENT_USER_KEY);
        window.location.href = "login.html";
    });
}

/* =================================
   ADMIN LOGOUT
================================= */

const adminLogoutBtn = document.getElementById("adminLogoutBtn");

if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", function () {
        localStorage.removeItem(ADMIN_KEY);
        window.location.href = "admin-login.html";
    });
}
