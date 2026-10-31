const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const {
  checkNaturalLanguageAccess
} = require("../controllers/nlacController");

const {
  nlacSchema
} = require("../validators/nlacValidators");

router.post(
  "/check",
  authenticate,
  validate(nlacSchema),
  checkNaturalLanguageAccess
);

module.exports = router;