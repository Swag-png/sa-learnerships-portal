const express = require('express');
const path = require('path'); 
const cors = require("cors");
const multer = require("multer"); // Moved up from the merge
const { db, admin } = require("./firebaseAdmin");
const { authorize } = require('./access-logic');

const app = express();
const upload = multer({ dest: "uploads/" }); // Setup multer

// Middleware 
app.use(cors());
app.use(express.json());

// The Middleware "Guard"
function guard(route) {
    return (req, res, next) => {
        // req.user is usually set after a login process
        const user = req.user; 

        if (user && authorize(user, route)) {
            next(); // Access granted
        } else {
            res.status(403).send("Forbidden: You do not have access to this route.");
        }
    };
}

// --- PROTECTED ROUTES ---
app.get('/applicant-home', guard('/applicant-home'), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'applicant-home.html'));
});

app.get('/admin-dashboard', guard('/admin-dashboard'), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'admin-dashboard.html'));
});

app.get('/provider-home', guard('/provider-home'), (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'provider-home.html'));
});

// --- SIGNUP ROUTES ---

app.post("/signup/applicant", upload.single("cv"), async (req, res) => {
    const {
        uid,
        firstname,
        lastname,
        email,
        username,
        institution,
        city,
        phonenumber,
        role
    } = req.body;

    try {
        console.log("Creating user...");

        await db.collection("users").doc(uid).set({
            firstname,
            lastname,
            email,
            username,
            institution,
            city,
            phonenumber,
            role: "Applicant",
            createdAt: new Date().toISOString(),
            cvUrl: null 
        });

        console.log("User created in Firestore");

        if (req.file) {
            try {
                const bucket = admin.storage().bucket();

                await bucket.upload(req.file.path, {
                    destination: `cvs/${req.file.originalname}`
                });

                const file = bucket.file(`cvs/${req.file.originalname}`);

                const [url] = await file.getSignedUrl({
                    action: "read",
                    expires: "03-01-2030"
                });

                await db.collection("users").doc(uid).update({
                    cvUrl: url
                });

                console.log("CV uploaded");

            } catch (cvError) {
                console.error("CV upload failed (non-blocking):", cvError);
            }
        }

        res.status(201).send({ message: "User created successfully" });

    } catch (error) {
        console.error("Signup failed:", error);
        res.status(500).send({ error: "Signup failed" });
    }
});

app.post("/signup/provider", async (req, res) => {
    const { uid, organization, email, city, phonenumber, username, role } = req.body;
    try {
        await admin.auth().setCustomUserClaims(uid, { role: "provider" });

        await db.collection("users").doc(uid).set({
            organization,
            email,
            city,
            phonenumber,
            username,
            role: "Provider",
            createdAt: new Date().toISOString()
        });
        
        console.log(`Provider created: ${email}`);
        res.status(201).send({ message: "Provider role assigned and saved!" });
    }
    catch(error) {
        console.error("Signup Error:", error.message);
        res.status(500).send({ error: "Failed to assign role" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));