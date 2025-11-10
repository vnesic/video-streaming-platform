const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migration...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await client.query(schema);
    
    console.log('✓ Database schema created successfully');
    
    // Optional: Insert some sample data
    await insertSampleData(client);
    
    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function insertSampleData(client) {
  console.log('Inserting sample data...');
  
  // Insert sample categories
  await client.query(`
    INSERT INTO categories (name, slug, description) VALUES
    ('Action', 'action', 'High-energy action movies and shows'),
    ('Drama', 'drama', 'Compelling dramatic content'),
    ('Comedy', 'comedy', 'Funny and entertaining content'),
    ('Documentary', 'documentary', 'Real-world documentaries'),
    ('Sci-Fi', 'sci-fi', 'Science fiction content')
    ON CONFLICT (slug) DO NOTHING
  `);
  
  console.log('✓ Sample categories inserted');
}

// Run migration
runMigration()
  .then(() => {
    console.log('Database is ready!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });
