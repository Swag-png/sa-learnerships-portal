const dropdown = document.getElementById("role");
const applicantFields = document.getElementById("ApplicantSignUp");
const providerFields  = document.getElementById("ProviderSignUp");

// ─── Area Code Configuration ────────────────────────────────────────────────
const areaCodes = {
    "+27": 9,
    "+1":  10,
    "+44": 10,
    "+91": 10,
    "+61": 9,
};


// ─── Error Display Helpers ──────────────────────────────────────────────────
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


// ─── Validation Logic ───────────────────────────────────────────────────────
function validatePassword(password, email, confirmPassword, passwordSpanId, confirmSpanId) {
    let valid = true;

    // Password length
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

    // Confirm password match
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

    if (digits.length === 0) {
        clearError(phoneSpanId);
        return false;
    }
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


// ─── Real-Time Listeners: Applicant ─────────────────────────────────────────
const applicantPassword        = document.getElementById("applicantPassword");
const applicantConfirmPassword = document.getElementById("applicantConfirmPassword");
const applicantEmail           = document.getElementById("applicantEmail");
const applicantPhone           = document.getElementById("applicantPhone");
const applicantAreaCode        = document.getElementById("applicantAreaCode");

applicantPassword.addEventListener("input", () => {
    validatePassword(
        applicantPassword.value,
        applicantEmail.value,
        applicantConfirmPassword.value,
        "applicantPasswordError",
        "applicantConfirmPasswordError"
    );
});

applicantConfirmPassword.addEventListener("input", () => {
    validatePassword(
        applicantPassword.value,
        applicantEmail.value,
        applicantConfirmPassword.value,
        "applicantPasswordError",
        "applicantConfirmPasswordError"
    );
});

// Re-check password when email changes (in case password === email)
applicantEmail.addEventListener("input", () => {
    if (applicantPassword.value.length > 0) {
        validatePassword(
            applicantPassword.value,
            applicantEmail.value,
            applicantConfirmPassword.value,
            "applicantPasswordError",
            "applicantConfirmPasswordError"
        );
    }
});

applicantPhone.addEventListener("input", () => {
    validatePhone(applicantPhone.value, applicantAreaCode.value, "applicantPhoneError");
});

// Re-validate phone if area code changes
applicantAreaCode.addEventListener("change", () => {
    if (applicantPhone.value.length > 0) {
        validatePhone(applicantPhone.value, applicantAreaCode.value, "applicantPhoneError");
    }
});


// ─── Real-Time Listeners: Provider ──────────────────────────────────────────
const providerPassword        = document.getElementById("providerPassword");
const providerConfirmPassword = document.getElementById("providerConfirmPassword");
const providerEmail           = document.getElementById("providerEmail");
const providerPhone           = document.getElementById("providerPhone");
const providerAreaCode        = document.getElementById("providerAreaCode");

providerPassword.addEventListener("input", () => {
    validatePassword(
        providerPassword.value,
        providerEmail.value,
        providerConfirmPassword.value,
        "providerPasswordError",
        "providerConfirmPasswordError"
    );
});

providerConfirmPassword.addEventListener("input", () => {
    validatePassword(
        providerPassword.value,
        providerEmail.value,
        providerConfirmPassword.value,
        "providerPasswordError",
        "providerConfirmPasswordError"
    );
});

providerEmail.addEventListener("input", () => {
    if (providerPassword.value.length > 0) {
        validatePassword(
            providerPassword.value,
            providerEmail.value,
            providerConfirmPassword.value,
            "providerPasswordError",
            "providerConfirmPasswordError"
        );
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


// ─── Dropdown Toggle ────────────────────────────────────────────────────────
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

