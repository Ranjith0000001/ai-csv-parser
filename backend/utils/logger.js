/**
 * Simple logger utility for consistent logging.
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

const currentLevel = process.env.LOG_LEVEL || LOG_LEVELS.INFO;

function shouldLog(level) {
  const levels = [LOG_LEVELS.ERROR, LOG_LEVELS.WARN, LOG_LEVELS.INFO, LOG_LEVELS.DEBUG];
  return levels.indexOf(level) <= levels.indexOf(currentLevel);
}

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}`;
}

export const error = (message, meta = {}) => {
  if (shouldLog(LOG_LEVELS.ERROR)) {
    console.error(formatMessage(LOG_LEVELS.ERROR, message, meta));
  }
};

export const warn = (message, meta = {}) => {
  if (shouldLog(LOG_LEVELS.WARN)) {
    console.warn(formatMessage(LOG_LEVELS.WARN, message, meta));
  }
};

export const info = (message, meta = {}) => {
  if (shouldLog(LOG_LEVELS.INFO)) {
    console.info(formatMessage(LOG_LEVELS.INFO, message, meta));
  }
};

export const debug = (message, meta = {}) => {
  if (shouldLog(LOG_LEVELS.DEBUG)) {
    console.debug(formatMessage(LOG_LEVELS.DEBUG, message, meta));
  }
};

const logger = { error, warn, info, debug };
export default logger;