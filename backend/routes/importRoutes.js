/**
 * Import routes – defines API endpoints for CSV data import.
 *
 * Only endpoint definitions live here.
 * Controllers handle request/response. Services handle business logic.
 */
const express = require('express');
const router = express.Router();
const { importData } = require('../controllers/importController');

// POST /api/import – receive parsed CSV rows from the frontend
router.post('/import', importData);

module.exports = router;