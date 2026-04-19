const express = require('express');
const path = require('path');
const cors = require("cors");
const app = express();
const { verifyToken } = require("./auth");
const { db, admin } = require("./firebaseAdmin");
const { authorize } = require('./access-logic');

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

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

app.get('/listing-info', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'listing-info.html'));
});

// Serve login page at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});
// ─── Protected Routes ────────────────────────────────────────────────────────
// ✅ Just serve the pages — token is verified client-side


app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'admin-dashboard.html'));
});

app.get('/provider-home', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'provider-home.html'));
});

app.get('/listings', (req, res) => {
    // Point this to where your HTML actually sits
    res.sendFile(path.join(__dirname, '..', 'frontend', 'listings.html'));
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


// ─── Opportunity Routes ──────────────────────────────────────────────────────

// Submit Opportunity
app.post("/api/opportunities/submit", async (req, res) => {
    try {
        const opportunityData = req.body;

        // Set mandatory metadata
        opportunityData.status = "pending-review";
        opportunityData.createdAt = new Date().toISOString();
        opportunityData.updatedAt = new Date().toISOString();

        // Save directly to the "opportunities" collection in Firestore
        const docRef = await db.collection("opportunities").add(opportunityData);

        res.status(201).json({ 
            message: "Opportunity submitted successfully",
            id: docRef.id
        });

    } catch (error) {
        console.error("Error submitting opportunity:", error);
        res.status(500).json({ error: "Failed to submit opportunity" });
    }
});


// ─── Listings ─────────────────────────────────────────────────────────
app.get('/api/listings', verifyToken, async (req, res) => {
    const isAuthorized = authorize(req.user, '/api/listings');

    if (!isAuthorized) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    try {
        const snapshot = await db.collection('Opportunities').get();
        const opportunities = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            opportunities.push({ 
                id: doc.id, 
                title: data.title,
                description: data.description,
                price: data.stipend, 
                location: data.location,
                provider: data.company, 
                type: data.type
            });
        });

        res.status(200).json(opportunities);
        
    } catch (error) {
        console.error("Firestore Error:", error);
        res.status(500).json({ error: "Database error" });
    }
});



app.get("/applicant/hasApplied", async (req, res) => {
    const {applicantID, listingID} = req.query;
    try {
        const snapshot = await db.collection("applications")
            .where("applicantID", "==", applicantID)
            .where("listingID", "==", listingID)
            .get();
        res.json({ hasApplied: !snapshot.empty });
    } catch (error) {
        res.status(500).json({ error: "Failed to check application"})
    }
});

//Appicant apply
app.post("/applicant/apply", async(req,res) => {
    const { applicantID, listingID, status} = req.body;

    if(!applicantID || !listingID){
        return res.status(400).json({ error: "applicationID and listing ID are required"});
    }
   
    try {
        const userDoc = await db.collection("users").doc(applicantID).get();
        console.log("👤 User doc exists:", userDoc.exists); // ← add this
        console.log("👤 Looking for UID:", applicantID);
        if(!userDoc.exists){
            return res.status(400).json({ error: "User not found"});
        }

         // ── Validate listing exists ───────────────────────────────────────
        const listingDoc = await db.collection("Opportunities").doc(listingID).get();
        if (!listingDoc.exists) {
            return res.status(404).json({ error: "Listing not found" });
        }

          // ── Prevent duplicate applications ────────────────────────────────
        const docId = `${applicantID}_${listingID}`;
        const existingApp = await db.collection("applications").doc(docId).get();
        if (existingApp.exists) {
            return res.status(409).json({ error: "You have already applied to this listing" });
        }
         
         await db.collection("applications").doc(docId).set({
            applicantID,
            listingID,
            status,
            createdAt: new Date().toISOString()
        });
        res.status(201).json({ message: "Application submitted" });
    } catch (error) {
        console.error("Apply error:", error);
        res.status(500).json({ error: "Failed to submit application" });
    }

})
// ✅ Export for testing
module.exports = app;

// ✅ Only run server outside tests
if (process.env.NODE_ENV !== "test") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 
}

