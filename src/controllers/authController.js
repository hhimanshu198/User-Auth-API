const authService = require("../services/authService");
const logger = require("../utils/logger");


const signup = async (req, res, next) => {
  try {
    logger.info(`New signup attempt: ${req.body.email}`);
    const user = await authService.signup(req.validatedData);
    
    logger.info(`User created successfully: ${user.email}`);

    res.status(201).json({
      message: "User created successfully",
      user
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    logger.info(`Login attempt: ${req.body.email}`);
    const result = await authService.login(req.validatedData, req);
    logger.info(`Login successful: ${req.body.email}`);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login
};