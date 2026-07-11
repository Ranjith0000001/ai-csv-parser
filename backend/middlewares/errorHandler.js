/**
 * Global error-handling middleware.
 *
 * Catches all errors thrown or passed via next(err) and returns
 * a consistent JSON response.
 *
 * - Operational errors (AppError) → show the real message.
 * - Unexpected errors → show the real message in development,
 *   otherwise a generic "Internal server error".
 */


function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;

  // Always show the real message in development mode.
  // For operational errors, always show the real message.
  // For unexpected errors in production, mask with a generic message.
  const isDev = process.env.NODE_ENV === 'development';
  const message =
    err.isOperational || isDev
      ? err.message
      : 'Internal server error';

  // Log all errors for debugging
  if (!err.isOperational) {
    console.error('UNEXPECTED ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
}

export default errorHandler;