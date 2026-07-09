/**
 * Format bytes into a human-readable string (e.g. "1.2 MB").
 *
 * @param {number} bytes - File size in bytes.
 * @returns {string} Formatted size string.
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${size} ${units[i]}`;
}