const { verifyToken } = require("../utils/jwt");

const authenticate = (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Authorization header missing"
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Token missing"
    });
  }

  try {

    const decoded = verifyToken(token);

    req.user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      error: "Invalid token"
    });

  }
};

module.exports = authenticate;