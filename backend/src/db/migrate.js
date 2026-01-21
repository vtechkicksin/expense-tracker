require('dotenv').config();
const { initializeDb, pool } = require('./database');

/**
 * Run database migrations
 */
async function runMigrations() {
  console.log('Starting database migration...');
  
  try {
    await initializeDb();
    console.log('✓ Database migration completed successfully');
    
    // Test connection
    const result = await pool.query('SELECT current_database(), current_user');
    console.log(`✓ Connected to database: ${result.rows[0].current_database} as ${result.rows[0].current_user}`);
    
    // Show table info
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\n✓ Tables created:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();