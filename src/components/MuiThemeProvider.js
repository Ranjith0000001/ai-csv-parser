'use client';

import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

/**
 * MuiThemeProvider - Wraps the app with a modern light MUI theme.
 *
 * Provides:
 * - Light dashboard-style palette
 * - Rounded corners by default
 * - Smooth transitions
 * - CSS baseline reset
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1', // Indigo-500
      light: '#eef2ff', // Indigo-50
      dark: '#4f46e5',  // Indigo-600
      contrastText: '#ffffff',
    },
    success: {
      main: '#22c55e',  // Green-500
      light: '#bbf7d0', // Green-200
      contrastText: '#f0fdf4', // Green-50
    },
    error: {
      main: '#ef4444',  // Red-500
    },
    background: {
      default: '#f8fafc', // Slate-50
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',  // Slate-800
      secondary: '#64748b', // Slate-500
      disabled: '#94a3b8',  // Slate-400
    },
    divider: '#e2e8f0', // Slate-200
    grey: {
      50: '#f8fafc',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      letterSpacing: '-0.02em',
    },
    body2: {
      lineHeight: 1.6,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          padding: '8px 20px',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
});

export default function MuiThemeProvider({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}