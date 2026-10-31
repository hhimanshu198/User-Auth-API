const { getUserUsage } = require("../services/usageService");
const { getActivePlanOrFallback } = require("../services/planService");

const checkUsageLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const estimatedTokens = Number(req.body.estimatedTokens) || 500;
    const estimatedCost = Number(req.body.estimatedCost) || 0.02;

    const plan = await getActivePlanOrFallback(userId);
    const usage = await getUserUsage(userId);

    const tokenLimit = Number(plan.monthly_token_limit);
    const costLimit = Number(plan.monthly_cost_limit);

    const projectedTokens = usage.tokensUsed + estimatedTokens;
    const projectedCost = usage.costUsed + estimatedCost;

    if (projectedTokens > tokenLimit) {
      return res.status(403).json({
        success: false,
        message: "Monthly token limit would be exceeded",
        fallbackApplied: plan.isFallback,
        usage,
        estimatedRequest: {
          tokens: estimatedTokens,
          cost: estimatedCost
        },
        limit: {
          plan: plan.name,
          tokens: tokenLimit,
          cost: costLimit
        },
        remaining: {
          tokens: Math.max(tokenLimit - usage.tokensUsed, 0),
          cost: Math.max(costLimit - usage.costUsed, 0)
        }
      });
    }

    if (projectedCost > costLimit) {
      return res.status(403).json({
        success: false,
        message: "Monthly cost limit would be exceeded",
        fallbackApplied: plan.isFallback,
        usage,
        estimatedRequest: {
          tokens: estimatedTokens,
          cost: estimatedCost
        },
        limit: {
          plan: plan.name,
          tokens: tokenLimit,
          cost: costLimit
        },
        remaining: {
          tokens: Math.max(tokenLimit - usage.tokensUsed, 0),
          cost: Math.max(costLimit - usage.costUsed, 0)
        }
      });
    }

    req.plan = plan;
    req.usage = usage;
    req.estimatedTokens = estimatedTokens;
    req.estimatedCost = estimatedCost;

    next();

  } catch (error) {
    next(error);
  }
};

module.exports = checkUsageLimit;