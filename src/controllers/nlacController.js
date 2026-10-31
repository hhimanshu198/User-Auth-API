const { evaluateAccess } = require("../services/nlacService");

const checkNaturalLanguageAccess = async (req, res, next) => {
  try {
    const { request } = req.validatedData;

    const result = await evaluateAccess({
      userId: req.user.id,
      roleId: req.user.role_id,
      request
    });

    res.json({
      success: true,
      message: "Natural language access request evaluated",
      query: request,
      result
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkNaturalLanguageAccess
};