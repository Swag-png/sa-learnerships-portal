import { auth } from "/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Map each protected page to its allowed role
const routeRoles = {
    "/applicant-home":  "applicant",
    "/provider-home":   "provider",
    "/admin-dashboard": "admin"
};

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Not logged in — send to login
        window.location.href = "/";
        return;
    }

    // Force refresh to get latest claims
    const idTokenResult = await user.getIdTokenResult(true);
    const role = idTokenResult.claims.role;

    // Get current page path e.g. "/applicant-home"
    const currentPath = window.location.pathname;
    const allowedRole = routeRoles[currentPath];

    if (role !== allowedRole) {
        // Wrong role for this page
        window.location.href = "/";
        return;
    }

    // ✅ Correct role — stay on page, update token in storage
    const token = await user.getIdToken(true);
    localStorage.setItem("token", token);
});