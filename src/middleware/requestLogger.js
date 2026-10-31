const logger = require("../utils/logger");

const requestLogger = (req, res, next) => {

  logger.info(`INFO: ${req.method} ${req.originalUrl} - IP: ${req.ip}`);

  next();
};

module.exports = requestLogger;
