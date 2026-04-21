const jwt = require("jsonwebtoken");

module.exports = async function (req, res, next) {
  console.log(`[DEBUG] Auth Middleware - Header:`, req.headers["x-auth-token"] || req.headers.authorization);
  // Try both 'Authorization' and 'x-auth-token'
  let token = req.headers["x-auth-token"] || req.headers.authorization;
  
  if (!token) {
    console.log("[DEBUG] Auth failed: No token provided");
    return res.status(401).send("No token");
  }

  // Handle 'Bearer <token>' format
  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    
    // 1. Fetch user to check current token version
    const User = require("../models/User");
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log("[DEBUG] Auth failed: User no longer exists");
      return res.status(401).send("User not found");
    }

    // 2. Professional Revocation Check
    // If the version in the token is LESS than the version in DB, it has been revoked.
    if (decoded.version !== undefined && decoded.version < user.tokenVersion) {
      console.log(`[DEBUG] Auth failed: Token revoked (Version mismatch: ${decoded.version} vs ${user.tokenVersion})`);
      return res.status(401).send("Token revoked. Please login again.");
    }

    console.log("[DEBUG] Auth success. User ID:", decoded.id);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("[DEBUG] Auth failed: Invalid token.", err.message);
    res.status(401).send("Invalid token");
  }
}; 