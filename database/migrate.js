// database/migrate.js
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ DATABASE_URL is missing. Export it or put it in .env');
  process.exit(1);
}

console.log('🔌 Database Connection');
console.log('Attempting to connect to the database...');
console.log('NODE_ENV =', process.env.NODE_ENV);

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },   // Railway
});

(async () => {
  try {
    await client.connect();
    console.log('✅ Connected.');

    // Sanity check: which DB/user?
    const who = await client.query('select current_database() db, current_user usr, version()');
    console.log('Connected as:', who.rows[0]);

    const schemaPath = path.resolve(__dirname, 'schema.sql');
    console.log('📄 Loading schema from:', schemaPath);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Split on semicolons (rough but good enough if schema.sql is standard)
    // Keep statements that are not empty after trim.
    const statements = sql
      .split(/;\s*$/m)
      .flatMap(chunk => chunk.split(';\n'))
      .map(s => s.trim())
      .filter(Boolean);

    console.log(`🚀 Executing ${statements.length} statements...`);

    // Don’t wrap everything in one transaction: some managed DBs/commands can be picky.
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        console.log(`▶️ [${i + 1}/${statements.length}] ${stmt.slice(0, 120)}${stmt.length > 120 ? '…' : ''}`);
        await client.query(stmt);
      } catch (e) {
        console.error(`❌ Failed at statement [${i + 1}]:\n${stmt}\nError:`, e.message);
        throw e;
      }
    }

    console.log('🎉 Schema applied successfully.');

    // Verify
    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema='public'
      ORDER BY table_name
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
    console.log('👋 Connection closed.');
  }
})();
