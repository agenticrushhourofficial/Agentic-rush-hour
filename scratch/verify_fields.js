const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const res = await client.query('SELECT * FROM registrations WHERE id = 66;');
  console.log("Team 66 current details:");
  const row = { ...res.rows[0] };
  delete row.payment_proof; // keep output clean
  console.log(JSON.stringify(row, null, 2));

  await client.end();
}

main().catch(console.error);
