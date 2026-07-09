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
 * CsvPreviewTable - Displays parsed CSV data in a Material React Table.
 *
 * Features:
 * - Dynamic columns based on CSV headers
 * - Sticky header, sorting, global search, column filters, pagination
 * - Density toggle, column visibility, full-screen, row numbers
 * - Horizontal scrolling for large datasets
 * - Summary info bar above the table
 * - Friendly empty state when no data is provided
 *
 * @param {object[]}  data     - Array of row objects from parsed CSV.
 * @param {string}    fileName - Name of the uploaded file.
 * @param {number}    fileSize - Size of the uploaded file in bytes.
 * @param {boolean}   loading  - Whether parsing is in progress.
 */
export default function CsvPreviewTable({ data, fileName, fileSize, loading }) {
  // ── Derive dynamic column definitions from data keys ────────────────
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    const firstRow = data[0];
    return Object.keys(firstRow).map((key) => ({
      accessorKey: key,
      header: key,
      size: 180, // reasonable starting width
      enableClickToCopy: true,
    }));
  }, [data]);

  // ── Compute summary stats ───────────────────────────────────────────
  const totalRows = data?.length ?? 0;
  const totalColumns = columns.length;

  // ── Render ──────────────────────────────────────────────────────────
  if (!data || data.length === 0) {
    return null; // handled by parent empty state
  }

  return (
    <Paper
      elevation={4}
      sx={{
        width: '100%',
        maxWidth: 1200,
        mx: 'auto',
        mt: 3,
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      {/* ── Preview Header ──────────────────────────────────── */}
      <Box sx={{ px: { xs: 3, sm: 4 }, pt: { xs: 3, sm: 4 }, pb: 2 }}>
        <Typography variant="h6" component="h2" fontWeight={700}>
          CSV Preview
        </Typography>

        {/* Summary chips */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1, sm: 2 }}
          sx={{ mt: 2, flexWrap: 'wrap' }}
        >
          <Chip
            icon={<FileIcon />}
            label={`File: ${fileName}`}
            variant="outlined"
            color="primary"
            size="small"
          />
          <Chip
            icon={<SizeIcon />}
            label={`Size: ${formatFileSize(fileSize)}`}
            variant="outlined"
            color="primary"
            size="small"
          />
          <Chip
            icon={<RowsIcon />}
            label={`Rows: ${totalRows.toLocaleString()}`}
            variant="outlined"
            color="success"
            size="small"
          />
          <Chip
            icon={<ColumnsIcon />}
            label={`Columns: ${totalColumns.toLocaleString()}`}
            variant="outlined"
            color="info"
            size="small"
          />
        </Stack>
      </Box>

      <Divider sx={{ mx: 3 }} />

      {/* ── MRT Table ───────────────────────────────────────── */}
      <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 2 }}>
        <MaterialReactTable
          columns={columns}
          data={data}
          state={{ isLoading: loading }}
          // ── Feature flags ──────────────────────────────────
          enableStickyHeader
          enableStickyFooter
          enableSorting
          enableGlobalFilter
          enableColumnFilters
          enablePagination
          enableDensityToggle
          enableColumnVisibility
          enableFullScreenToggle
          enableRowNumbers
          enableHiding={false}
          // ── Appearance ─────────────────────────────────────
          muiTableContainerProps={{
            sx: {
              maxHeight: 600,
              '&::-webkit-scrollbar': { width: 8 },
              '&::-webkit-scrollbar-thumb': {
                borderRadius: 4,
                backgroundColor: 'divider',
              },
            },
          }}
          muiTableHeadCellProps={{
            sx: {
              fontWeight: 700,
              backgroundColor: 'grey.50',
            },
          }}
          muiTableBodyCellProps={{
            sx: {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 300,
            },
          }}
          // ── Pagination ─────────────────────────────────────
          initialState={{
            pagination: { pageSize: 25, pageIndex: 0 },
            density: 'comfortable',
            showGlobalFilter: true,
          }}
          // ── Localization ───────────────────────────────────
          localization={{
            noRecordsToDisplay: 'No data to display',
          }}
          // ── Responsive scroll ──────────────────────────────
          enableScrollToTopButton={false}
        />
      </Box>
    </Paper>
  );
}