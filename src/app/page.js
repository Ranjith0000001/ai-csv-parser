'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as ImportedIcon,
  Warning as DuplicateIcon,
  Error as InvalidIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';
import CsvUploadCard from '../components/CsvUploadCard';
import CsvPreviewTable from '../components/CsvPreviewTable';
import { parseCsvFile } from '../utils/csvParser';
import apiClient, { API_ENDPOINTS } from '../config/apiConfig';
import { MaterialReactTable } from 'material-react-table';

/**
 * Home page – orchestrates the CSV upload → parse → preview → import → results flow.
 */
export default function Home() {
  // ── State ────────────────────────────────────────────────────────────
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState('');

  // Import/confirm state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');
  
  // Separate state for table data to ensure proper rendering
  const [originalTableData, setOriginalTableData] = useState([]);
  const [importedTableData, setImportedTableData] = useState([]);
  const [duplicateTableData, setDuplicateTableData] = useState([]);
  const [invalidTableData, setInvalidTableData] = useState([]);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(async (selectedFile) => {
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

  const handleFileRemove = useCallback(() => {
    setFile(null);
    setParsedData(null);
    setParseError('');
    setImportResult(null);
    setImportError('');
    setOriginalTableData([]);
    setImportedTableData([]);
    setDuplicateTableData([]);
    setInvalidTableData([]);
  }, []);

  const normalizeImportResponse = useCallback((response, fallbackRows = []) => {
    const importedRecords = Array.isArray(response?.importedRecords)
      ? response.importedRecords
      : Array.isArray(response?.importedRows)
        ? response.importedRows
        : Array.isArray(response?.data?.importedRecords)
          ? response.data.importedRecords
          : [];

    const duplicateRecords = Array.isArray(response?.duplicateRecords)
      ? response.duplicateRecords
      : Array.isArray(response?.duplicateRows)
        ? response.duplicateRows
        : Array.isArray(response?.data?.duplicateRecords)
          ? response.data.duplicateRecords
          : [];

    const invalidRecords = Array.isArray(response?.invalidRecords)
      ? response.invalidRecords
      : Array.isArray(response?.invalidRows)
        ? response.invalidRows
        : Array.isArray(response?.data?.invalidRecords)
          ? response.data.invalidRecords
          : [];

    const summary = response?.summary || response?.data?.summary || {};

    return {
      ...(response || {}),
      success: response?.success ?? true,
      summary: {
        processed: summary.processed ?? fallbackRows.length,
        imported: summary.imported ?? importedRecords.length,
        duplicates: summary.duplicates ?? duplicateRecords.length,
        invalid: summary.invalid ?? invalidRecords.length,
      },
      originalRows: Array.isArray(response?.originalRows) ? response.originalRows : fallbackRows,
      importedRecords,
      duplicateRecords,
      invalidRecords,
    };
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!parsedData || parsedData.length === 0) return;

    setImporting(true);
    setImportError('');
    setImportResult(null);
    setOriginalTableData([]);
    setImportedTableData([]);
    setDuplicateTableData([]);
    setInvalidTableData([]);

    try {
      const response = await apiClient.post(API_ENDPOINTS.IMPORT_CSV, {
        rows: parsedData,
      });

      const normalizedResponse = normalizeImportResponse(response, parsedData);

      console.log('[Import Response]', normalizedResponse);
      console.log('[Import Response Data]', {
        imported: normalizedResponse.importedRecords?.length,
        duplicates: normalizedResponse.duplicateRecords?.length,
        invalid: normalizedResponse.invalidRecords?.length,
      });

      setImportResult(normalizedResponse);
      setOriginalTableData([...normalizedResponse.originalRows]);
      setImportedTableData([...normalizedResponse.importedRecords]);
      setDuplicateTableData([...normalizedResponse.duplicateRecords]);
      setInvalidTableData([...normalizedResponse.invalidRecords]);
    } catch (err) {
      const message = err.message || 'Failed to import CSV data. Please try again.';
      setImportError(message);
      console.error('[Import Error]', err);
    } finally {
      setImporting(false);
    }
  }, [normalizeImportResponse, parsedData]);

  // ── Derived state ────────────────────────────────────────────────────
  const hasValidData = parsedData && parsedData.length > 0 && !loading;
  const showResults = importResult && importResult.summary;

  // ── Helper: Build MRT columns from data keys ─────────────────────────
  const buildColumns = useCallback((data) => {
    if (!data || data.length === 0) return [];
    const firstRow = data[0];
    // Filter out internal fields that shouldn't be displayed as columns
    const keys = Object.keys(firstRow).filter(key => key !== 'id' && key !== '_id' && key !== '__v');
    return keys.map((key) => ({
      accessorKey: key,
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      size: 180,
      enableClickToCopy: true,
    }));
  }, []);

  // ── Helper: Ensure data objects have proper structure ─────────────────
  const normalizeData = useCallback((data) => {
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.map((row, index) => {
      // If row already has an id, use it; otherwise generate one
      const id = row.id || row._id || `row-${Date.now()}-${index}`;
      return {
        ...row,
        id, // Ensure each row has an ID for MRT
      };
    });
  }, []);

  // ── Memoized columns for each table ──────────────────────────────────
  const originalColumns = useMemo(() => buildColumns(originalTableData), [buildColumns, originalTableData]);
  const importedColumns = useMemo(() => buildColumns(importedTableData), [buildColumns, importedTableData]);
  const duplicateColumns = useMemo(() => buildColumns(duplicateTableData), [buildColumns, duplicateTableData]);
  const invalidColumns = useMemo(() => buildColumns(invalidTableData), [buildColumns, invalidTableData]);

  // ── Memoized normalized data for each table ───────────────────────────
  const normalizedOriginal = useMemo(() => normalizeData(originalTableData), [normalizeData, originalTableData]);
  const normalizedImported = useMemo(() => normalizeData(importedTableData), [normalizeData, importedTableData]);
  const normalizedDuplicate = useMemo(() => normalizeData(duplicateTableData), [normalizeData, duplicateTableData]);
  const normalizedInvalid = useMemo(() => normalizeData(invalidTableData), [normalizeData, invalidTableData]);

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

      {/* ── Preview Table + Confirm Import + Results ─────────── */}
      {hasValidData && (
        <Container maxWidth="xl" disableGutters>
          {/* Show CSV preview + Confirm button BEFORE import */}
          {!showResults && (
            <>
              <CsvPreviewTable
                data={parsedData}
                fileName={file.name}
                fileSize={file.size}
                loading={false}
              />

              {/* Confirm Import Button */}
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

                {/* Import Error Message */}
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
            </>
          )}

          {/* Show results AFTER import */}
          {showResults && (
            <Box sx={{ mt: 4, mb: 2 }}>
              {/* Title */}
              <Typography variant="h5" component="h2" fontWeight={700} sx={{ mb: 3 }}>
                Import Results
              </Typography>

              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight={700}>
                        {importResult.summary.processed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Processed Records
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card sx={{ borderTop: '4px solid #22c55e' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Chip
                        icon={<ImportedIcon />}
                        label={importResult.summary.imported}
                        color="success"
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Imported Records
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card sx={{ borderTop: '4px solid #f97316' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Chip
                        icon={<DuplicateIcon />}
                        label={importResult.summary.duplicates}
                        color="warning"
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Duplicate Records
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card sx={{ borderTop: '4px solid #ef4444' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Chip
                        icon={<InvalidIcon />}
                        label={importResult.summary.invalid}
                        color="error"
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Invalid Records
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Two-Column Result Tables */}
              <Grid container spacing={3}>
                {/* Left: Original CSV Data */}
                {normalizedOriginal.length > 0 && originalColumns.length > 0 && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                      <Box sx={{ px: 3, pt: 3, pb: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="h6" fontWeight={700}>
                          <TableIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Original CSV Data ({normalizedOriginal.length} records)
                        </Typography>
                      </Box>
                      <Box sx={{ px: 2, py: 2 }}>
                        <MaterialReactTable
                          key={`original-table-${originalTableData.length}`}
                          columns={originalColumns}
                          data={normalizedOriginal}
                          getRowId={(row) => row.id}
                          enableStickyHeader
                          enableSorting
                          enableGlobalFilter
                          enableColumnFilters
                          enablePagination
                          initialState={{
                            pagination: { pageSize: 10, pageIndex: 0 },
                            showGlobalFilter: true,
                          }}
                          muiTableContainerProps={{
                            sx: { maxHeight: 500 },
                          }}
                          muiTablePaperProps={{
                            elevation: 0,
                            sx: { borderRadius: 0 },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                )}

                {/* Right: Mapped CRM Records */}
                {normalizedImported.length > 0 && importedColumns.length > 0 && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                      <Box sx={{ px: 3, pt: 3, pb: 2, bgcolor: 'success.contrastText' }}>
                        <Typography variant="h6" fontWeight={700} color="success.main">
                          <TableIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Mapped CRM Records ({normalizedImported.length} records)
                        </Typography>
                      </Box>
                      <Box sx={{ px: 2, py: 2 }}>
                        <MaterialReactTable
                          key={`imported-table-${importedTableData.length}`}
                          columns={importedColumns}
                          data={normalizedImported}
                          getRowId={(row) => row.id}
                          enableStickyHeader
                          enableSorting
                          enableGlobalFilter
                          enableColumnFilters
                          enablePagination
                          initialState={{
                            pagination: { pageSize: 10, pageIndex: 0 },
                            showGlobalFilter: true,
                          }}
                          muiTableContainerProps={{
                            sx: { maxHeight: 500 },
                          }}
                          muiTablePaperProps={{
                            elevation: 0,
                            sx: { borderRadius: 0 },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </Grid>

              {/* Duplicate Records Section */}
              {normalizedDuplicate.length > 0 && duplicateColumns.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ px: 3, pt: 3, pb: 2, bgcolor: 'warning.light' }}>
                      <Typography variant="h6" fontWeight={700} color="warning.dark">
                        <DuplicateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Duplicate Records ({importResult.summary.duplicates})
                      </Typography>
                    </Box>
                    <Box sx={{ px: 2, py: 2 }}>
                      <MaterialReactTable
                        key={`duplicate-table-${duplicateTableData.length}`}
                        columns={duplicateColumns}
                        data={normalizedDuplicate}
                        getRowId={(row) => row.id}
                        enableStickyHeader
                        enableSorting
                        enableGlobalFilter
                        enableColumnFilters
                        enablePagination
                        initialState={{
                          pagination: { pageSize: 10, pageIndex: 0 },
                          showGlobalFilter: true,
                        }}
                        muiTableContainerProps={{
                          sx: { maxHeight: 400 },
                        }}
                        muiTablePaperProps={{
                          elevation: 0,
                          sx: { borderRadius: 0 },
                        }}
                      />
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* Invalid Records Section */}
              {normalizedInvalid.length > 0 && invalidColumns.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ px: 3, pt: 3, pb: 2, bgcolor: 'error.light' }}>
                      <Typography variant="h6" fontWeight={700} color="error.dark">
                        <InvalidIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Invalid Records ({importResult.summary.invalid})
                      </Typography>
                    </Box>
                    <Box sx={{ px: 2, py: 2 }}>
                      <MaterialReactTable
                        key={`invalid-table-${invalidTableData.length}`}
                        columns={invalidColumns}
                        data={normalizedInvalid}
                        getRowId={(row) => row.id}
                        enableStickyHeader
                        enableSorting
                        enableGlobalFilter
                        enableColumnFilters
                        enablePagination
                        initialState={{
                          pagination: { pageSize: 10, pageIndex: 0 },
                          showGlobalFilter: true,
                        }}
                        muiTableContainerProps={{
                          sx: { maxHeight: 400 },
                        }}
                        muiTablePaperProps={{
                          elevation: 0,
                          sx: { borderRadius: 0 },
                        }}
                      />
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* New Upload Button */}
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleFileRemove}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Upload New CSV
                </Button>
              </Box>
            </Box>
          )}
        </Container>
      )}
    </Box>
  );
}