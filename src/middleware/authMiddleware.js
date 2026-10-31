const { verifyToken } = require("../utils/jwt");
const pool = require("../config/db");

const authenticate = async (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Invalid or missing token" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Token missing"
    });
  }

  try {

    const decoded = verifyToken(token);

    // 🔐 NEW: Fetch current token_version from DB
    const result = await pool.query(
      "SELECT token_version FROM users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    const currentTokenVersion = result.rows[0].token_version;

    // 🔐 CRITICAL CHECK
    if (decoded.token_version !== currentTokenVersion) {
      return res.status(401).json({
        error: "Token has been revoked"
      });
    }

    req.user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      error: "Invalid token"
    });

  }
};

module.exports = authenticate;