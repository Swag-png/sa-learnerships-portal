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