const { getActivePlanOrFallback } = require("../services/planService");

const {
  getCurrentMonth,
  getUserUsage,
  recordUsage
} = require("../services/usageService");

const { saveCachedResponse } = require("../services/aiCacheService");

const getMyUsage = async (req, res, next) => {
  try {
    const usage = await getUserUsage(req.user.id);
    const plan = await getActivePlanOrFallback(req.user.id);

    const tokenLimit = Number(plan.monthly_token_limit);
    const costLimit = Number(plan.monthly_cost_limit);

    res.json({
      success: true,
      month: getCurrentMonth(),
      plan: {
        id: plan.id,
        name: plan.name,
        monthlyTokenLimit: tokenLimit,
        monthlyCostLimit: costLimit,
        fallbackApplied: plan.isFallback
      },
      usage,
      remaining: {
        tokens: Math.max(tokenLimit - usage.tokensUsed, 0),
        cost: Math.max(costLimit - usage.costUsed, 0)
      }
    });

  } catch (error) {
    next(error);
  }
};

const testAiUsage = async (req, res, next) => {
  try {
    const prompt = req.body.prompt;
    const model = req.body.model || "test-ai-model";

    const tokensUsed = req.estimatedTokens || 500;
    const costUsed = req.estimatedCost || 0.02;

    const aiResponse = `AI response for prompt: ${prompt}`;

    await saveCachedResponse({
      userId: req.user.id,
      cacheKey: req.aiCache.cacheKey,
      prompt,
      model,
      response: aiResponse,
      tokensUsed,
      costUsed,
      endpoint: "/usage/test-ai",
      ttlMinutes: 60
    });

    const usageRecord = await recordUsage({
      userId: req.user.id,
      tokensUsed,
      costUsed,
      model,
      endpoint: "/usage/test-ai"
    });

    const updatedUsage = await getUserUsage(req.user.id);

    res.json({
      success: true,
      cached: false,
      message: "AI response generated, cached, and usage recorded",
      data: {
        prompt,
        model,
        response: aiResponse,
        tokensUsed,
        costUsed
      },
      usageRecord,
      updatedUsage,
      plan: req.plan
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyUsage,
  testAiUsage
};