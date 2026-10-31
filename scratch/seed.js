const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  const fileContent = fs.readFileSync(path.join(__dirname, '../private/backup_registrations.json'), 'utf8');
  const registrations = JSON.parse(fileContent);

  // Load features mapping
  const featuresPath = path.join(__dirname, '../private/zeroth_hour_features.json');
  let featuresMap = {};
  if (fs.existsSync(featuresPath)) {
    featuresMap = JSON.parse(fs.readFileSync(featuresPath, 'utf8'));
  }

  for (const reg of registrations) {
    const id = reg.id;
    const team_name = reg.team_name || reg.teamName;
    const college = reg.college;
    const leader_name = reg.leader_name || reg.leaderName;
    const leader_email = reg.leader_email || reg.email;
    const leader_phone = reg.leader_phone || reg.phone;
    const team_size = reg.team_size || reg.teamSize;
    const members = JSON.stringify(reg.members || []);
    const payment_proof = reg.payment_proof || null;
    const status = reg.status || 'verified';
    const project_title = reg.project_title || null;
    const problem_statement = reg.problem_statement || null;
    const project_description = reg.project_description || null;
    const domain = reg.domain || null;
    const created_at = reg.created_at || new Date().toISOString();
    const zeroth_hour_feature = featuresMap[String(id)] || null;

    const checkQuery = 'SELECT id FROM registrations WHERE id = $1;';
    const checkResult = await pool.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      const insertQuery = `
        INSERT INTO registrations (id, team_name, college, leader_name, leader_email, leader_phone, team_size, members, payment_proof, status, project_title, problem_statement, project_description, domain, created_at, zeroth_hour_feature)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);
      `;
      await pool.query(insertQuery, [id, team_name, college, leader_name, leader_email, leader_phone, team_size, members, payment_proof, status, project_title, problem_statement, project_description, domain, created_at, zeroth_hour_feature]);
      console.log(`Inserted team: ${team_name} (ID: ${id})`);
    } else {
      // Update existing team feature
      const updateQuery = `
        UPDATE registrations 
        SET zeroth_hour_feature = $1 
        WHERE id = $2;
      `;
      await pool.query(updateQuery, [zeroth_hour_feature, id]);
      console.log(`Updated team feature: ${team_name} (ID: ${id})`);
    }
  }

  // Reset the serial sequence to max id
  await pool.query("SELECT setval('registrations_id_seq', (SELECT MAX(id) FROM registrations));");
  console.log('Sequence reset complete.');
  await pool.end();
}

seed().catch(err => {
  console.error(err);
  pool.end();
});
