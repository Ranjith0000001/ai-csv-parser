'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as ImportedIcon,
  Warning as DuplicateIcon,
  Error as InvalidIcon,
  TableChart as TableIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  AutoAwesome as AiIcon,
  Terminal as TerminalIcon,
  Replay as ResetIcon,
  PlayArrow as PlayIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material';
import CsvUploadCard from '../components/CsvUploadCard';
import CsvPreviewTable from '../components/CsvPreviewTable';
import { useColorMode } from '../components/MuiThemeProvider';
import { parseCsvFile } from '../utils/csvParser';
import apiClient, { API_ENDPOINTS } from '../config/apiConfig';
import { MaterialReactTable } from 'material-react-table';

// ── Demo Lead CSV Content ─────────────────────────────────────────────
const DEMO_CSV_DATA = `created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description
2026-05-13 14:20:48,John Doe,john.doe@example.com,+91,9876543210,GrowEasy,Mumbai,Maharashtra,India,test@gmail.com,GOOD_LEAD_FOLLOW_UP,Client is asking to reschedule demo,,,
2026-05-13 14:25:30,Sarah Johnson,sarah.johnson@example.com,+91,9876543211,Tech Solutions,Bangalore,Karnataka,India,test@gmail.com,DID_NOT_CONNECT,"Person was busy, will try again next week",,,
2026-05-13 14:30:15,Rajesh Patel,rajesh.patel@example.com,+91,9876543212,Startup Inc,Delhi,Delhi,India,test@gmail.com,BAD_LEAD,Not interested in our services,,,
2026-05-13 14:35:22,Priya Singh,priya.singh@example.com,+91,9876543213,Enterprise Corp,Pune,Maharashtra,India,test@gmail.com,SALE_DONE,"Deal closed, onboarding in progress",,,`;

const TERMINAL_MESSAGES = [
  'Initializing AI CRM Core mapper...',
  'Ingesting CSV rows (analyzing schema mapping heuristics)...',
  'Connecting to Groq Llama 3.3 API engine...',
  'Analyzing custom columns and mappings...',
  'AI Mapping complete! Processing response arrays...',
  'Running validation rules (validating emails & phone formats)...',
  'Executing deduplication checks (filtering matching emails/phones)...',
  'Synchronizing records with CRM storage context...',
  'Import operation completed successfully!'
];

