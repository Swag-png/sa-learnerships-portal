const express = require('express');
const path = require('path'); // Required for res.sendFile
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

const { db, admin } = require("./firebaseAdmin");
//Importing "Authorize" function from access-logic
const { authorize } = require('./access-logic');


// The Middleware "Guard"
function guard(route) {
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


// Applicant signup
app.post("/signup/applicant", async (req, res) => {
    const { uid, firstname, lastname, email, username, institution, city, phonenumber, cv } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        await admin.auth().setCustomUserClaims(uid, { role: "applicant" });

        await db.collection("users").doc(uid).set({
            firstname,
            lastname,
            email,
            username,
            institution,
            city,
            phonenumber,
            cv,
            role: "applicant",
            createdAt: new Date().toISOString()
        });

        res.status(201).json({ message: "Applicant created successfully" });

    } catch (error) {
        console.error("Signup Error:", error.message);
        res.status(500).json({ error: "Failed to create applicant" });
    }
});

// Provider signup
app.post("/signup/provider", async (req, res) => {
    const { uid, organization, email, city, phonenumber, username } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
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

        res.status(201).json({ message: "Provider created successfully" });

    } catch (error) {
        console.error("Signup Error:", error.message);
        res.status(500).json({ error: "Failed to create provider" });
    }
});

// ✅ Export for testing
module.exports = app;

// ✅ Only run server outside tests
if (process.env.NODE_ENV !== "test") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}