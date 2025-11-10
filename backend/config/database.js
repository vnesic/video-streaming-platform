const { Pool } = require('pg');
require('dotenv').config();

// --- Debug block ---
console.log('🔧 Database Configuration Debug Info');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Provided' : '❌ Missing');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '**** (hidden)' : '❌ Missing');
console.log('----------------------------------------');
// -------------------

let poolConfig;

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
  console.log('🧭 Using DATABASE_URL for connection');
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'videostreaming',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
  console.log('🧭 Using manual DB_* variables for connection');
}

// Show effective pool config (sanitized)
console.log('Final poolConfig:', {
  ...poolConfig,
  password: poolConfig.password ? '**** (hidden)' : undefined,
});
console.log('----------------------------------------');

const pool = new Pool(poolConfig);

// --- Connection events ---
pool.on('connect', (client) => {
  console.log('✅ Connected to PostgreSQL host:', client.connectionParameters.host);
  console.log('📦 Database:', client.connectionParameters.database);
});

pool.on('acquire', () => {
  console.log('ℹ️ Client acquired from pool');
});

pool.on('remove', () => {
  console.log('ℹ️ Client removed / connection closed');
});

pool.on('error', (err) => {
  console.error('🚨 Unexpected database error:', err.message);
  console.error('STACK:', err.stack);
  process.exit(-1);
});

// --- Query helper with extended debug ---
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📝 Executed query', { text: text.slice(0, 120), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    console.error('QUERY:', text);
    console.error('PARAMS:', params);
    throw error;
  }
};

// --- Transaction helper ---
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting transaction');
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    console.log('✅ Transaction committed');
    return result;
  } catch (error) {
    console.error('❌ Transaction failed:', error.message);
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    console.log('🔚 Transaction client released');
  }
};

module.exports = {
  pool,
  query,
  transaction,
};
