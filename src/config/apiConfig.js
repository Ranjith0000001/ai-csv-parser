import axios from 'axios';

/**
 * API Configuration – creates a reusable Axios instance for all backend calls.
 *
 * - Reads the backend base URL from the environment variable.
 * - Configures request/response interceptors for common handling.
 * - Exports the Axios instance together with all API endpoint paths.
 */

// ── Base URL ───────────────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

// ── Axios Instance ─────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds – CSV payloads can be large
});

// ── Request Interceptor ────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Future: attach auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ── Response Interceptor ───────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    // Return data directly for successful responses
    return response.data;
  },
  (error) => {
    // Normalize API errors into a consistent format
    const normalizedError = {
      message: 'An unexpected error occurred.',
      status: null,
      originalError: error,
    };

    if (error.response) {
      // Server responded with an error status
      normalizedError.status = error.response.status;
      normalizedError.message =
        error.response.data?.message ||
        `Request failed with status ${error.response.status}`;
    } else if (error.request) {
      // No response received (network error, timeout, etc.)
      normalizedError.message =
        'Unable to reach the server. Please check your connection and try again.';
    } else {
      normalizedError.message = error.message;
    }

    console.error('[API Error]', normalizedError);
    return Promise.reject(normalizedError);
  }
);

// ── API Endpoints ──────────────────────────────────────────────────────
// All API calls throughout the project should use these constants
// together with the exported apiClient instance.
export const API_ENDPOINTS = {
  IMPORT_CSV: '/import',
  HEALTH: '/health',
};

export default apiClient;