/**
 * Import service – handles all business logic for CSV data import.
 *
 * Receives parsed CSV rows, sends them to the AI service for CRM field mapping,
 * then validates and deduplicates the mapped records.
 */
const { mapToCrmSchema } = require('./aiService');

/**
 * Clean and normalize a CRM record.
 * - Trims string values
 * - Converts undefined/null to empty strings
 *
 * @param {object} record
 * @returns {object}
 */
function cleanRecord(record) {
  const cleaned = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null) {
      cleaned[key] = '';
    } else if (typeof value === 'string') {
      cleaned[key] = value.trim();
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Check if a record is valid.
 * A record is invalid only if BOTH email and mobile_without_country_code are empty.
 *
 * @param {object} record
 * @returns {boolean}
 */
function isValidRecord(record) {
  const email = (record.email || '').trim();
  const mobile = (record.mobile_without_country_code || '').trim();
  return email !== '' || mobile !== '';
}

/**
 * Process incoming CSV row data through the AI service for CRM field mapping,
 * then validate and deduplicate the results.
 *
 * @param {object[]} rows - Array of row objects parsed from the CSV.
 * @returns {Promise<{
 *   success: boolean,
 *   summary: { processed: number, imported: number, duplicates: number, invalid: number },
 *   importedRecords: object[],
 *   duplicateRecords: object[],
 *   invalidRecords: object[]
 * }>}
 */
async function processImport(rows) {
  // Send rows to AI service for intelligent CRM field mapping
  const mappedRows = await mapToCrmSchema(rows);

  // Clean all records
  const cleanedRecords = mappedRows.map(cleanRecord);

  const importedRecords = [];
  const duplicateRecords = [];
  const invalidRecords = [];

  // Track seen emails and mobiles for duplicate detection
  const seenEmails = new Set();
  const seenMobiles = new Set();

  for (const record of cleanedRecords) {
    // Check validity first
    if (!isValidRecord(record)) {
      invalidRecords.push(record);
      continue;
    }

    // Check for duplicates
    const emailKey = (record.email || '').toLowerCase().trim();
    const mobileKey = (record.mobile_without_country_code || '').trim();

    const isDuplicate = (emailKey && seenEmails.has(emailKey)) ||
                        (mobileKey && seenMobiles.has(mobileKey));

    if (isDuplicate) {
      duplicateRecords.push(record);
    } else {
      importedRecords.push(record);
      if (emailKey) seenEmails.add(emailKey);
      if (mobileKey) seenMobiles.add(mobileKey);
    }
  }

  return {
    success: true,
    summary: {
      processed: cleanedRecords.length,
      imported: importedRecords.length,
      duplicates: duplicateRecords.length,
      invalid: invalidRecords.length,
    },
    originalRows: rows,
    importedRecords,
    importedRows: importedRecords,
    duplicateRecords,
    duplicateRows: duplicateRecords,
    invalidRecords,
    invalidRows: invalidRecords,
  };
}

module.exports = { processImport };