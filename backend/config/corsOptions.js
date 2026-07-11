/**
 * CORS configuration options.
 *
 * Reads allowed origin from the FRONTEND_URL environment variable
 * so the backend only accepts requests from the frontend application.
 */
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

module.exports = corsOptions;