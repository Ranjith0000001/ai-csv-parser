'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  IconButton,
  Divider,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  SwapHoriz as ReplaceIcon,
  Description as CsvIcon,
} from '@mui/icons-material';

/**
 * CsvUploadCard - A drag-and-drop CSV file upload component with Material UI.
 *
 * Features:
 * - Drag & Drop zone with visual feedback
 * - Browse file button fallback
 * - Accepts only .csv files
 * - Displays file info (name, size) after selection
 * - Remove / Replace file buttons
 * - Responsive layout (mobile, tablet, desktop)
 *
 * @returns {JSX.Element}
 */
export default function CsvUploadCard() {
  // ── State ──────────────────────────────────────────────────────────────
  const [file, setFile] = useState(null);        // Selected File object
  const [error, setError] = useState('');         // Validation error message
  const [isDragging, setIsDragging] = useState(false); // Drag over state

  const fileInputRef = useRef(null);              // Hidden file input ref

  // ── Constants ──────────────────────────────────────────────────────────
  const ACCEPTED_TYPE = 'text/csv';
  const ACCEPTED_EXTENSION = '.csv';
  const MAX_FILE_SIZE_MB = 50; // Optional: could enforce max size

  // ── Helpers ────────────────────────────────────────────────────────────

  /** Format bytes into a human-readable string (e.g. "1.2 MB") */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
    return `${size} ${units[i]}`;
  };

  /** Validate the dropped/selected file is a CSV */
  const isValidCsvFile = (selectedFile) => {
    if (!selectedFile) return false;

    // Check MIME type (browser's best-effort) OR extension fallback
    const isCsvMime = selectedFile.type === ACCEPTED_TYPE;
    const isCsvExtension = selectedFile.name
      .toLowerCase()
      .endsWith(ACCEPTED_EXTENSION);

    return isCsvMime || isCsvExtension;
  };

  /** Process and validate a file candidate */
  const processFile = (selectedFile) => {
    setError(''); // Clear previous error

    if (!selectedFile) return;

    if (!isValidCsvFile(selectedFile)) {
      setError('Invalid file type. Please upload a CSV file (.csv).');
      setFile(null);
      return;
    }

    // File is valid – store it (no auto-upload)
    setFile(selectedFile);
  };

  // ── Drag & Drop Handlers ───────────────────────────────────────────────

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Keep highlight while hovering
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    processFile(droppedFile);
  }, []);

  // ── Browse / Input Handler ─────────────────────────────────────────────

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    processFile(selectedFile);
    // Reset input so selecting the same file again triggers onChange
    e.target.value = '';
  };

  // ── File Action Handlers ───────────────────────────────────────────────

  const handleRemoveFile = () => {
    setFile(null);
    setError('');
  };

  const handleReplaceFile = () => {
    fileInputRef.current?.click();
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <Paper
      elevation={4}
      sx={{
        width: '100%',
        maxWidth: 560,
        mx: 'auto',
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
        },
      }}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <Box
        sx={{
          px: { xs: 3, sm: 4 },
          pt: { xs: 3, sm: 4 },
          pb: 2,
          textAlign: 'center',
        }}
      >
        {/* App Icon / Logo */}
        <CsvIcon
          sx={{
            fontSize: 48,
            color: 'primary.main',
            mb: 1.5,
          }}
        />

        {/* Title */}
        <Typography
          variant="h5"
          component="h1"
          fontWeight={700}
          sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
        >
          AI Powered CSV Importer
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.75, maxWidth: 400, mx: 'auto' }}
        >
          Upload any CRM CSV file to intelligently extract and map lead information.
        </Typography>
      </Box>

      <Divider sx={{ mx: 3 }} />

      {/* ── Upload Area ──────────────────────────────────────── */}
      <Box sx={{ px: { xs: 3, sm: 4 }, py: 3 }}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSION}
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />

        {!file ? (
          /* ── Drop Zone (no file selected) ──────────────────── */
          <Box
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
            sx={{
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'divider',
              borderRadius: 3,
              p: { xs: 3, sm: 4 },
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              bgcolor: isDragging
                ? 'primary.light'
                : 'grey.50',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.light',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              },
            }}
          >
            <CloudUploadIcon
              sx={{
                fontSize: 56,
                color: isDragging ? 'primary.dark' : 'text.disabled',
                mb: 1.5,
                transition: 'color 0.25s ease',
              }}
            />
            <Typography
              variant="body1"
              fontWeight={600}
              color={isDragging ? 'primary.dark' : 'text.primary'}
              sx={{ transition: 'color 0.25s ease' }}
            >
              Drag & Drop CSV here or click to browse
            </Typography>
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ mt: 0.5, display: 'block' }}
            >
              Only .csv files are accepted
            </Typography>
          </Box>
        ) : (
          /* ── File Info Card (file selected) ────────────────── */
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 3,
              p: 2.5,
              borderColor: 'success.light',
              bgcolor: 'success.contrastText',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
            >
              {/* File icon */}
              <FileIcon
                sx={{ fontSize: 40, color: 'success.main' }}
              />

              {/* File details */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  noWrap
                >
                  {file.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {formatFileSize(file.size)}
                </Typography>
              </Box>

              {/* Action buttons */}
              <Stack direction="row" spacing={0.5}>
                {/* Replace file */}
                <IconButton
                  size="small"
                  color="primary"
                  onClick={handleReplaceFile}
                  title="Replace file"
                  sx={{
                    transition: 'transform 0.2s ease',
                    '&:hover': { transform: 'scale(1.1)' },
                  }}
                >
                  <ReplaceIcon fontSize="small" />
                </IconButton>

                {/* Remove file */}
                <IconButton
                  size="small"
                  color="error"
                  onClick={handleRemoveFile}
                  title="Remove file"
                  sx={{
                    transition: 'transform 0.2s ease',
                    '&:hover': { transform: 'scale(1.1)' },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </Paper>
        )}

        {/* ── Error Message ──────────────────────────────────── */}
        {error && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mt: 1.5, textAlign: 'center' }}
          >
            {error}
          </Typography>
        )}
      </Box>

      {/* ── Footer / Browse fallback ─────────────────────────── */}
      <Box
        sx={{
          px: { xs: 3, sm: 4 },
          pb: { xs: 3, sm: 4 },
          textAlign: 'center',
        }}
      >
        <Button
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          onClick={handleBrowseClick}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            },
          }}
        >
          {file ? 'Browse another file' : 'Browse Files'}
        </Button>
      </Box>
    </Paper>
  );
}