'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import CsvUploadCard from '../components/CsvUploadCard';
import CsvPreviewTable from '../components/CsvPreviewTable';
import { parseCsvFile } from '../utils/csvParser';
import apiClient, { API_ENDPOINTS } from '../config/apiConfig';

/**
 * Home page – orchestrates the CSV upload → parse → preview → import flow.
 *
 * Flow:
 * 1. User selects/drops a .csv file → CsvUploadCard notifies via onFileSelect
 * 2. The file is parsed client-side with PapaParse
 * 3. Parsed data is passed to CsvPreviewTable for interactive display
 * 4. User clicks "Confirm Import" → parsed rows are sent to the backend API
 * 5. Backend response is logged to the console and displayed on screen
 */
export default function Home() {
  // ── State ────────────────────────────────────────────────────────────
  const [file, setFile] = useState(null);            // Selected File object
  const [parsedData, setParsedData] = useState(null); // Parsed JSON rows
  const [loading, setLoading] = useState(false);     // Parsing in progress
  const [parseError, setParseError] = useState('');  // CSV parsing error

  // Import/confirm state
  const [importing, setImporting] = useState(false); // Import request in progress
  const [importResult, setImportResult] = useState(null); // Successful response
  const [importError, setImportError] = useState('');    // Import failure message

  // ── Handlers ─────────────────────────────────────────────────────────

  /** Called by CsvUploadCard when a valid CSV file is chosen */
  const handleFileSelect = useCallback(async (selectedFile) => {
    // Reset all state when a new file is selected
    setFile(selectedFile);
    setParsedData(null);
    setParseError('');
    setImportResult(null);
    setImportError('');
    setLoading(true);

    try {
      const result = await parseCsvFile(selectedFile);

      if (!result.data || result.data.length === 0) {
        setParseError('The CSV file appears to be empty or contains no valid data rows.');
        setParsedData(null);
      } else {
        if (result.errors && result.errors.length > 0 && result.data.length === 0) {
          setParseError(`CSV parsing failed: ${result.errors[0].message}`);
          setParsedData(null);
        } else {
          setParsedData(result.data);
        }
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
    setImportResult(null);
    setImportError('');
  }, []);

  /** Send parsed CSV rows to the backend API */
  const handleConfirmImport = useCallback(async () => {
    if (!parsedData || parsedData.length === 0) return;

    // Prevent multiple clicks
    setImporting(true);
    setImportError('');
    setImportResult(null);

    try {
      const response = await apiClient.post(API_ENDPOINTS.IMPORT_CSV, {
        rows: parsedData,
      });

      // Log response to console as required
      console.log('[Import Response]', response);

      setImportResult(response);
    } catch (err) {
      const message = err.message || 'Failed to import CSV data. Please try again.';
      setImportError(message);
      console.error('[Import Error]', err);
    } finally {
      setImporting(false);
    }
  }, [parsedData]);

  // ── Derived state ────────────────────────────────────────────────────
  const hasValidData = parsedData && parsedData.length > 0 && !loading;

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
      {/* ── Upload Card ──────────────────────────────────────── */}
      <Container maxWidth="sm" disableGutters>
        <CsvUploadCard
          file={file}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
        />
      </Container>

      {/* ── Parsing Error ────────────────────────────────────── */}
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

      {/* ── Parsing Loading State ────────────────────────────── */}
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

      {/* ── Preview Table ────────────────────────────────────── */}
      {hasValidData && (
        <Container maxWidth="lg" disableGutters>
          <CsvPreviewTable
            data={parsedData}
            fileName={file.name}
            fileSize={file.size}
            loading={false}
          />

          {/* ── Confirm Import Section ───────────────────────── */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mt: 3,
              mb: 2,
            }}
          >
            <Button
              variant="contained"
              size="large"
              color="primary"
              disabled={importing}
              onClick={handleConfirmImport}
              startIcon={
                importing ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CloudUploadIcon />
                )
              }
              sx={{
                minWidth: 240,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                py: 1.5,
                px: 4,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
                },
                '&:disabled': {
                  opacity: 0.7,
                },
              }}
            >
              {importing ? 'Importing…' : 'Confirm Import'}
            </Button>

            {/* ── Import Success Message ─────────────────────── */}
            {importResult && (
              <Alert
                icon={<SuccessIcon fontSize="inherit" />}
                severity="success"
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  width: '100%',
                  maxWidth: 500,
                }}
              >
                {importResult.message || 'CSV data received successfully.'}
                {importResult.totalRecords !== undefined && (
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{ ml: 1, fontWeight: 600 }}
                  >
                    ({importResult.totalRecords.toLocaleString()} records imported)
                  </Typography>
                )}
              </Alert>
            )}

            {/* ── Import Error Message ───────────────────────── */}
            {importError && (
              <Alert
                severity="error"
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  width: '100%',
                  maxWidth: 500,
                }}
              >
                {importError}
              </Alert>
            )}
          </Box>
        </Container>
      )}
    </Box>
  );
}