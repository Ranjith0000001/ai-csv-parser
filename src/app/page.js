'use client';

import React, { useState, useCallback } from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import CsvUploadCard from '../components/CsvUploadCard';
import CsvPreviewTable from '../components/CsvPreviewTable';
import { parseCsvFile } from '../utils/csvParser';

/**
 * Home page – orchestrates the CSV upload → parse → preview flow.
 *
 * Flow:
 * 1. User selects/ drops a .csv file → CsvUploadCard notifies via onFileSelect
 * 2. The file is parsed client-side with PapaParse
 * 3. Parsed data is passed to CsvPreviewTable for interactive display
 * 4. User can remove or replace the file at any time
 */
export default function Home() {
  // ── State ────────────────────────────────────────────────────────────
  const [file, setFile] = useState(null);         // Selected File object
  const [parsedData, setParsedData] = useState(null); // Parsed JSON rows
  const [loading, setLoading] = useState(false);   // Parsing in progress
  const [parseError, setParseError] = useState(''); // CSV parsing error

  // ── Handlers ─────────────────────────────────────────────────────────

  /** Called by CsvUploadCard when a valid CSV file is chosen */
  const handleFileSelect = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setParsedData(null);
    setParseError('');
    setLoading(true);

    try {
      const result = await parseCsvFile(selectedFile);

      // Check if the parsed result has actual data rows
      if (!result.data || result.data.length === 0) {
        setParseError('The CSV file appears to be empty or contains no valid data rows.');
        setParsedData(null);
      } else {
        // Check for parsing errors
        if (result.errors && result.errors.length > 0) {
          // Only show an error if no data was parsed at all
          if (result.data.length === 0) {
            setParseError(
              `CSV parsing failed: ${result.errors[0].message}`
            );
            setParsedData(null);
          }
          // If data exists alongside errors (e.g., some rows malformed), proceed optimistically
        }

        setParsedData(result.data);
      }
    } catch (err) {
      setParseError(err.message || 'An unexpected error occurred while parsing the CSV file.');
      setParsedData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Called by CsvUploadCard when the user removes the file */
  const handleFileRemove = useCallback(() => {
    setFile(null);
    setParsedData(null);
    setParseError('');
  }, []);

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        px: 2,
        py: { xs: 4, md: 6 },
      }}
    >
      <Container maxWidth="sm" disableGutters sx={{ mb: file ? 0 : 0 }}>
        <CsvUploadCard
          file={file}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
        />
      </Container>

      {/* ── Parsing Error ──────────────────────────────────── */}
      {parseError && (
        <Paper
          elevation={2}
          sx={{
            mt: 3,
            p: 3,
            maxWidth: 560,
            width: '100%',
            borderRadius: 3,
            textAlign: 'center',
            bgcolor: 'error.contrastText',
            border: '1px solid',
            borderColor: 'error.light',
          }}
        >
          <Typography variant="body2" color="error">
            {parseError}
          </Typography>
        </Paper>
      )}

      {/* ── Loading State ──────────────────────────────────── */}
      {loading && (
        <Paper
          elevation={2}
          sx={{
            mt: 3,
            p: 3,
            maxWidth: 560,
            width: '100%',
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Parsing CSV file, please wait…
          </Typography>
        </Paper>
      )}

      {/* ── Preview Table ──────────────────────────────────── */}
      {parsedData && file && !loading && (
        <Container maxWidth="lg" disableGutters>
          <CsvPreviewTable
            data={parsedData}
            fileName={file.name}
            fileSize={file.size}
            loading={false}
          />
        </Container>
      )}
    </Box>
  );
}