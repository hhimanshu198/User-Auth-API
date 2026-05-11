const requireRole = (roleId) => {

  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    if (req.user.role_id !== roleId) {
      return res.status(403).json({
        error: "Forbidden: insufficient permissions"
      });
    }

    next();
  };
};

module.exports = requireRole;