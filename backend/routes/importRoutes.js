/**
 * Import routes – defines API endpoints for CSV import.
 */
import express from 'express';
import { importData } from '../controllers/importController.js';

const router = express.Router();

/**
 * POST /api/import
 *
 * Accepts parsed CSV row data and returns AI-mapped, validated, and deduplicated results.
 */
router.post('/import', importData);

export default router;