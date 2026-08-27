const pino = require('pino');

// Create a base logger instance that outputs raw JSON
// This is the standard for structured logging - each line is a complete JSON object
const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info'
});

// Export the base logger and a helper to create child loggers with context
module.exports = {
  logger: baseLogger,
  createLogger: (context = {}) => {
    return baseLogger.child(context);
  }
};

