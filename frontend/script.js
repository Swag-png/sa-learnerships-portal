import { application } from "express";

const dropdown = document.getElementById("role");
const applicantFields = document.getElementById("ApplicantSignUp");
const providerFields = document.getElementById("ProviderSignUp");
let applicantFlag = false;
let providerFlag = false;


dropdown.addEventListener("change", () => {
    const selectedValue = dropdown.value;
    if(selectedValue === "Applicant" ){
        applicantFields.classList.remove("hidden");
        providerFields.classList.add("hidden");
    }else if(selectedValue === "Provider"){
         providerFields.classList.remove("hidden");
         applicantFields.classList.add("hidden");
    }
})

const signUpBtn = document.getElementById("signup-btn");
signUpBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if(dropdown.value === "Applicant"){
        fetch("http://localhost:3000/signup/applicant", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({
                uid: 1,
                firstname: document.getElementById("email").value,
                lastname: document.getElementById("lastName").value,
                email: document.getElementById("email").value,
                username: document.getElementById("username").value,
                institution: document.getElementById("institution").value,
                city: document.getElementById("city").value,
                phonenumber: document.getElementById("phoneNumber").value,
                //cv: document.getElementById("cv").files[0],
                role: dropdown.value
            })
        });
    }else if(dropdown.value === "Provider"){
         fetch("http://localhost:3000/signup/provider", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({
                uid: 1,
                organization: document.getElementById("org").value,
                email: document.getElementById("email").value,
                city: document.getElementById("city").value,
                phonenumber: document.getElementById("phoneNumber").value,
                username: document.getElementById("username").value,
                role: dropdown.value
            })
        });
    }
})
