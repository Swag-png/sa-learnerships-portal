//firebaseAdmin
const admin = require("firebase-admin");

let credential;

if (process.env.FIREBASE_PROJECT_ID) {
    // ✅ Azure — use individual environment variables
    credential = admin.credential.cert({
        projectId:    process.env.FIREBASE_PROJECT_ID,
        clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines so the key is valid
        privateKey:   process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    });
} else {
    // ✅ Local — use serviceAccountKey.json
    const serviceAccount = require("./serviceAccountKey.json");
    credential = admin.credential.cert(serviceAccount);
}

admin.initializeApp({
    credential,
    storageBucket: "sd5-project-77355.appspot.com"
});

const db = admin.firestore();

module.exports = { admin, db };