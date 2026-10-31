const jwt = require("jsonwebtoken");

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
    issuer: "auth-rbac-api",
    audience: "user",
    algorithm: "HS256"
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: "auth-rbac-api",
    audience: "user"
  });
};

module.exports = {
  generateToken,
  verifyToken
};