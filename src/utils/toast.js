/**
 * Reusable toast notification utility using react-toastify.
 *
 * Provides helper functions for success, error, info, and warning toasts
 * with consistent styling and positioning.
 *
 * Usage:
 *   import { showSuccess, showError } from '@/utils/toast';
 *   showSuccess('File uploaded successfully');
 *   showError('Invalid file format');
 */

import { toast } from 'react-toastify';

/**
 * Default toast configuration.
 */
const DEFAULT_OPTIONS = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progressStyle: { borderRadius: 4 },
};

/**
 * Show a success toast.

 */
export function showSuccess(message, options = {}) {
  toast.success(message, {
    ...DEFAULT_OPTIONS,
    autoClose: 3000,
    ...options,
  });
}

/**
 * Show an error toast.
 
 */
export function showError(message, options = {}) {
  toast.error(message, {
    ...DEFAULT_OPTIONS,
    autoClose: 4000,
    ...options,
  });
}

/**
 * Show an info toast.
 */
export function showInfo(message, options = {}) {
  toast.info(message, {
    ...DEFAULT_OPTIONS,
    autoClose: 3000,
    ...options,
  });
}

/**
 * Show a warning toast.
 *

 */
export function showWarning(message, options = {}) {
  toast.warning(message, {
    ...DEFAULT_OPTIONS,
    autoClose: 3500,
    ...options,
  });
}

/**
 * Show a loading/dismissable toast that updates on completion.
 * Returns the toast ID so you can call toast.dismiss(id) later.
 */
export function showLoading(message = 'Processing...', options = {}) {
  return toast.loading(message, {
    ...DEFAULT_OPTIONS,
    autoClose: false,
    ...options,
  });
}