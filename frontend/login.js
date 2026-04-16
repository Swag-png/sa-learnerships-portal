import { auth } from "./firebase.js";
import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const provider = new GoogleAuthProvider();
const googleBtn = document.getElementById("google-login-btn");

googleBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const token = await user.getIdToken();
        localStorage.setItem("token", token);

        // Force refresh to get latest claims
        await user.getIdToken(true);
        const idTokenResult = await user.getIdTokenResult();
        const role = idTokenResult.claims.role;

        if (role === "applicant")     window.location.href = "/applicant-home";
        else if (role === "provider") window.location.href = "/provider-home";
        else if (role === "admin")    window.location.href = "/admin-dashboard";
        else                          window.location.href = "/signup.html"; // New user

    } catch (error) {
        console.error("Google Login Error:", error);
        alert("Login failed: " + error.message);
    }
});