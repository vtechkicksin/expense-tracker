const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});


// Test connection on startup
pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// Initialize database schema
async function initializeDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create expenses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
        category VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for filtering by category
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_category 
      ON expenses(category)
    `);

    // Create index for sorting by date
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_date 
      ON expenses(date DESC)
    `);

    // Create idempotency keys table
    await client.query(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key VARCHAR(255) PRIMARY KEY,
        response_data JSONB NOT NULL,
        status_code INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for cleaning up old idempotency keys
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at 
      ON idempotency_keys(created_at)
    `);

    await client.query('COMMIT');
    console.log('Database schema initialized');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Clean up old idempotency keys (run periodically)
async function cleanupIdempotencyKeys() {
  const client = await pool.connect();
  try {
    // Delete keys older than 24 hours
    const result = await client.query(`
      DELETE FROM idempotency_keys 
      WHERE created_at < NOW() - INTERVAL '24 hours'
    `);
    console.log(`Cleaned up ${result.rowCount} old idempotency keys`);
  } catch (error) {
    console.error('Error cleaning up idempotency keys:', error);
  } finally {
    client.release();
  }
}

// Run cleanup every hour
setInterval(cleanupIdempotencyKeys, 60 * 60 * 1000);

module.exports = {
  pool,
  initializeDb,
  cleanupIdempotencyKeys
};