/**
 * Server entry point.
 *
 * Loads environment variables, imports the Express app, and starts listening.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✓ Backend server running on http://localhost:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
});