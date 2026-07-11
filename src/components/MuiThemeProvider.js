'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// ── Theme Mode Context ───────────────────────────────────────────────
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light',
});

export const useColorMode = () => useContext(ColorModeContext);

/**
 * MuiThemeProvider - Wraps the app with a modern Light/Dark theme.
 * Integrates with Tailwind class toggle for seamless styling.
 */
export default function MuiThemeProvider({ children }) {
  const [mode, setMode] = useState('light'); // Light mode by default for clean SaaS look

  // Load saved preference
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode) {
      setMode(savedMode);
      if (savedMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Default to light mode
      document.documentElement.classList.remove('dark');
      setMode('light');
      localStorage.setItem('theme-mode', 'light');
    }
  }, []);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const nextMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('theme-mode', nextMode);
          if (nextMode === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return nextMode;
        });
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#6366f1' : '#818cf8', // Indigo
            light: mode === 'light' ? '#eef2ff' : '#1e1b4b',
            dark: mode === 'light' ? '#4f46e5' : '#4f46e5',
            contrastText: '#ffffff',
          },
          secondary: {
            main: mode === 'light' ? '#8b5cf6' : '#a78bfa', // Violet
            light: mode === 'light' ? '#f5f3ff' : '#2e1065',
            dark: mode === 'light' ? '#6d28d9' : '#7c3aed',
          },
          success: {
            main: '#10b981', // Emerald-500
            light: mode === 'light' ? '#ecfdf5' : '#022c22',
            contrastText: '#ffffff',
          },
          warning: {
            main: '#f59e0b', // Amber-500
            light: mode === 'light' ? '#fffbeb' : '#451a03',
            contrastText: '#ffffff',
          },
          error: {
            main: '#ef4444', // Red-500
            light: mode === 'light' ? '#fef2f2' : '#450a0a',
            contrastText: '#ffffff',
          },
          background: {
            default: mode === 'light' ? '#f8fafc' : '#030712',
            paper: mode === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(17, 24, 39, 0.7)',
          },
          text: {
            primary: mode === 'light' ? '#0f172a' : '#f9fafb',
            secondary: mode === 'light' ? '#475569' : '#9ca3af',
            disabled: mode === 'light' ? '#94a3b8' : '#4b5563',
          },
          divider: mode === 'light' ? 'rgba(226, 232, 240, 0.8)' : 'rgba(37, 99, 235, 0.15)',
        },
        shape: {
          borderRadius: 16,
        },
        typography: {
          fontFamily: 'var(--font-geist-sans), "Outfit", "Inter", sans-serif',
          h4: {
            fontWeight: 800,
            letterSpacing: '-0.03em',
          },
          h5: {
            fontWeight: 700,
            letterSpacing: '-0.02em',
          },
          h6: {
            fontWeight: 600,
            letterSpacing: '-0.01em',
          },
          body1: {
            fontSize: '0.975rem',
            lineHeight: 1.6,
          },
          body2: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
          },
          button: {
            fontWeight: 600,
            letterSpacing: '0.01em',
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                transition: 'background-color 0.3s ease, color 0.3s ease',
              },
            },
          },
          MuiPaper: {
            defaultProps: {
              elevation: 0,
            },
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: mode === 'light'
                  ? '0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.01), inset 0 1px 0 rgba(255,255,255,0.7)'
                  : '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 12,
                padding: '10px 24px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(1px)',
                },
              },
              containedPrimary: {
                boxShadow: mode === 'light' 
                  ? '0 4px 14px rgba(99, 102, 241, 0.15)' 
                  : '0 4px 18px rgba(129, 140, 248, 0.2)',
                '&:hover': {
                  boxShadow: mode === 'light'
                    ? '0 6px 20px rgba(99, 102, 241, 0.3)'
                    : '0 6px 24px rgba(129, 140, 248, 0.35)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                border: '1px solid',
                borderColor: mode === 'light' ? 'rgba(226, 232, 240, 0.9)' : 'rgba(37, 99, 235, 0.15)',
                backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.75)' : 'rgba(17, 24, 39, 0.4)',
                boxShadow: mode === 'light'
                  ? '0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.01)'
                  : 'none',
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                borderRadius: 8,
                marginRight: 8,
                minHeight: 44,
                transition: 'all 0.2s ease',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}