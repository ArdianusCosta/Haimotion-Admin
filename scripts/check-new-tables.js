const { Client } = require('pg');

async function main() {
  const pgUrl = "postgresql://postgres.xvsvtojfhjxdgvdqmjus:costaaja021107@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";
  const client = new Client({
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('push_subscriptions', 'notifications');
    `);
    console.log('Tables found:', tables.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
