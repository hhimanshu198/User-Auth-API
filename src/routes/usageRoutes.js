const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const checkUsageLimit = require("../middleware/usageLimitMiddleware");
const checkAiCache = require("../middleware/aiCacheMiddleware");

const {
  getMyUsage,
  testAiUsage
} = require("../controllers/usageController");

router.get("/me", authenticate, getMyUsage);

router.post(
  "/test-ai",
  authenticate,
  checkAiCache,
  checkUsageLimit,
  testAiUsage
);

module.exports = router;