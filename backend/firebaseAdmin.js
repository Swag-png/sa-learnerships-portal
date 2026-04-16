// firebaseAdmin.js
const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "sd5-project-77355.appspot.com"
  
});
const admin = require("firebase-admin");

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Azure — read from environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    // Local — read from file
    serviceAccount = require("./serviceAccountKey.json");
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "sd5-project-77355.appspot.com"
});

const db = admin.firestore();
module.exports = { db, admin };


