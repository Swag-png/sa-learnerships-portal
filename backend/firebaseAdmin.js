// firebaseAdmin.js
const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "sd5-project-77355.appspot.com"
});

const db = admin.firestore();

module.exports = { db, admin };
