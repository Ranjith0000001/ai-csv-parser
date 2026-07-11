/**
 * Server entry point.
 *
 * Loads environment variables, imports the Express app, and starts listening.
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import app from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✓ Backend server running on http://localhost:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
});