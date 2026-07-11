/**
 * Custom application error class.
 *
 * Extends the built-in Error with an HTTP status code
 * for consistent error handling across the application.
 */
class AppError extends Error {
  /**
   * @param {string}  message    - Human-readable error description.
   * @param {number}  statusCode - HTTP status code (e.g. 400, 500).
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected errors from programming bugs

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;