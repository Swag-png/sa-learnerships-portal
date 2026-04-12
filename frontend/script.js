import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const dropdown = document.getElementById("role");
const applicantFields = document.getElementById("ApplicantSignUp");
const providerFields = document.getElementById("ProviderSignUp");

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


function setError(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    if (visible) {
        el.classList.add("show");
    } else {
        el.classList.remove("show");
    }
}


function isEmpty(value) {
    return !value || value.trim() === "";
}


function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}


function isValidPhone(value) {
    return /^\d{10}$/.test(value);
}


function isValidPassword(value) {
    return value.length >= 8;
}


function validateApplicant() {
    let valid = true;

    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const email = document.getElementById("applicantEmail").value;
    const username = document.getElementById("username").value;
    const institution = document.getElementById("institution").value;
    const city = document.getElementById("city").value;
    const phone = document.getElementById("phoneNumber").value;
    //const cv = document.getElementById("cv").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    
    const fnameEmpty = isEmpty(firstName);
    setError("errorFname", fnameEmpty);
    if (fnameEmpty) valid = false;

   
    const lnameEmpty = isEmpty(lastName);
    setError("errorLname", lnameEmpty);
    if (lnameEmpty) valid = false;

   
    const emailInvalid = isEmpty(email) || !isValidEmail(email);
    setError("errorEmail", emailInvalid);
    if (emailInvalid) valid = false;

    
    const usernameEmpty = isEmpty(username);
    setError("errorUsername", usernameEmpty);
    if (usernameEmpty) valid = false;

   
    const instEmpty = isEmpty(institution);
    setError("errorInst", instEmpty);
    if (instEmpty) valid = false;


    const cityEmpty = isEmpty(city);
    setError("errorCity", cityEmpty);
    if (cityEmpty) valid = false;

   
    const phoneInvalid = !isValidPhone(phone);
    setError("errorPhone", phoneInvalid);
    if (phoneInvalid) valid = false;

    
    /*const cvEmpty = isEmpty(cv);
    setError("errorCv", cvEmpty);
    if (cvEmpty) valid = false;*/

   
    const passWeak = !isValidPassword(password);
    if (passWeak) {
        document.getElementById("errorPass").textContent = "Password must be at least 8 characters";
        setError("errorPass", true);
        valid = false;
    } else {
        setError("errorPass", false);
    }

    
    const passMismatch = isEmpty(confirmPassword) || password !== confirmPassword;
    if (passMismatch) {
        document.getElementById("errorConfPass").textContent =
            isEmpty(confirmPassword) ? "Please confirm your password" : "Passwords do not match";
        setError("errorConfPass", true);
        valid = false;
    } else {
        setError("errorConfPass", false);
    }

    return valid;
}


function validateProvider() {
    let valid = true;

    const username = document.getElementById("orgusername").value;
    const org = document.getElementById("org").value;
    const city = document.getElementById("orgcity").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("orgphoneNumber").value;
    const password = document.getElementById("provider-password").value;
    const confirmPassword = document.getElementById("provider-confirm-password").value;

   
    const usernameEmpty = isEmpty(username);
    setError("errorPUName", usernameEmpty);
    if (usernameEmpty) valid = false;

    
    const orgEmpty = isEmpty(org);
    setError("errorOrg", orgEmpty);
    if (orgEmpty) valid = false;

    
    const cityEmpty = isEmpty(city);
    setError("errorPCity", cityEmpty);
    if (cityEmpty) valid = false;

    
    const emailInvalid = isEmpty(email) || !isValidEmail(email);
    setError("errorPEmail", emailInvalid);
    if (emailInvalid) valid = false;

   
    const phoneInvalid = !isValidPhone(phone);
    setError("errorPNumber", phoneInvalid);
    if (phoneInvalid) valid = false;

  
    const passWeak = !isValidPassword(password);
    if (passWeak) {
        document.getElementById("errorPPass").textContent = "Password must be at least 8 characters";
        setError("errorPPass", true);
        valid = false;
    } else {
        setError("errorPPass", false);
    }

   
    const passMismatch = isEmpty(confirmPassword) || password !== confirmPassword;
    if (passMismatch) {
        document.getElementById("errorPConfPass").textContent =
            isEmpty(confirmPassword) ? "Please confirm your password" : "Passwords do not match";
        setError("errorPConfPass", true);
        valid = false;
    } else {
        setError("errorPConfPass", false);
    }

    return valid;
}


const signUpBtn = document.getElementById("signup-btn");
signUpBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    //const file = document.getElementById("cv").files[0];

    const role = dropdown.value;
    let isValid = false;

    if (role === "Applicant") {
        isValid = validateApplicant();
    } else if (role === "Provider") {
        isValid = validateProvider();
    }

    if (!isValid) return;

    try {
        const email = role === "Applicant"
        ? document.getElementById("applicantEmail").value
        : document.getElementById("email").value;

        const password = role === "Applicant"
        ? document.getElementById("password").value
        : document.getElementById("provider-password").value;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        if (role === "Applicant") {
            const formData = new FormData();
            formData.append("uid",uid);
            //formData.append("cv", file);
            formData.append("firstname", document.getElementById("firstName").value);
            formData.append("lastname", document.getElementById("lastName").value)
            formData.append("email", document.getElementById("applicantEmail").value);
            formData.append("username", document.getElementById("username").value);
            formData.append("institution", document.getElementById("institution").value);
            formData.append("city",document.getElementById("city").value);
            formData.append("phonenumber", document.getElementById("phoneNumber").value);
           
            
            const res = await fetch("http://127.0.0.1:3000/signup/applicant", {
                method: "POST",
                body: formData
            });
            console.log("Applicant signup complete", await res.text());
            document.getElementById("signup-form").reset();
        } else if (role === "Provider") {
            const res = await fetch("http://127.0.0.1:3000/signup/provider", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: uid,
                    organization: document.getElementById("org").value,
                    email: document.getElementById("email").value,
                    city: document.getElementById("orgcity").value,
                    phonenumber: document.getElementById("orgphoneNumber").value,
                    username: document.getElementById("orgusername").value,
                    role
                })
            });
            console.log("Provider signup complete", await res.text());
            document.getElementById("signup-form").reset();
        }

    } catch (err) {
        console.error("Signup failed:", err);
    }
});