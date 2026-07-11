'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  TableRows as RowsIcon,
  ViewColumn as ColumnsIcon,
  Description as FileIcon,
  Storage as SizeIcon,
} from '@mui/icons-material';
import { MaterialReactTable } from 'material-react-table';
import { formatFileSize } from '../utils/formatFileSize';

/**
 * CsvPreviewTable - Displays parsed CSV data in a premium designed Material React Table.
 */
export default function CsvPreviewTable({ data, fileName, fileSize, loading }) {
  // ── Derive dynamic column definitions from data keys ────────────────
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    
    // Serial number column
    const serialColumn = {
      id: 'serialNo',
      header: 'S.No',
      size: 70,
      enableSorting: false,
      enableColumnFilter: false,
      enableClickToCopy: false,
      Cell: ({ row }) => row.index + 1,
      muiTableBodyCellProps: {
        align: 'center',
        sx: { fontWeight: 600, color: 'text.secondary' },
      },
      muiTableHeadCellProps: {
        align: 'center',
        sx: { fontWeight: 700 },
      },
    };
    
    const dataColumns = keys.map((key) => ({
      accessorKey: key,
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      size: 180,
      enableClickToCopy: true,
    }));
    
    return [serialColumn, ...dataColumns];
  }, [data]);

  const totalRows = data?.length ?? 0;
  const totalColumns = columns.length;

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Paper
      className="glass-panel fade-in-up"
      sx={{
        width: '100%',
        maxWidth: 1200,
        mx: 'auto',
        mt: 4,
        borderRadius: 5,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Accent gradient top border */}
      <Box 
        sx={{ 
          height: 3, 
          width: '100%', 
          background: 'linear-gradient(90deg, #6366f1, #3b82f6)' 
        }} 
      />

      {/* ── Preview Header ──────────────────────────────────── */}
      <Box sx={{ px: { xs: 3, sm: 5 }, pt: { xs: 4, sm: 5 }, pb: 2.5 }}>
        <Typography variant="h6" component="h2" fontWeight={850} sx={{ fontSize: '1.25rem' }}>
          Parsed CSV Data Preview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Verify the contents of the CSV file before running AI column mapping.
        </Typography>

        {/* Summary chips */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1, sm: 2 }}
          sx={{ mt: 2.5, flexWrap: 'wrap', gap: 1 }}
        >
          <Chip
            icon={<FileIcon sx={{ fontSize: '0.9rem !important' }} />}
            label={`File: ${fileName}`}
            variant="outlined"
            size="medium"
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              bgcolor: 'background.paper',
              borderColor: 'primary.light',
              color: 'primary.main',
            }}
          />
          <Chip
            icon={<SizeIcon sx={{ fontSize: '0.9rem !important' }} />}
            label={`Size: ${formatFileSize(fileSize)}`}
            variant="outlined"
            size="medium"
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              bgcolor: 'background.paper',
              borderColor: 'primary.light',
              color: 'primary.main',
            }}
          />
          <Chip
            icon={<RowsIcon sx={{ fontSize: '0.9rem !important' }} />}
            label={`Total Rows: ${totalRows.toLocaleString()}`}
            variant="outlined"
            size="medium"
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              bgcolor: 'rgba(16, 185, 129, 0.05)',
              borderColor: 'success.main',
              color: 'success.main',
            }}
          />
          <Chip
            icon={<ColumnsIcon sx={{ fontSize: '0.9rem !important' }} />}
            label={`Columns: ${totalColumns.toLocaleString()}`}
            variant="outlined"
            size="medium"
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              bgcolor: 'rgba(59, 130, 246, 0.05)',
              borderColor: 'secondary.main',
              color: 'secondary.main',
            }}
          />
        </Stack>
      </Box>

      <Divider sx={{ mx: 5, opacity: 0.5 }} />

      {/* ── MRT Table ───────────────────────────────────────── */}
      <Box sx={{ px: { xs: 2, sm: 4 }, py: 3 }}>
        <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <MaterialReactTable
            columns={columns}
            data={data}
            state={{ isLoading: loading }}
            // ── Feature flags ──────────────────────────────────
            enableStickyHeader
            enableStickyFooter
            enableSorting
            enableGlobalFilter={false}
            enableColumnFilters
            enablePagination
            enableDensityToggle
            enableColumnVisibility
            enableFullScreenToggle
            enableRowNumbers={false}
            enableHiding={false}
            // ── Appearance ─────────────────────────────────────
            muiTableContainerProps={{
              className: 'custom-scrollbar',
              sx: {
                maxHeight: 480,
                bgcolor: 'background.paper',
              },
            }}
            muiTableHeadCellProps={{
              sx: {
                fontWeight: 700,
                fontSize: '0.85rem',
                bgcolor: 'background.default',
                color: 'text.primary',
                borderBottom: '2px solid',
                borderColor: 'divider',
              },
            }}
            muiTableBodyCellProps={{
              sx: {
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 250,
                borderBottom: '1px solid',
                borderColor: 'divider',
              },
            }}
            muiTablePaperProps={{
              sx: {
                boxShadow: 'none',
                bgcolor: 'transparent',
              },
            }}
            // ── Pagination ─────────────────────────────────────
            initialState={{
              pagination: { pageSize: 10, pageIndex: 0 },
              density: 'comfortable',
            }}
            localization={{
              noRecordsToDisplay: 'No CSV rows to display',
            }}
            enableScrollToTopButton={false}
          />
        </Box>
      </Box>
    </Paper>
  );
}