export default function Home() {
  // ── Context / Custom Hooks ───────────────────────────────────────────
  const { toggleColorMode, mode } = useColorMode();

  // ── State ────────────────────────────────────────────────────────────
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState('');

  // Import/confirm state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');
  
  // Table datasets
  const [originalTableData, setOriginalTableData] = useState([]);
  const [importedTableData, setImportedTableData] = useState([]);
  const [duplicateTableData, setDuplicateTableData] = useState([]);
  const [invalidTableData, setInvalidTableData] = useState([]);

  // Active Results Tab
  const [activeTab, setActiveTab] = useState(0);

  // Holographic Terminal state
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);

  // ── Terminal Loader Effect ──────────────────────────────────────────
  useEffect(() => {
    let interval;
    if (importing) {
      setTerminalLogs([`[SYSTEM] - ${TERMINAL_MESSAGES[0]}`]);
      setCurrentLogIndex(1);
      
      interval = setInterval(() => {
        setCurrentLogIndex((prevIndex) => {
          if (prevIndex < TERMINAL_MESSAGES.length) {
            const timeStr = new Date().toLocaleTimeString();
            setTerminalLogs((prevLogs) => [
              ...prevLogs,
              `[${timeStr}] - ${TERMINAL_MESSAGES[prevIndex]}`
            ]);
            return prevIndex + 1;
          } else {
            clearInterval(interval);
            return prevIndex;
          }
        });
      }, 700);
    } else {
      setTerminalLogs([]);
      setCurrentLogIndex(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [importing]);

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
    setActiveTab(0);
  }, []);

  // Demo CSV data injector
  const handleLoadDemoCSV = useCallback(() => {
    const demoBlob = new Blob([DEMO_CSV_DATA], { type: 'text/csv' });
    const demoFile = new File([demoBlob], 'crm_leads_demo.csv', { type: 'text/csv' });
    handleFileSelect(demoFile);
  }, [handleFileSelect]);

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

      setImportResult(normalizedResponse);
      setOriginalTableData([...normalizedResponse.originalRows]);
      setImportedTableData([...normalizedResponse.importedRecords]);
      setDuplicateTableData([...normalizedResponse.duplicateRecords]);
      setInvalidTableData([...normalizedResponse.invalidRecords]);
    } catch (err) {
      const message = err.message || 'Failed to import CSV data. Please check connection and try again.';
      setImportError(message);
      console.error('[Import Error]', err);
    } finally {
      setImporting(false);
    }
  }, [normalizeImportResponse, parsedData]);

  // ── Derived state ────────────────────────────────────────────────────
  const hasValidData = parsedData && parsedData.length > 0 && !loading;
  const showResults = importResult && importResult.summary;

  // ── Build columns for tables ─────────────────────────────────────────
  const buildColumns = useCallback((data) => {
    if (!data || data.length === 0) return [];
    const firstRow = data[0];
    const keys = Object.keys(firstRow).filter(key => key !== 'id' && key !== '_id' && key !== '__v');
    return keys.map((key) => ({
      accessorKey: key,
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      size: 180,
      enableClickToCopy: true,
    }));
  }, []);

  const normalizeData = useCallback((data) => {
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.map((row, index) => {
      const id = row.id || row._id || `row-${Date.now()}-${index}`;
      return {
        ...row,
        id,
      };
    });
  }, []);

  // Memoized tables columns & values
  const originalColumns = useMemo(() => buildColumns(originalTableData), [buildColumns, originalTableData]);
  const importedColumns = useMemo(() => buildColumns(importedTableData), [buildColumns, importedTableData]);
  const duplicateColumns = useMemo(() => buildColumns(duplicateTableData), [buildColumns, duplicateTableData]);
  const invalidColumns = useMemo(() => buildColumns(invalidTableData), [buildColumns, invalidTableData]);

  const normalizedOriginal = useMemo(() => normalizeData(originalTableData), [normalizeData, originalTableData]);
  const normalizedImported = useMemo(() => normalizeData(importedTableData), [normalizeData, importedTableData]);
  const normalizedDuplicate = useMemo(() => normalizeData(duplicateTableData), [normalizeData, duplicateTableData]);
  const normalizedInvalid = useMemo(() => normalizeData(invalidTableData), [normalizeData, invalidTableData]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        pb: 8,
      }}
    >
      {/* ── Background Blobs ────────────────────────────────── */}
      <div className="bg-blob-container">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
        <div className="bg-blob bg-blob-3"></div>
      </div>

      {/* ── Navbar ───────────────────────────────────────────── */}
      <Box
        className="glass-panel"
        sx={{
          width: '100%',
          py: 1.75,
          px: { xs: 2, md: 6 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderRadius: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            }}
          >
            <AiIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={850} sx={{ lineHeight: 1, letterSpacing: '-0.02em' }}>
              CRM AI CORE
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.72rem' }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', animation: 'glow-pulse 1.5s infinite' }}></span>
              AI Engine Online
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!file && (
            <Button
              variant="text"
              startIcon={<PlayIcon />}
              onClick={handleLoadDemoCSV}
              sx={{
                fontWeight: 650,
                color: 'primary.main',
                fontSize: '0.85rem',
                borderRadius: 2.5,
                bgcolor: 'rgba(99, 102, 241, 0.05)',
                px: 2,
                '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.1)' }
              }}
            >
              Try Demo CSV
            </Button>
          )}

          <IconButton 
            onClick={toggleColorMode} 
            color="inherit" 
            sx={{ 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 2.5, 
              width: 40, 
              height: 40 
            }}
          >
            {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* ── Main Content Area ───────────────────────────────── */}
      <Container maxWidth="xl" sx={{ mt: { xs: 4, md: 6 }, px: 2 }}>
        
        {/* State 1: Choose File Dashboard */}
        {!file && !loading && (
          <Box sx={{ py: { xs: 4, md: 8 } }}>
            <CsvUploadCard
              file={file}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
            />
          </Box>
        )}

        {/* State 2: Loading File Parsing */}
        {loading && (
          <Paper
            className="glass-panel fade-in-up"
            sx={{
              mt: 4,
              p: 6,
              maxWidth: 560,
              mx: 'auto',
              borderRadius: 5,
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CircularProgress size={44} thickness={4} color="primary" sx={{ mb: 3 }} />
            <Typography variant="subtitle1" fontWeight={750}>
              Parsing CSV Dataset
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Reading table fields and formatting rows. Hang tight...
            </Typography>
          </Paper>
        )}

        {/* State 3: Parse Error Card */}
        {parseError && (
          <Paper
            className="glass-panel fade-in-up"
            sx={{
              mt: 4,
              p: 4,
              maxWidth: 560,
              mx: 'auto',
              borderRadius: 5,
              textAlign: 'center',
              bgcolor: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid',
              borderColor: 'error.main',
            }}
          >
            <Typography variant="body1" color="error.main" fontWeight={700}>
              Parsing Error
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {parseError}
            </Typography>
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={handleFileRemove}
              sx={{ mt: 3, borderRadius: 2.5 }}
            >
              Reset Importer
            </Button>
          </Paper>
        )}

        {/* State 4: Data Preview & Trigger Import */}
        {hasValidData && !showResults && !importing && (
          <Box sx={{ width: '100%', mb: 4 }}>
            {/* Import Trigger Box - Top Right */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                mb: 2,
              }}
            >
              <Button
                variant="contained"
                size="large"
                color="primary"
                onClick={handleConfirmImport}
                startIcon={<AiIcon />}
                sx={{
                  minWidth: 240,
                  borderRadius: 3.5,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  py: 1.5,
                  px: 4,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 8px 30px rgba(99, 102, 241, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(99, 102, 241, 0.45)',
                  },
                }}
              >
                Process & Import with AI
              </Button>
            </Box>

            <CsvPreviewTable
              data={parsedData}
              fileName={file.name}
              fileSize={file.size}
              loading={false}
            />

            {importError && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: 3,
                    maxWidth: 500,
                    fontWeight: 600,
                  }}
                >
                  {importError}
                </Alert>
              </Box>
            )}
          </Box>
        )}

        {/* State 5: High-Tech Holographic AI Terminal Processing Overlay */}
        {importing && (
          <Paper
            className="glass-panel radar-scanner fade-in-up"
            sx={{
              mt: 4,
              p: { xs: 3, md: 5 },
              maxWidth: 680,
              mx: 'auto',
              borderRadius: 5,
              border: '1px solid',
              borderColor: 'primary.light',
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(99, 102, 241, 0.1)',
                  color: 'primary.main'
                }}
              >
                <TerminalIcon />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={850}>
                  AI Schema Matching Pipeline
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  LLaMA Model: Mapping CSV headers to CRM entities
                </Typography>
              </Box>
            </Box>

            {/* Simulated Live Console logs */}
            <Box
              sx={{
                bgcolor: 'grey.900',
                borderRadius: 4,
                p: 3,
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.78rem',
                color: '#10b981',
                maxHeight: 280,
                minHeight: 200,
                overflowY: 'auto',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)'
              }}
            >
              {terminalLogs.map((log, idx) => (
                <div key={idx} style={{ opacity: idx === terminalLogs.length - 1 ? 1 : 0.7 }}>
                  {log}
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 7, height: 12, backgroundColor: '#10b981', animation: 'glow-pulse 1s infinite' }} />
              </div>
            </Box>

            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
              Communicating with Groq API endpoints. This may take up to 30 seconds...
            </Typography>
          </Paper>
        )}

        {/* State 6: Executive Results Workspace */}
        {showResults && (
          <Box className="fade-in-up" sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 4 }}>
              <Box>
                <Typography variant="h5" component="h2" fontWeight={850} sx={{ letterSpacing: '-0.02em' }}>
                  Lead Import Insights
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  The AI parser successfully validated and sorted the incoming data rows.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ResetIcon />}
                  onClick={handleFileRemove}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                  }}
                >
                  Import New CSV
                </Button>
              </Box>
            </Box>

            {/* Summary Metrics Cards */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
              {/* Card 1: Processed */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper
                  className="glass-panel"
                  sx={{
                    p: 3,
                    borderRadius: 4.5,
                    borderLeft: '5px solid #6366f1',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    PROCESSED LEADS
                  </Typography>
                  <Typography variant="h4" fontWeight={850} sx={{ mt: 1, color: 'text.primary' }}>
                    {importResult.summary.processed}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
                    <Typography variant="caption" color="text.disabled">
                      Total records analyzed
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Card 2: Imported */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper
                  className="glass-panel"
                  sx={{
                    p: 3,
                    borderRadius: 4.5,
                    borderLeft: '5px solid #10b981',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 30px rgba(16, 185, 129, 0.05)',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    CRM IMPORTED
                  </Typography>
                  <Typography variant="h4" fontWeight={850} sx={{ mt: 1, color: 'success.main' }}>
                    {importResult.summary.imported}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
                    <ImportedIcon color="success" sx={{ fontSize: 13 }} />
                    <Typography variant="caption" color="success.main" fontWeight={600}>
                      Successfully mapped
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Card 3: Duplicates */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper
                  className="glass-panel"
                  sx={{
                    p: 3,
                    borderRadius: 4.5,
                    borderLeft: '5px solid #f59e0b',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    DUPLICATES FILTERED
                  </Typography>
                  <Typography variant="h4" fontWeight={850} sx={{ mt: 1, color: 'warning.main' }}>
                    {importResult.summary.duplicates}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
                    <DuplicateIcon color="warning" sx={{ fontSize: 13 }} />
                    <Typography variant="caption" color="warning.main" fontWeight={600}>
                      Identified & resolved
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Card 4: Invalid */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper
                  className="glass-panel"
                  sx={{
                    p: 3,
                    borderRadius: 4.5,
                    borderLeft: '5px solid #ef4444',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    INVALID RECORDS
                  </Typography>
                  <Typography variant="h4" fontWeight={850} sx={{ mt: 1, color: 'error.main' }}>
                    {importResult.summary.invalid}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
                    <InvalidIcon color="error" sx={{ fontSize: 13 }} />
                    <Typography variant="caption" color="error.main" fontWeight={600}>
                      Missing email/mobile
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Tabbed Workbench Workspace */}
            <Paper
              className="glass-panel"
              sx={{
                borderRadius: 5,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                  px: { xs: 2, md: 4 },
                  pt: 2.5,
                }}
              >
                <Tabs
                  value={activeTab}
                  onChange={(e, newTab) => setActiveTab(newTab)}
                  variant="scrollable"
                  scrollButtons="auto"
                  textColor="primary"
                  indicatorColor="primary"
                  sx={{
                    minHeight: 48,
                    '& .MuiTabs-indicator': {
                      height: 3,
                      borderRadius: '3px 3px 0 0',
                    }
                  }}
                >
                  <Tab
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>Clean CRM Leads</span>
                        <Chip
                          label={normalizedImported.length}
                          size="small"
                          color={activeTab === 0 ? 'success' : 'default'}
                          sx={{
                            fontWeight: 700,
                            height: 18,
                            fontSize: '0.72rem',
                            bgcolor: activeTab === 0 ? 'success.main' : 'divider',
                            color: activeTab === 0 ? 'success.contrastText' : 'text.secondary',
                          }}
                        />
                      </Box>
                    }
                  />
                  <Tab
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>Duplicates</span>
                        <Chip
                          label={normalizedDuplicate.length}
                          size="small"
                          color={activeTab === 1 ? 'warning' : 'default'}
                          sx={{
                            fontWeight: 700,
                            height: 18,
                            fontSize: '0.72rem',
                            bgcolor: activeTab === 1 ? 'warning.main' : 'divider',
                            color: activeTab === 1 ? 'warning.contrastText' : 'text.secondary',
                          }}
                        />
                      </Box>
                    }
                  />
                  <Tab
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>Invalid Records</span>
                        <Chip
                          label={normalizedInvalid.length}
                          size="small"
                          color={activeTab === 2 ? 'error' : 'default'}
                          sx={{
                            fontWeight: 700,
                            height: 18,
                            fontSize: '0.72rem',
                            bgcolor: activeTab === 2 ? 'error.main' : 'divider',
                            color: activeTab === 2 ? 'error.contrastText' : 'text.secondary',
                          }}
                        />
                      </Box>
                    }
                  />
                  <Tab
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>Original CSV</span>
                        <Chip
                          label={normalizedOriginal.length}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            height: 18,
                            fontSize: '0.72rem',
                            bgcolor: 'divider',
                            color: 'text.secondary',
                          }}
                        />
                      </Box>
                    }
                  />
                </Tabs>
              </Box>

              {/* Tab Panels */}
              <Box sx={{ p: { xs: 2, md: 4 } }}>
                {/* Tab 0: Mapped Leads Table */}
                {activeTab === 0 && (
                  <Box className="fade-in-up">
                    {normalizedImported.length > 0 && importedColumns.length > 0 ? (
                      <Box sx={{ borderRadius: 3.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <MaterialReactTable
                          key={`imported-table-${importedTableData.length}`}
                          columns={importedColumns}
                          data={normalizedImported}
                          getRowId={(row) => row.id}
                          enableStickyHeader
                          enableSorting
                          enableColumnFilters
                          enablePagination
                          initialState={{
                            pagination: { pageSize: 10, pageIndex: 0 },
                          }}
                          muiTableContainerProps={{
                            className: 'custom-scrollbar',
                            sx: { maxHeight: 500, bgcolor: 'background.paper' },
                          }}
                          muiTableHeadCellProps={{
                            sx: {
                              fontWeight: 700,
                              bgcolor: 'rgba(16, 185, 129, 0.04)',
                              borderBottom: '2px solid',
                              borderColor: 'success.light',
                            },
                          }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No clean CRM leads were extracted from the dataset.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Tab 1: Duplicate Leads Table */}
                {activeTab === 1 && (
                  <Box className="fade-in-up">
                    {normalizedDuplicate.length > 0 && duplicateColumns.length > 0 ? (
                      <Box sx={{ borderRadius: 3.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <MaterialReactTable
                          key={`duplicate-table-${duplicateTableData.length}`}
                          columns={duplicateColumns}
                          data={normalizedDuplicate}
                          getRowId={(row) => row.id}
                          enableStickyHeader
                          enableSorting
                          enableColumnFilters
                          enablePagination
                          initialState={{
                            pagination: { pageSize: 10, pageIndex: 0 },
                          }}
                          muiTableContainerProps={{
                            className: 'custom-scrollbar',
                            sx: { maxHeight: 500, bgcolor: 'background.paper' },
                          }}
                          muiTableHeadCellProps={{
                            sx: {
                              fontWeight: 700,
                              bgcolor: 'rgba(245, 158, 11, 0.04)',
                              borderBottom: '2px solid',
                              borderColor: 'warning.light',
                            },
                          }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Perfect! No duplicate records were found in this dataset.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Tab 2: Invalid Leads Table */}
                {activeTab === 2 && (
                  <Box className="fade-in-up">
                    {normalizedInvalid.length > 0 && invalidColumns.length > 0 ? (
                      <Box sx={{ borderRadius: 3.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <MaterialReactTable
                          key={`invalid-table-${invalidTableData.length}`}
                          columns={invalidColumns}
                          data={normalizedInvalid}
                          getRowId={(row) => row.id}
                          enableStickyHeader
                          enableSorting
                          enableColumnFilters
                          enablePagination
                          initialState={{
                            pagination: { pageSize: 10, pageIndex: 0 },
                          }}
                          muiTableContainerProps={{
                            className: 'custom-scrollbar',
                            sx: { maxHeight: 500, bgcolor: 'background.paper' },
                          }}
                          muiTableHeadCellProps={{
                            sx: {
                              fontWeight: 700,
                              bgcolor: 'rgba(239, 68, 68, 0.04)',
                              borderBottom: '2px solid',
                              borderColor: 'error.light',
                            },
                          }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Excellent! All records had valid email or phone identifiers.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Tab 3: Original Input CSV Data */}
                {activeTab === 3 && (
                  <Box className="fade-in-up">
                    {normalizedOriginal.length > 0 && originalColumns.length > 0 ? (
                      <Box sx={{ borderRadius: 3.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <MaterialReactTable
                          key={`original-table-${originalTableData.length}`}
                          columns={originalColumns}
                          data={normalizedOriginal}
                          getRowId={(row) => row.id}
                          enableStickyHeader
                          enableSorting
                          enableColumnFilters
                          enablePagination
                          initialState={{
                            pagination: { pageSize: 10, pageIndex: 0 },
                          }}
                          muiTableContainerProps={{
                            className: 'custom-scrollbar',
                            sx: { maxHeight: 500, bgcolor: 'background.paper' },
                          }}
                          muiTableHeadCellProps={{
                            sx: {
                              fontWeight: 700,
                              bgcolor: 'background.default',
                              borderBottom: '2px solid',
                              borderColor: 'divider',
                            },
                          }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No original rows available to display.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        )}
      </Container>
    </Box>
  );
}