const checkSubscription = (requiredPlans = []) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      const result = await pool.query(
        `SELECT s.*, p.name
         FROM subscriptions s
         JOIN plans p ON s.plan_id = p.id
         WHERE s.user_id=$1
         AND s.status='active'
         AND s.end_date > NOW()`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: "No active subscription" });
      }

      const userPlanId = result.rows[0].plan_id;

      if (requiredPlans.length && !requiredPlans.includes(userPlanId)) {
        return res.status(403).json({ error: "Upgrade plan to access this feature" });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};

module.exports = checkSubscription;