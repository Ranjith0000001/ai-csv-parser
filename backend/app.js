/**
 * Express application setup.
 *
 * Configures middleware, routes, and the global error handler.
 * The server.js file starts the server using this app.
 */
import express from 'express';
import cors from 'cors';
import corsOptions from './config/corsOptions.js';
import importRoutes from './routes/importRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // support large CSV payloads
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running.' });
});

// ── Routes ─────────────────────────────────────────────────────────────
app.use('/api', importRoutes);

// ── 404 handler ────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ── Global error handler ───────────────────────────────────────────────
app.use(errorHandler);

export default app;