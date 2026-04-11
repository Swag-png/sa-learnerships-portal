const express = require('express');
const app = express();
const cors = require("cors");

app.use(cors());

app.use(express.json());

const db = require("./firebaseAdmin");

app.post("/signup/applicant", async (req, res) => {
    const { uid, firstname ,lastname, email, username, institution, city, phonenumber, cv, role} = req.body;
    console.log(req.body);
    await db.collection("users").add({
        firstname,
        lastname,
        email,
        username,
        institution,
        city,
        cv,
        role
    });
    res.send("User saved");

});

app.post("/signup/provider", async (req, res) => {
    const { uid, organization, email, city, phonenumber, username, role } = req.body;

    await db.collection("users").add({
        organization,
        email,
        city,
        phonenumber,
        username,
        role
    });

    res.send("Provider saved");
});

// 👇 IMPORTANT: export app for testing
module.exports = app;

// 👇 Only run server if NOT testing
if (process.env.NODE_ENV !== "test") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}