const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { createPayment } = require("../controllers/paymentController");

router.post("/create", authenticate, createPayment);

module.exports = router;