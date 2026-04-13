// =============================================
// FIREBASE CONFIG
// =============================================
const firebaseConfig = {
    apiKey:            "AIzaSyA_qL7fXWl5J1-cIlCrPzffOVknIwxeptc",
    authDomain:        "sd5-project-77355.firebaseapp.com",
    projectId:         "sd5-project-77355",
    storageBucket:     "sd5-project-77355.firebasestorage.app",
    messagingSenderId: "319688735002",
    appId:             "1:319688735002:web:1dc151bd0b44e8a22f94a3"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// =============================================
// SHOW / HIDE ERROR
// =============================================
function showError(message) {
    const errorMsg         = document.getElementById("errorMsg");
    errorMsg.innerText     = message;
    errorMsg.style.display = "block";
}

function hideError() {
    const errorMsg         = document.getElementById("errorMsg");
    errorMsg.style.display = "none";
}

// =============================================
// SEND TOKEN TO BACKEND
// =============================================
async function sendTokenToBackend(user) {
    const token = await user.getIdToken();

    try {
        const response = await fetch("http://localhost:3000/login", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ token })
        });

        const data = await response.json();

        if (response.ok) {
    localStorage.setItem("sessionToken",    data.sessionToken);
    localStorage.setItem("userEmail",       data.email);
    localStorage.setItem("userName",        data.name);
    localStorage.setItem("userRole",        data.role);
    localStorage.setItem("userUsername",    data.username    || "");
    localStorage.setItem("userCity",        data.city        || "");
    localStorage.setItem("userPhone",       data.phone       || "");
    localStorage.setItem("userStatus",      data.status      || "");
    localStorage.setItem("userLocation",    data.location    || "");
    localStorage.setItem("userVerified",    data.verified    || "false");
    localStorage.setItem("userProviderId",  data.providerId  || "");
    localStorage.setItem("userPermissions", data.permissions || "");

    // Redirect based on role
    if (data.role === "admin") {
        window.location.href = "adminDashboard.html";
    } else if (data.role === "provider") {
        window.location.href = "providerDashboard.html";
    } else {
        window.location.href = "applicantDashboard.html";
    }
        }

    } catch (error) {
        showError("Cannot connect to server. Make sure backend is running.");
    }
}

// =============================================
// EMAIL / PASSWORD LOGIN
// =============================================
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const email    = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value;

    // Check empty fields
    if (!email && !password ) {
        showError("Please enter your email and password.");
        return;
    }
    else if(!email ){
        showError("Please enter your email.");
        return;
    }
    else if(!password){
         showError("Please enter your password.");
        return;
    }

    try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        await sendTokenToBackend(result.user);
    } catch (error) {
        handleFirebaseError(error);
    }
});

// =============================================
// GOOGLE LOGIN
// =============================================
document.getElementById("googleBtn").addEventListener("click", async () => {
    hideError();
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result   = await auth.signInWithPopup(provider);
        await sendTokenToBackend(result.user);
    } catch (error) {
        handleFirebaseError(error);
    }
});

// =============================================
// GITHUB LOGIN
// =============================================
document.getElementById("githubBtn").addEventListener("click", async () => {
    hideError();
    try {
        const provider = new firebase.auth.GithubAuthProvider();
        const result   = await auth.signInWithPopup(provider);
        await sendTokenToBackend(result.user);
    } catch (error) {
        handleFirebaseError(error);
    }
});

// =============================================
// FACEBOOK LOGIN
// =============================================
document.getElementById("facebookBtn").addEventListener("click", async () => {
    hideError();
    try {
        const provider = new firebase.auth.FacebookAuthProvider();
        const result   = await auth.signInWithPopup(provider);
        await sendTokenToBackend(result.user);
    } catch (error) {
        handleFirebaseError(error);
    }
});

// =============================================
// FIREBASE ERROR HANDLER
// =============================================
function handleFirebaseError(error) {
    console.error(error);
    const messages = {
        "auth/user-not-found":                           "No account found with this email.",
        "auth/wrong-password":                           "Incorrect password.",
        "auth/invalid-email":                            "Invalid email address.",
        "auth/invalid-credential":                       "Invalid email or password.",
        "auth/too-many-requests":                        "Too many attempts. Try again later.",
        "auth/popup-closed-by-user":                     "Login cancelled.",
        "auth/network-request-failed":                   "Network error. Check your connection.",
        "auth/account-exists-with-different-credential": "Account exists with a different provider.",
    };
    showError(messages[error.code] || "Login failed: " + error.message);
}

// =============================================
// AUTO SESSION CHECK
// =============================================
window.onload = () => {
    const token = localStorage.getItem("sessionToken");
    if (token) {
        const role = localStorage.getItem("userRole");
        if (role === "admin") {
            window.location.href = "adminDashboard.html";
        } else if (role === "provider") {
            window.location.href = "providerDashboard.html";
        } else {
            window.location.href = "applicantDashboard.html";
        }
    }
};