const { getActivePlanOrFallback } = require("../services/planService");

const checkSubscription = (requiredPlans = []) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      const plan = await getActivePlanOrFallback(userId);

      /*
        If no specific plan is required, allow access.
        If specific plans are required, check whether fallback/free plan is allowed.
      */

      if (requiredPlans.length && !requiredPlans.includes(plan.id)) {
        return res.status(403).json({
          success: false,
          message: "Upgrade plan to access this feature",
          currentPlan: plan.name,
          fallbackApplied: plan.isFallback
        });
      }

      req.plan = plan;

      next();

    } catch (err) {
      next(err);
    }
  };
};

module.exports = checkSubscription;