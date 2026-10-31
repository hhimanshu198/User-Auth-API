const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");


// General API limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max requests
    handler: (req, res) => {

        logger.warn(`Global API limit exceeded for IP: ${req.ip}`);

        res.status(429).json({
            success: false,
            message: "Too many requests. Please try again later."
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
});


// Strict limiter for login
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);

        res.status(429).json({
            success: false,
            message: "Too many login attempts. Try again later."
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
});


// Strict limiter for signup
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    handler: (req, res) => {

        logger.warn(`Signup rate limit exceeded for IP: ${req.ip}`);

        res.status(429).json({
            success: false,
            message: "Too many signup attempts from same IP."
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
});


module.exports = {
    apiLimiter,
    loginLimiter,
    signupLimiter
};