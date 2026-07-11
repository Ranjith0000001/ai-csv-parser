'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Divider,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  SwapHoriz as ReplaceIcon,
  Description as CsvIcon,
  CheckCircle as CheckedIcon,
} from '@mui/icons-material';

/**
 * CsvUploadCard - A premium drag-and-drop CSV file upload component.
 */
export default function CsvUploadCard({ file, onFileSelect, onFileRemove }) {
  // ── Local UI state ───────────────────────────────────────────────────
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  // ── Constants ──────────────────────────────────────────────────────────
  const ACCEPTED_TYPE = 'text/csv';
  const ACCEPTED_EXTENSION = '.csv';

  // ── Helpers ────────────────────────────────────────────────────────────
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
    return `${size} ${units[i]}`;
  };

  const isValidCsvFile = (selectedFile) => {
    if (!selectedFile) return false;
    const isCsvMime = selectedFile.type === ACCEPTED_TYPE;
    const isCsvExtension = selectedFile.name
      .toLowerCase()
      .endsWith(ACCEPTED_EXTENSION);
    return isCsvMime || isCsvExtension;
  };

  const processFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;
    if (!isValidCsvFile(selectedFile)) {
      setError('Invalid file format. Please upload a standard CSV file (.csv).');
      return;
    }
    onFileSelect?.(selectedFile);
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
    e.target.value = '';
  };

  // ── File Action Handlers ───────────────────────────────────────────────
  const handleRemoveFile = () => {
    setError('');
    onFileRemove?.();
  };

  const handleReplaceFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <Paper
      className="glass-panel glass-panel-hover fade-in-up"
      sx={{
        width: '100%',
        maxWidth: 560,
        mx: 'auto',
        borderRadius: 5,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
      }}
    >
      {/* Top glowing ambient line */}
      <Box 
        sx={{ 
          height: 4, 
          width: '100%', 
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)' 
        }} 
      />

      {/* ── Header ───────────────────────────────────────────── */}
      <Box
        sx={{
          px: { xs: 3, sm: 5 },
          pt: { xs: 4, sm: 5 },
          pb: 3,
          textAlign: 'center',
        }}
      >
        <Box 
          className="animate-float"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))',
            border: '1px solid',
            borderColor: 'primary.light',
            mb: 2.5,
          }}
        >
          <CsvIcon
            sx={{
              fontSize: 38,
              color: 'primary.main',
            }}
          />
        </Box>

        <Typography
          variant="h5"
          component="h1"
          fontWeight={800}
          sx={{ 
            fontSize: { xs: '1.4rem', sm: '1.75rem' },
            background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            '.light &': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }
          }}
        >
          AI CSV CRM Importer
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1.2, maxWidth: 380, mx: 'auto', fontSize: '0.9rem' }}
        >
          Intelligently parse CRM leads, map custom headers with AI, and clean duplicate entries in seconds.
        </Typography>
      </Box>

      <Divider sx={{ mx: 4, opacity: 0.6 }} />

      {/* ── Upload Area ──────────────────────────────────────── */}
      <Box sx={{ px: { xs: 3, sm: 5 }, py: 4 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSION}
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />

        {!file ? (
          <Box
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
            sx={{
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'divider',
              borderRadius: 4,
              p: { xs: 4, sm: 5 },
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              bgcolor: isDragging ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0, 0, 0, 0.02)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'rgba(99, 102, 241, 0.04)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.05)',
              },
            }}
          >
            {isDragging && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  inset: 0, 
                  border: '2px solid #6366f1', 
                  borderRadius: 4,
                  animation: 'glow-pulse 1.5s infinite',
                  pointerEvents: 'none'
                }} 
              />
            )}

            <CloudUploadIcon
              sx={{
                fontSize: 52,
                color: isDragging ? 'primary.main' : 'text.disabled',
                mb: 2,
                transition: 'color 0.25s ease',
              }}
            />
            <Typography
              variant="body1"
              fontWeight={700}
              color={isDragging ? 'primary.main' : 'text.primary'}
            >
              Drag & drop CSV file here
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              or <span style={{ color: '#818cf8', fontWeight: 650 }}>browse local files</span>
            </Typography>
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ mt: 1.5, display: 'block' }}
            >
              Only standard comma-separated .csv files are supported
            </Typography>
          </Box>
        ) : (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 4,
              p: 3,
              borderColor: 'success.main',
              bgcolor: 'rgba(16, 185, 129, 0.04)',
              borderWidth: '1px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Success background glow */}
            <Box 
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0) 70%)',
                pointerEvents: 'none'
              }}
            />

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 2.5,
              }}
            >
              <Box 
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  color: 'success.main'
                }}
              >
                <FileIcon sx={{ fontSize: 26 }} />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    noWrap
                    sx={{ fontSize: '0.95rem' }}
                  >
                    {file.name}
                  </Typography>
                  <CheckedIcon color="success" sx={{ fontSize: 16 }} />
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.25 }}
                >
                  File Size: {formatFileSize(file.size)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={handleReplaceFile}
                  title="Replace file"
                  sx={{
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'primary.light' },
                  }}
                >
                  <ReplaceIcon fontSize="small" />
                </IconButton>

                <IconButton
                  size="small"
                  onClick={handleRemoveFile}
                  title="Remove file"
                  sx={{
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    color: 'error.main',
                    '&:hover': { bgcolor: 'error.light' },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        )}

        {error && (
          <Typography
            variant="body2"
            color="error.main"
            fontWeight={600}
            sx={{ mt: 2, textAlign: 'center' }}
          >
            {error}
          </Typography>
        )}
      </Box>

      {/* ── Footer ───────────────────────────────────────────── */}
      <Box
        sx={{
          px: { xs: 3, sm: 5 },
          pb: { xs: 4, sm: 5 },
          textAlign: 'center',
        }}
      >
        {!file && (
          <Button
            variant="outlined"
            onClick={handleBrowseClick}
            sx={{
              borderRadius: 3,
              borderColor: 'divider',
              color: 'text.primary',
              px: 4,
              py: 1.2,
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'rgba(99, 102, 241, 0.04)',
              }
            }}
          >
            Browse File
          </Button>
        )}
      </Box>
    </Paper>
  );
}