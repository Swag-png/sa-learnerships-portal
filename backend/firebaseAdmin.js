// firebaseAdmin.js
const admin = require("firebase-admin");

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // ✅ Azure (production)
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("Invalid FIREBASE_SERVICE_ACCOUNT JSON:", err);
    throw err;
  }
} else {
  // ✅ Local development
  serviceAccount = require("./serviceAccountKey.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "sd5-project-77355.appspot.com"
});

const db = admin.firestore();

module.exports = { admin, db };