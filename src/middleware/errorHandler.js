const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {

    logger.error({
        message: `ERROR: ${err.message}`,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
    });

    res.status(err.status || 500).json({
        success: false,

        message:
            process.env.NODE_ENV === "production"
                ? "Internal Server Error"
                : err.message || "Internal Server Error"
    });
};

module.exports = errorHandler;