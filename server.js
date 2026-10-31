require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

/* ===============================
   LOGGER
================================ */
const logger = require("./src/utils/logger");

/* ===============================
   PROCESS LEVEL SAFETY
   (Must be at top)
================================ */
process.on("uncaughtException", (err) => {
  logger.error({
    message: "Uncaught Exception",
    error: err.message,
    stack: err.stack
  });

  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error({
    message: "Unhandled Rejection",
    error: err.message,
    stack: err.stack
  });

  process.exit(1);
});

/* ===============================
   IMPORT ROUTES + MIDDLEWARE
================================ */
const pool = require("./src/config/db");

const authRoutes = require("./src/routes/authRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const webhookRoutes = require("./src/routes/webhookRoutes");
const userRoutes = require("./src/routes/userRoutes");
const usageRoutes = require("./src/routes/usageRoutes");

const requestLogger = require("./src/middleware/requestLogger");
const { apiLimiter } = require("./src/middleware/rateLimiter");
const errorHandler = require("./src/middleware/errorHandler");
const nlacRoutes = require("./src/routes/nlacRoutes");

/* ===============================
   SWAGGER
================================ */
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/docs/swagger");

/* ===============================
   APP
================================ */
const app = express();

/* ===============================
   TRUST PROXY
   Required for:
   - Render
   - Railway
   - Vercel
   - Correct IP detection
   - Rate limiter
================================ */
app.set("trust proxy", 1);

/* ===============================
   SECURITY MIDDLEWARE
================================ */
app.use(helmet());

/* ===============================
   CORS
================================ */
app.use(cors({
  origin: true,
  credentials: true
}));

/* ===============================
   WEBHOOK
   Must come BEFORE express.json()
   because Stripe/Razorpay need raw body
================================ */
app.use(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

/* ===============================
   BODY PARSER
================================ */
app.use(express.json());

/* ===============================
   REQUEST LOGGER
================================ */
app.use(requestLogger);

/* ===============================
   GLOBAL RATE LIMITER
================================ */
app.use(apiLimiter);

/* ===============================
   SWAGGER DOCS
================================ */
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

/* ===============================
   RAW SWAGGER JSON
================================ */
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

/* ===============================
   ROUTES
================================ */
app.use("/auth", authRoutes);

app.use("/payments", paymentRoutes);

app.use("/users", userRoutes);

app.use("/usage", usageRoutes);
app.use("/nlac", nlacRoutes);

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      serverTime: result.rows[0]
    });

  } catch (err) {
    next(err);
  }
});

/* ===============================
   404 HANDLER
================================ */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

/* ===============================
   GLOBAL ERROR HANDLER
================================ */
app.use(errorHandler);

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
