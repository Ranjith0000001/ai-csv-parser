/**
 * Import service – handles all business logic for CSV data import.
 *
 * Receives parsed CSV rows, sends them to the AI service for CRM field mapping,
 * and returns the mapped records.
 */
const { mapToCrmSchema } = require('./aiService');

/**
 * Process incoming CSV row data through the AI service for CRM field mapping.
 *
 * @param {object[]} rows - Array of row objects parsed from the CSV.
 * @returns {Promise<{ success: boolean, message: string, totalRecords: number, rows: object[] }>}
 */
async function processImport(rows) {
  // Send rows to AI service for intelligent CRM field mapping
  const mappedRows = await mapToCrmSchema(rows);

  return {
    success: true,
    message: 'CSV data received successfully.',
    totalRecords: mappedRows.length,
    rows: mappedRows,
  };
}

module.exports = { processImport };