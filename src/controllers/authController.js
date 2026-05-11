const authService = require("../services/authService");

const signup = async (req, res) => {
  try {
    const user = await authService.signup(req.body);

    res.status(201).json({
      message: "User created successfully",
      user
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);

    res.json(result);
  } catch (error) {
    res.status(401).json({
      error: error.message
    });
  }
};

module.exports = {
  signup,
  login
};