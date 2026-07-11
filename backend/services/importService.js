/**
 * Import service – handles all business logic for CSV data import.
 *
 * Receives parsed CSV rows, sends them to the AI service for CRM field mapping,
 * then validates and deduplicates the mapped records.
 */
import { mapToCrmSchema } from './aiService.js';
import logger from '../utils/logger.js';

/**
 * Clean and normalize a CRM record.
 * - Trims string values
 * - Converts undefined/null to empty strings
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
 * Supports partial success - if AI mapping fails mid-batch, returns processed
 * records with error info for retry of remaining records.
 *
 * @param {object[]} rows - Array of row objects parsed from the CSV.
 * @returns {Promise<{
 *   success: boolean,
 *   partialSuccess: boolean,
 *   error: string | null,
 *   failedBatch: number | null,
 *   totalRecords: number,
 *   processedRecords: number,
 *   remainingRecords: number,
 *   summary: { processed: number, imported: number, duplicates: number, invalid: number },
 *   importedRecords: object[],
 *   duplicateRecords: object[],
 *   invalidRecords: object[]
 * }>}
 */
async function processImport(rows) {
  logger.info('Starting import process', { rowCount: rows.length });

  // Send rows to AI service for intelligent CRM field mapping
  const aiResult = await mapToCrmSchema(rows);

  // Handle partial success from AI service
  if (!aiResult.success && aiResult.partialSuccess) {
    logger.warn('Partial success from AI service', {
      processed: aiResult.processedRecords,
      remaining: aiResult.remainingRecords,
    });

    // Process the successfully mapped records
    const mappedRows = aiResult.data;
    const cleanedRecords = mappedRows.map(cleanRecord);

    const importedRecords = [];
    const duplicateRecords = [];
    const invalidRecords = [];

    const seenEmails = new Set();
    const seenMobiles = new Set();

    for (const record of cleanedRecords) {
      if (!isValidRecord(record)) {
        invalidRecords.push(record);
        continue;
      }

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
      success: false,
      partialSuccess: true,
      error: aiResult.error,
      failedBatch: aiResult.failedBatch,
      totalRecords: aiResult.totalRecords,
      processedRecords: aiResult.processedRecords,
      remainingRecords: aiResult.remainingRecords,
      summary: {
        processed: cleanedRecords.length,
        imported: importedRecords.length,
        duplicates: duplicateRecords.length,
        invalid: invalidRecords.length,
      },
      importedRecords,
      duplicateRecords,
      invalidRecords,
    };
  }

  // Full success - process all records
  const mappedRows = aiResult.data || [];
  const cleanedRecords = mappedRows.map(cleanRecord);

  const importedRecords = [];
  const duplicateRecords = [];
  const invalidRecords = [];

  const seenEmails = new Set();
  const seenMobiles = new Set();

  for (const record of cleanedRecords) {
    if (!isValidRecord(record)) {
      invalidRecords.push(record);
      continue;
    }

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

  logger.info('Import process completed', {
    processed: cleanedRecords.length,
    imported: importedRecords.length,
    duplicates: duplicateRecords.length,
    invalid: invalidRecords.length,
  });

  return {
    success: true,
    partialSuccess: false,
    error: null,
    failedBatch: null,
    totalRecords: rows.length,
    processedRecords: cleanedRecords.length,
    remainingRecords: 0,
    summary: {
      processed: cleanedRecords.length,
      imported: importedRecords.length,
      duplicates: duplicateRecords.length,
      invalid: invalidRecords.length,
    },
    importedRecords,
    duplicateRecords,
    invalidRecords,
  };
}

export { processImport };