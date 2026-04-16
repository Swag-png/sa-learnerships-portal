const express = require('express');
const path = require('path');
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const { verifyToken } = require("./auth");
const { db, admin } = require("./firebaseAdmin");
const { authorize } = require('./access-logic');

// ─── Guard Middleware ────────────────────────────────────────────────────────
function guard(route) {
    return (req, res, next) => {
        const user = req.user;
        if (user && authorize(user, route)) {
            next();
        } else {
            res.status(403).send("Forbidden: You do not have access to this route.");
        }
    };
}

// Serve signup page
app.get(['/signup', '/signup.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'signup.html'));
});

// Serve login page at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});
// ─── Protected Routes ────────────────────────────────────────────────────────
// ✅ Just serve the pages — token is verified client-side
app.get('/applicant-home', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'applicant-home.html'));
});

app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'admin-dashboard.html'));
});

app.get('/provider-home', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'provider-home.html'));
});

// ─── Applicant Signup ────────────────────────────────────────────────────────
app.post("/signup/applicant", async (req, res) => {
    const { uid, firstname, lastname, email, username, institution, city, phonenumber, cv } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

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

// ─── Provider Signup ─────────────────────────────────────────────────────────
app.post("/signup/provider", async (req, res) => {
    console.log("📥 Received signup request:", req.body);
    const { uid, organization, email, city, phonenumber, username } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

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