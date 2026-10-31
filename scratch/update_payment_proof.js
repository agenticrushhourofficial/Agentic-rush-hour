const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const imagePath = 'C:\\Users\\A S U S\\.gemini\\antigravity-ide\\brain\\27d075ab-56fe-4595-b31e-507d6da5bd2c\\media__1783146235034.png';
  if (!fs.existsSync(imagePath)) {
    console.error('❌ Image not found at path:', imagePath);
    await client.end();
    return;
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

  const updateQuery = `
    UPDATE registrations
    SET payment_proof = $1, status = 'verified'
    WHERE id = 73
    RETURNING id, team_name, status;
  `;
  const res = await client.query(updateQuery, [base64Image]);
  if (res.rows.length > 0) {
    console.log(`✅ [Neon DB] Successfully updated team '${res.rows[0].team_name}' (ID: ${res.rows[0].id}) with payment proof. Status is now '${res.rows[0].status}'.`);
  } else {
    console.log('❌ Team ID 73 not found in database.');
  }

  await client.end();
}

main().catch(console.error);
