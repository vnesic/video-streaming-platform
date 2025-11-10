#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printSeparator() {
  console.log('='.repeat(60));
}

async function setupDatabase() {
  printSeparator();
  log('Video Streaming Platform - Database Setup', 'cyan');
  printSeparator();
  console.log();

  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

  // Check if DATABASE_URL exists first (Railway/Heroku style)
  let connectionConfig;
  
  if (process.env.DATABASE_URL) {
    log('✓ Found DATABASE_URL', 'green');
    connectionConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  } else {
    log('✓ Using individual DB config variables', 'green');
    connectionConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'videostreaming',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };
  }

  log('\nAttempting to connect to database...', 'blue');
  
  const pool = new Pool(connectionConfig);

  try {
    // Test connection
    const testResult = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    log('✓ Successfully connected to PostgreSQL', 'green');
    log(`  Time: ${testResult.rows[0].current_time}`, 'cyan');
    log(`  Version: ${testResult.rows[0].pg_version.split(',')[0]}`, 'cyan');
    console.log();

    // Check if tables already exist
    const tableCheck = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    if (tableCheck.rows.length > 0) {
      log('⚠ Warning: Database already contains tables:', 'yellow');
      tableCheck.rows.forEach(row => log(`  - ${row.tablename}`, 'yellow'));
      console.log();
      
      log('Running in AUTO mode: Skipping drop, will only create missing tables', 'blue');
      console.log();
    }

    // Read and execute schema
    log('Reading schema file...', 'blue');
    const schemaPath = path.join(__dirname, 'database/schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    log('✓ Schema file loaded', 'green');
    console.log();

    // Execute schema
    log('Executing database schema...', 'blue');
    await pool.query(schema);
    log('✓ Database schema executed successfully', 'green');
    console.log();

    // Insert sample categories
    log('Inserting sample data...', 'blue');
    try {
      await pool.query(`
        INSERT INTO categories (name, slug, description) VALUES
        ('Action', 'action', 'High-energy action movies and shows'),
        ('Drama', 'drama', 'Compelling dramatic content'),
        ('Comedy', 'comedy', 'Funny and entertaining content'),
        ('Documentary', 'documentary', 'Real-world documentaries'),
        ('Sci-Fi', 'sci-fi', 'Science fiction content'),
        ('Horror', 'horror', 'Scary and thrilling content'),
        ('Romance', 'romance', 'Love stories and romantic content'),
        ('Thriller', 'thriller', 'Suspenseful and exciting content')
        ON CONFLICT (slug) DO NOTHING
      `);
      log('✓ Sample categories inserted', 'green');
    } catch (err) {
      if (err.code === '23505') {
        log('✓ Categories already exist, skipping', 'yellow');
      } else {
        throw err;
      }
    }
    console.log();

    // Verify all tables were created
    log('Verifying database setup...', 'blue');
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    log('✓ Tables created successfully:', 'green');
    tablesResult.rows.forEach(row => {
      log(`  ✓ ${row.tablename}`, 'green');
    });
    console.log();

    // Show table counts
    const tables = ['users', 'subscriptions', 'videos', 'categories', 'watch_history', 'payment_history', 'refresh_tokens'];
    log('Current table counts:', 'blue');
    for (const table of tables) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        log(`  ${table}: ${countResult.rows[0].count} rows`, 'cyan');
      } catch (err) {
        // Table might not exist yet
      }
    }
    console.log();

    printSeparator();
    log('✓ DATABASE SETUP COMPLETED SUCCESSFULLY!', 'green');
    printSeparator();
    console.log();
    log('Next steps:', 'cyan');
    log('1. Start your backend server: cd backend && npm start', 'white');
    log('2. Test the API: curl http://localhost:5000/health', 'white');
    log('3. Start your frontend: cd frontend && npm start', 'white');
    console.log();

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.log();
    printSeparator();
    log('✗ DATABASE SETUP FAILED', 'red');
    printSeparator();
    console.log();
    
    log('Error details:', 'red');
    log(error.message, 'red');
    console.log();

    if (error.code === 'ECONNREFUSED') {
      log('Connection refused. This usually means:', 'yellow');
      log('1. PostgreSQL is not running', 'yellow');
      log('2. Wrong host/port in environment variables', 'yellow');
      log('3. Database not accessible from this location', 'yellow');
      console.log();
      log('Current connection config:', 'cyan');
      if (process.env.DATABASE_URL) {
        log(`  DATABASE_URL: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`, 'cyan');
      } else {
        log(`  DB_HOST: ${process.env.DB_HOST || 'localhost'}`, 'cyan');
        log(`  DB_PORT: ${process.env.DB_PORT || 5432}`, 'cyan');
        log(`  DB_NAME: ${process.env.DB_NAME || 'videostreaming'}`, 'cyan');
        log(`  DB_USER: ${process.env.DB_USER || 'postgres'}`, 'cyan');
      }
      console.log();
      log('Solutions:', 'green');
      log('• For Railway: Add DATABASE_URL from Railway dashboard', 'white');
      log('• For local: Make sure PostgreSQL is running (brew services start postgresql)', 'white');
      log('• For Docker: Use service name instead of localhost', 'white');
    } else if (error.code === '3D000') {
      log('Database does not exist!', 'yellow');
      log(`Create it first: createdb ${process.env.DB_NAME || 'videostreaming'}`, 'white');
    } else if (error.code === '28P01') {
      log('Authentication failed!', 'yellow');
      log('Check your DB_USER and DB_PASSWORD environment variables', 'white');
    }

    console.log();
    log('Full error stack:', 'red');
    console.error(error);
    
    await pool.end();
    process.exit(1);
  }
}

// Run the setup
setupDatabase();