/**
 * Import controller – handles HTTP request/response for CSV data import.
 *
 * Validates the incoming request body and delegates business logic
 * to the import service. Does NOT contain business logic itself.
 */
import { processImport } from '../services/importService.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * POST /api/import
 *
 * Accepts parsed CSV row data and returns a processing result.
 *
 * Request body: { rows: [{ columnName: "value" }, ...] }
 */
async function importData(req, res, next) {
  try {
    const { rows } = req.body;

    // ── Validation ────────────────────────────────────────────
    if (rows === undefined || rows === null) {
      logger.warn('Import request missing rows field');
      throw new AppError('Request body must contain a "rows" field.', 400);
    }

    if (!Array.isArray(rows)) {
      logger.warn('Import request rows is not an array', { type: typeof rows });
      throw new AppError('"rows" must be an array.', 400);
    }

    if (rows.length === 0) {
      logger.warn('Import request with empty rows array');
      throw new AppError('"rows" array cannot be empty.', 400);
    }

    logger.info('Processing import request', { rowCount: rows.length });

    // ── Delegate to service ───────────────────────────────────
    const result = await processImport(rows);

    // ── Send response ─────────────────────────────────────────
    logger.info('Import request processed successfully', { 
      success: result.success,
      partialSuccess: result.partialSuccess,
      processed: result.processedRecords,
      remaining: result.remainingRecords,
    });
    res.status(200).json(result);
  } catch (err) {
    logger.error('Import request failed', { error: err.message });
    next(err);
  }
}

export { importData };
