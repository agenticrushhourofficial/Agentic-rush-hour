const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  // Exclude team 77
  const res = await client.query(`
    SELECT id, team_name, college, leader_name, leader_email, leader_phone, team_size, members, status, project_title, problem_statement, project_description, domain 
    FROM registrations 
    WHERE id != 77
    ORDER BY id ASC;
  `);

  const outputPath = path.join(__dirname, 'teams_current_db.json');
  fs.writeFileSync(outputPath, JSON.stringify(res.rows, null, 2), 'utf8');
  console.log(`Exported ${res.rows.length} rows to ${outputPath}`);

  await client.end();
}

main().catch(console.error);
