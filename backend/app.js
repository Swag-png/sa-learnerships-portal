const express = require('express');
const app = express();
const cors = require("cors");

app.use(cors());

app.use(express.json());

const { db, admin } = require("./firebaseAdmin");

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

const PORT =process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));