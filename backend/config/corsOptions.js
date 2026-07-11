/**
 * CORS configuration for the Express server.
 *
 * Allows requests from the Next.js frontend and other configured origins.
 */

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default corsOptions;