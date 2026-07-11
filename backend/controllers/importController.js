/**
 * Import controller – handles HTTP request/response for CSV data import.
 *
 * Validates the incoming request body and delegates business logic
 * to the import service. Does NOT contain business logic itself.
 */
const { processImport } = require('../services/importService');
const AppError = require('../utils/AppError');

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
      throw new AppError('Request body must contain a "rows" field.', 400);
    }

    if (!Array.isArray(rows)) {
      throw new AppError('"rows" must be an array.', 400);
    }

    if (rows.length === 0) {
      throw new AppError('"rows" array cannot be empty.', 400);
    }

    // ── Delegate to service ───────────────────────────────────
    const result = processImport(rows);

    // ── Send response ─────────────────────────────────────────
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { importData };