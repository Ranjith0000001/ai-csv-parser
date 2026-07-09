import Papa from 'papaparse';

/**
 * Parses a CSV File object into a JSON array of rows.
 *
 * @param {File} file - The CSV File to parse.
 * @returns {Promise<{ data: object[], errors: object[], meta: object }>}
 */
export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,       // Use first row as column headers
      skipEmptyLines: true,
      dynamicTyping: false, // Keep all values as strings for table display
      complete(results) {
        resolve({
          data: results.data,
          errors: results.errors,
          meta: results.meta,
        });
      },
      error(err) {
        reject(new Error(`CSV parsing failed: ${err.message}`));
      },
    });
  });
}