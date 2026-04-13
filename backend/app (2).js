const express = require("express");
const cors    = require("cors");
const admin   = require("firebase-admin");
const crypto  = require("crypto");
require("dotenv").config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──────────────────────────────────
app.use(express.json());
app.use(cors({
    origin: "http://127.0.0.1:5500",
    credentials: true
}));

// ── FIREBASE ADMIN SETUP ────────────────────────
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ── HELPER: generate session token ─────────────
function generateSessionToken() {
    return crypto.randomBytes(64).toString("hex");
}

// ── HELPER: find user across all collections ───
async function findUserInCollections(uid, email) {

    // Check Admins collection first
    // Admins use UserId field not document id
    const adminSnapshot = await db.collection("Admins")
        .where("Email", "==", email)
        .get();

    if (!adminSnapshot.empty) {
        const adminData = adminSnapshot.docs[0].data();

        // Check if admin account is active
        if (adminData.Status !== "active") {
            return { 
                error: "Your admin account is not active." 
            };
        }

        return {
            role:        "admin",
            email:       adminData.Email        || email,
            name:        adminData["Full name"] || "",
            username:    adminData.username     || "",
            status:      adminData.Status       || "",
            permissions: adminData.Permissions  || []
        };
    }

    // Check Providers collection
    // Providers use ProviderID field
    const providerSnapshot = await db.collection("Providers")
        .where("email", "==", email)
        .get();

    if (!providerSnapshot.empty) {
        const providerData = providerSnapshot.docs[0].data();

        // Check if provider is verified
        if (providerData.Status === "pending verification") {
            return { 
                error: "Your provider account is pending verification." 
            };
        }

        return {
            role:        "provider",
            email:       email,
            name:        providerData["Provider Name"] || "",
            status:      providerData.Status           || "",
            location:    providerData.Location         || "",
            verified:    providerData.Verified         || false,
            providerId:  providerData.ProviderID       || ""
        };
    }

    // Check users collection (applicants)
    const userSnapshot = await db.collection("users")
        .where("email", "==", email)
        .get();

    if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        return {
            role:     "applicant",
            email:    userData.email                                            || email,
            name:     (userData["first name"] || "") + " " + (userData["last name"] || ""),
            username: userData.username                                         || "",
            city:     userData.city                                             || "",
            phone:    userData["phone number"]                                  || ""
        };
    }


    // User not found in any collection
    return { error: "User not found in database." };
}

// ── POST /login ─────────────────────────────────
app.post("/login", async (req, res) => {
    const { token } = req.body;

    // 1. Check token was sent
    if (!token) {
        return res.status(400).json({ 
            error: "No token provided." 
        });
    }

    try {
        // 2. Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid          = decodedToken.uid;
        const email        = decodedToken.email || "";

        // 3. Find user across all collections
        const userData = await findUserInCollections(uid, email);

        // 4. Check if there was an error finding user
        if (userData.error) {
            return res.status(403).json({ 
                error: userData.error 
            });
        }

        // 5. Generate session token
        const sessionToken = generateSessionToken();

        // 6. Save session to Firestore
        await db.collection("sessions").doc(sessionToken).set({
            uid,
            ...userData,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`User logged in: ${email} as ${userData.role}`);

        // 7. Send response to frontend
        return res.status(200).json({
            message: "Login successful",
            sessionToken,
            ...userData
        });

    } catch (error) {
        console.error("Login error:", error.message);

        if (error.code === "auth/id-token-expired") {
            return res.status(401).json({ 
                error: "Session expired. Please log in again." 
            });
        } else if (error.code === "auth/argument-error") {
            return res.status(401).json({ 
                error: "Invalid credentials." 
            });
        } else {
            return res.status(401).json({ 
                error: "Authentication failed." 
            });
        }
    }
});

// ── GET /protected ──────────────────────────────
app.get("/protected", async (req, res) => {
    const sessionToken = req.headers["authorization"];

    if (!sessionToken) {
        return res.status(401).json({ 
            error: "No session token provided." 
        });
    }

    try {
        const sessionDoc = await db
            .collection("sessions")
            .doc(sessionToken)
            .get();

        if (!sessionDoc.exists) {
            return res.status(401).json({ 
                error: "Invalid or expired session." 
            });
        }

        return res.status(200).json({
            message: "Access granted",
            user: sessionDoc.data()
        });

    } catch (error) {
        return res.status(401).json({ error: "Unauthorized." });
    }
});

// ── POST /logout ────────────────────────────────
app.post("/logout", async (req, res) => {
    const sessionToken = req.headers["authorization"];

    if (sessionToken) {
        await db.collection("sessions")
            .doc(sessionToken)
            .delete();
        console.log("User logged out.");
    }

    return res.status(200).json({ 
        message: "Logged out successfully." 
    });
});

// ── START SERVER ────────────────────────────────
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});