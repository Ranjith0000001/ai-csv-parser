'use client';

import React from 'react';
import { Box, Container } from '@mui/material';
import CsvUploadCard from '../components/CsvUploadCard';

/**
 * Home page – renders the CSV upload screen centered on a clean dashboard layout.
 */
export default function Home() {
  return (
    <Box
      sx={{
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Container maxWidth="sm" disableGutters>
        <CsvUploadCard />
      </Container>
    </Box>
  );
}