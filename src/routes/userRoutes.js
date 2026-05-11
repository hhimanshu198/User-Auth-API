const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const checkSubscription = require("../middleware/subscriptionMiddleware");

const {
  getProfile,
  getAllUsers,
  deleteUser
} = require("../controllers/userController");

router.get("/me", authenticate, getProfile);

router.get("/", authenticate, requireRole(1), getAllUsers);

router.get("/basic", authenticate, checkSubscription([2,3]), (req, res)=>{
  res.json({
    message: "Welcome to basic premium feature"
  });
});
router.get("/pro", authenticate, checkSubscription([3]), (req, res)=>{
  res.json({
    message: "Welcome to pro premium feature"
  });
});

router.delete("/:id", authenticate, requireRole(1), deleteUser);

module.exports = router;