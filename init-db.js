// Database initialization script
const db = require('./api/database');

async function initDB() {
  try {
    console.log('Initializing database...');
    await db.initializeDatabase();
    console.log('✓ Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDB();