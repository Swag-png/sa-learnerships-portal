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
        console.log(dropdown.value);
        fetch("http://127.0.0.1:3000/signup/applicant", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({
                uid: 1,
                firstname: document.getElementById("firstName").value,
                lastname: document.getElementById("lastName").value,
                email: document.getElementById("applicantEmail").value,
                username: document.getElementById("username").value,
                institution: document.getElementById("institution").value,
                city: document.getElementById("city").value,
                phonenumber: document.getElementById("phoneNumber").value,
                cv: "",
                role: dropdown.value
                
            })
       });
    }else if(dropdown.value === "Provider"){
         fetch("http://127.0.0.1:3000/signup/provider", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({
                uid: 1,
                organization: document.getElementById("org").value,
                email: document.getElementById("email").value,
                city: document.getElementById("orgcity").value,
                phonenumber: document.getElementById("orgphoneNumber").value,
                username: document.getElementById("orgusername").value,
                role: dropdown.value
            })
        });
    }
    console.log("Signup success")
});
