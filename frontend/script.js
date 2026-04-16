// ─── Imports (MUST be at top for ES modules) ────────────────────────────────
import { auth } from "/firebase.js";
import { 
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ─── DOM References ──────────────────────────────────────────────────────────
const dropdown        = document.getElementById("role");
const applicantFields = document.getElementById("ApplicantSignUp");
const providerFields  = document.getElementById("ProviderSignUp");

// ─── Area Code Configuration ─────────────────────────────────────────────────
const areaCodes = {
    "+27": 9,
    "+1":  10,
    "+44": 10,
    "+91": 10,
    "+61": 9,
};

// ─── Error Display Helpers ───────────────────────────────────────────────────
function showError(spanId, message) {
    const span = document.getElementById(spanId);
    if (span) {
        span.textContent = message;
        span.classList.add("visible");
    }
}

function clearError(spanId) {
    const span = document.getElementById(spanId);
    if (span) {
        span.textContent = "";
        span.classList.remove("visible");
    }
}

// ─── Validation Logic ────────────────────────────────────────────────────────
function validatePassword(password, email, confirmPassword, passwordSpanId, confirmSpanId) {
    let valid = true;

    if (password.length === 0) {
        clearError(passwordSpanId);
    } else if (password.length <= 8) {
        showError(passwordSpanId, "Password must be more than 8 characters.");
        valid = false;
    } else if (password === email && email.length > 0) {
        showError(passwordSpanId, "Password must not be the same as your email.");
        valid = false;
    } else {
        clearError(passwordSpanId);
    }

    if (confirmPassword.length === 0) {
        clearError(confirmSpanId);
    } else if (password !== confirmPassword) {
        showError(confirmSpanId, "Passwords do not match.");
        valid = false;
    } else {
        clearError(confirmSpanId);
    }

    return valid;
}

function validatePhone(phoneValue, areaCode, phoneSpanId) {
    const requiredDigits = areaCodes[areaCode];
    const digits = phoneValue.trim();

    if (digits.length === 0) { clearError(phoneSpanId); return false; }
    if (!/^\d+$/.test(digits)) {
        showError(phoneSpanId, "Phone number must contain digits only.");
        return false;
    }
    if (digits.length !== requiredDigits) {
        showError(phoneSpanId, `Phone number for ${areaCode} must be exactly ${requiredDigits} digits.`);
        return false;
    }
    clearError(phoneSpanId);
    return true;
}

// ─── Real-Time Listeners: Applicant ──────────────────────────────────────────
const applicantPassword        = document.getElementById("applicantPassword");
const applicantConfirmPassword = document.getElementById("applicantConfirmPassword");
const applicantEmail           = document.getElementById("applicantEmail");
const applicantPhone           = document.getElementById("applicantPhone");
const applicantAreaCode        = document.getElementById("applicantAreaCode");

applicantPassword.addEventListener("input", () => {
    validatePassword(applicantPassword.value, applicantEmail.value,
        applicantConfirmPassword.value, "applicantPasswordError", "applicantConfirmPasswordError");
});
applicantConfirmPassword.addEventListener("input", () => {
    validatePassword(applicantPassword.value, applicantEmail.value,
        applicantConfirmPassword.value, "applicantPasswordError", "applicantConfirmPasswordError");
});
applicantEmail.addEventListener("input", () => {
    if (applicantPassword.value.length > 0) {
        validatePassword(applicantPassword.value, applicantEmail.value,
            applicantConfirmPassword.value, "applicantPasswordError", "applicantConfirmPasswordError");
    }
});
applicantPhone.addEventListener("input", () => {
    validatePhone(applicantPhone.value, applicantAreaCode.value, "applicantPhoneError");
});
applicantAreaCode.addEventListener("change", () => {
    if (applicantPhone.value.length > 0) {
        validatePhone(applicantPhone.value, applicantAreaCode.value, "applicantPhoneError");
    }
});

// ─── Real-Time Listeners: Provider ───────────────────────────────────────────
const providerPassword        = document.getElementById("providerPassword");
const providerConfirmPassword = document.getElementById("providerConfirmPassword");
const providerEmail           = document.getElementById("providerEmail");
const providerPhone           = document.getElementById("providerPhone");
const providerAreaCode        = document.getElementById("providerAreaCode");

providerPassword.addEventListener("input", () => {
    validatePassword(providerPassword.value, providerEmail.value,
        providerConfirmPassword.value, "providerPasswordError", "providerConfirmPasswordError");
});
providerConfirmPassword.addEventListener("input", () => {
    validatePassword(providerPassword.value, providerEmail.value,
        providerConfirmPassword.value, "providerPasswordError", "providerConfirmPasswordError");
});
providerEmail.addEventListener("input", () => {
    if (providerPassword.value.length > 0) {
        validatePassword(providerPassword.value, providerEmail.value,
            providerConfirmPassword.value, "providerPasswordError", "providerConfirmPasswordError");
    }
});
providerPhone.addEventListener("input", () => {
    validatePhone(providerPhone.value, providerAreaCode.value, "providerPhoneError");
});
providerAreaCode.addEventListener("change", () => {
    if (providerPhone.value.length > 0) {
        validatePhone(providerPhone.value, providerAreaCode.value, "providerPhoneError");
    }
});

// ─── Dropdown Toggle ─────────────────────────────────────────────────────────
dropdown.addEventListener("change", () => {
    const selectedValue = dropdown.value;
    if (selectedValue === "Applicant") {
        applicantFields.classList.remove("hidden");
        providerFields.classList.add("hidden");
    } else if (selectedValue === "Provider") {
        providerFields.classList.remove("hidden");
        applicantFields.classList.add("hidden");
    }
});

// ─── Signup Button Click ──────────────────────────────────────────────────────
const signupBtn = document.getElementById("signup-btn");

signupBtn.addEventListener("click", async () => {

    const role = document.getElementById("role").value;

    const email = role === "Applicant"
        ? document.getElementById("applicantEmail").value
        : document.getElementById("providerEmail").value;

    const password = role === "Applicant"
        ? document.getElementById("applicantPassword").value
        : document.getElementById("providerPassword").value;

    const confirmPassword = role === "Applicant"
        ? document.getElementById("applicantConfirmPassword").value
        : document.getElementById("providerConfirmPassword").value;

    // ── Validate before doing anything ───────────────────────────────────────
    if (!email || !password) {
        alert("Please fill in your email and password.");
        return;
    }
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }
    if (password.length <= 8) {
        alert("Password must be more than 8 characters.");
        return;
    }

    // ── Check if coming from Google login (already authenticated) ────────────
    let user = auth.currentUser;

    // ── If NOT Google user, create Firebase Auth account first ───────────────
    if (!user) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            user = userCredential.user;
            console.log("✅ Firebase Auth user created:", user.uid);
        } catch (error) {
            console.error("Firebase Auth Error:", error.code);
            if (error.code === "auth/email-already-in-use") {
                alert("An account with this email already exists.");
            } else if (error.code === "auth/invalid-email") {
                alert("Please enter a valid email address.");
            } else if (error.code === "auth/weak-password") {
                alert("Password is too weak. Use at least 9 characters.");
            } else {
                alert("Account creation failed: " + error.message);
            }
            return;
        }
    }

    // ── Get REAL uid from Firebase — NOT hardcoded ────────────────────────────
    const uid   = user.uid; // ✅ unique per user e.g. "abc123xyz"
    const token = await user.getIdToken();
    localStorage.setItem("token", token);

    console.log("✅ Signing up with real Firebase UID:", uid);

    // ── Build payload ─────────────────────────────────────────────────────────
    let endpoint = "";
    let payload  = {};

    if (role === "Applicant") {
        endpoint = "/signup/applicant";
        payload  = {
            uid,         // ✅ real UID — creates unique Firestore document
            firstname:   document.getElementById("firstName").value,
            lastname:    document.getElementById("lastName").value,
            email,
            username:    document.getElementById("username").value,
            institution: document.getElementById("institution").value,
            city:        document.getElementById("city").value,
            phonenumber: document.getElementById("applicantAreaCode").value +
                         document.getElementById("applicantPhone").value,
            cv:          ""
        };
    } else if (role === "Provider") {
        endpoint = "/signup/provider";
        payload  = {
            uid,         // ✅ real UID — creates unique Firestore document
            organization: document.getElementById("org").value,
            email,
            city:         document.getElementById("orgCity").value,
            phonenumber:  document.getElementById("providerAreaCode").value +
                          document.getElementById("providerPhone").value,
            username:     document.getElementById("orgUsername").value
        };
    }

    // ── POST to backend ───────────────────────────────────────────────────────
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Firestore document created for UID:", uid);
            document.getElementById("successConfirm").classList.remove("hidden");

            // Force token refresh to get new role claim from backend
            await user.getIdToken(true);
            const idTokenResult = await user.getIdTokenResult();
            const userRole = idTokenResult.claims.role;

            console.log("✅ Role assigned:", userRole);

            setTimeout(() => {
                if (userRole === "applicant")     window.location.href = "/applicant-home";
                else if (userRole === "provider") window.location.href = "/provider-home";
                else if (userRole === "admin")    window.location.href = "/admin-dashboard";
                else alert("Role not assigned. Please contact support.");
            }, 1500);

        } else {
            alert("Signup failed: " + data.error);
        }

    } catch (error) {
        console.error("Signup POST error:", error);
        alert("Could not reach server. Is your backend running?");
    }
});