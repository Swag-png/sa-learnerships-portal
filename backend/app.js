const express = require('express');
const path = require('path'); // Required for res.sendFile
const cors = require("cors");
const { db, admin } = require("./firebaseAdmin");
//Importing "Authorize" function from access-logic
const { authorize } = require('./access-logic');

const app = express();

// Middleware should be defined before routes
app.use(cors());
app.use(express.json());

// The Middleware "Guard"
function guard(route) {
    //
    return (req, res, next) => {
        // req.user is usually set after a login process
        const user = req.user; 

        if (user && authorize(user, route)) {
            next(); // Access granted: move to the actual page logic
        } else {
            // Access denied: send a 403 error or redirect to login
            res.status(403).send("Forbidden: You do not have access to this route.");
        }
    };
}

// Applying the restriction to applicant route
app.get('/applicant-home', guard('/applicant-home'), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'applicant-home.html'));
});

// Applying the restriction to admin route
app.get('/admin-dashboard', guard('/admin-dashboard'), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'admin-dashboard.html'));
});

// Applying the restriction to provider route
app.get('/provider-home', guard('/provider-home'), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'provider-home.html'));
});

app.post("/signup/applicant", async (req, res) => {
    const { uid, firstname ,lastname, email, username, institution, city, phonenumber, cv, role} = req.body;
    //Must remove console.log() before deploying as it contains private user data
    console.log(req.body);
    try{
        await admin.auth().setCustomUserClaims(uid, { role: "applicant" });

        await db.collection("users").doc(uid).set({
            firstname,
            lastname,
            email,
            username,
            institution,
            city,
            cv,
            role: "applicant",
            createdAt: new Date().toISOString()
        });
        //Must remove console.log() before deploying as it contains private user data
        console.log(`Applicant created: ${email}`);
        res.status(201).send({ message: "Applicant role assigned and saved!" });
    }
    catch(error){
        console.error("Signup Error:", error.message);
        res.status(500).send({ error: "Failed to assign role" });
    }

});

app.post("/signup/provider", async (req, res) => {
    const { uid, organization, email, city, phonenumber, username, role } = req.body;
    try{
        await admin.auth().setCustomUserClaims(uid, { role: "provider" });

        await db.collection("users").doc(uid).set({
            organization,
            email,
            city,
            phonenumber,
            username,
            role: "provider",
            createdAt: new Date().toISOString()
        });
        //Must remove console.log() before deploying as it contains private user data
        console.log(`Provider created: ${email}`);
        res.status(201).send({ message: "Provider role assigned and saved!" });
    }
    catch(error){
        console.error("Signup Error:", error.message);
        res.status(500).send({ error: "Failed to assign role" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));