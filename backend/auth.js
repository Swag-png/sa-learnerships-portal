const { admin } = require("./firebaseAdmin");

async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        // ✅ Map the decoded token onto req.user in the shape access-logic.js expects
        req.user = {
            uid:  decodedToken.uid,
            role: decodedToken.role  // custom claim set by setCustomUserClaims()
        };


        console.log("✅ Verified user:", req.user); // helpful for debugging

        next();
    } catch (error) {
        console.error("❌ Token verification failed:", error.message);
        res.status(401).json({ error: "Invalid token" });

}
}
module.exports = { verifyToken };