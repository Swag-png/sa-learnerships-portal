const { admin } = require("./firebaseAdmin");

async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
    }

    // Support both "Bearer <token>" and raw token (defensive)
    let token;
    if (authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();   // everything after "Bearer "
    } else {
        token = authHeader.trim();            // raw token fallback
    }

    if (!token) {
        return res.status(401).json({ error: "Token is empty" });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        req.user = {
            uid:  decodedToken.uid,
            role: decodedToken.role   // custom claim set by setCustomUserClaims()
        };

        console.log("✅ Verified user:", req.user);
        next();

    } catch (error) {
        console.error("❌ Token verification failed:", error.message);
        res.status(401).json({ error: "Invalid or expired token" });
    }
}

module.exports = { verifyToken };