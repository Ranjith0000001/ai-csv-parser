/**
 * Import service – handles all business logic for CSV data import.
 *
 * Currently returns the received data without modification.
 * This is the layer where future AI / transformation logic would be added.
 */

/**
 * Process incoming CSV row data.
 *
 * @param {object[]} rows - Array of row objects parsed from the CSV.
 * @returns {{ success: boolean, message: string, totalRecords: number, rows: object[] }}
 */
function processImport(rows) {
  // Business logic placeholder – currently returns data as-is.
  // Future: Gemini AI processing, field mapping, duplicate detection, etc.

  return {
    success: true,
    message: 'CSV data received successfully.',
    totalRecords: rows.length,
    rows, // echo back the received rows
  };
}

module.exports = { processImport };