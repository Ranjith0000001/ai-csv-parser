/**
 * Custom error class for operational errors.
 *
 * Extends the built-in Error class to include a status code
 * and a flag indicating whether the error is operational.
 */

class AppError extends Error {
 
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;