import { auth } from "/firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loginBtn = document.querySelector(".login");

loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.querySelector("input[name='username']").value;
    const password = document.querySelector("input[name='password']").value;

    if (!email || !password) {
        alert("Please enter your email and password.");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Force refresh to get latest role claim
        await user.getIdToken(true);
        const idTokenResult = await user.getIdTokenResult();
        const role = idTokenResult.claims.role;

        const token = await user.getIdToken();
        localStorage.setItem("token", token);

        console.log("Logged in as:", role);

        // Redirect based on role
        if (role === "applicant")      window.location.href = "/listings";
        else if (role === "provider")  window.location.href = "/provider-home";
        else if (role === "admin")     window.location.href = "/admin-dashboard";
        else {
            alert("No role assigned to this account. Please contact support.");
        }

    } catch (error) {
        console.error("Login error:", error.code);

        // User-friendly error messages
        if (error.code === "auth/user-not-found") {
            alert("No account found with this email.");
        } else if (error.code === "auth/wrong-password") {
            alert("Incorrect password.");
        } else if (error.code === "auth/invalid-email") {
            alert("Please enter a valid email address.");
        } else if (error.code === "auth/too-many-requests") {
            alert("Too many failed attempts. Please try again later.");
        } else {
            alert("Login failed: " + error.message);
        }
    }
});