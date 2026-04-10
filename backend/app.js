const express = require('express');
const app = express();
const cors = require("cors");

app.use(cors());

app.use(express.json());

const db = require("./firebaseAdmin");

app.post("/signup/applicant", async (req, res) => {
    const { uid, firstname ,lastname, email, username, institution, city, phonenumber, cv, role} = req.body;
    console.log(req.body);
    await db.collection("users").doc(uid).set({
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

})

const PORT =process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));