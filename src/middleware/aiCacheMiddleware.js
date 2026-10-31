const {
  createCacheKey,
  getCachedResponse
} = require("../services/aiCacheService");

const checkAiCache = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const {
      prompt,
      model = "test-ai-model"
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required"
      });
    }

    const cacheKey = createCacheKey({
      prompt,
      model
    });

    const cachedResponse = await getCachedResponse({
      userId,
      cacheKey
    });

    if (cachedResponse) {
      return res.json({
        success: true,
        cached: true,
        message: "AI response served from cache",
        data: {
          prompt: cachedResponse.prompt,
          model: cachedResponse.model,
          response: cachedResponse.response,
          tokensUsed: 0,
          costUsed: 0
        }
      });
    }

    req.aiCache = {
      cacheKey,
      prompt,
      model
    };

    next();

  } catch (error) {
    next(error);
  }
};

module.exports = checkAiCache;