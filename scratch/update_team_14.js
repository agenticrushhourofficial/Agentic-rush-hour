const { Client } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const newMembers = [
  {
    "name": "KALAIYARASAN K",
    "email": "kalaiyarasankalai044@gmail.com",
    "college": "VEL TECH HIGH TECHDR.RANGARAJAN DRSAKUNTALA ENGINEERING COLLEGE",
    "city": "Chennai",
    "year": "III"
  },
  {
    "name": "MADHUMITHA G",
    "email": "madhumithagopinath13@gmail.com",
    "college": "VEL TECH HIGH TECHDR.RANGARAJAN DRSAKUNTALA ENGINEERING COLLEGE",
    "city": "Chennai",
    "year": "III"
  },
  {
    "name": "LOKESH M",
    "email": "lokeshlokesh00051@gmail.com",
    "college": "VEL TECH HIGH TECHDR.RANGARAJAN DRSAKUNTALA ENGINEERING COLLEGE",
    "city": "Chennai",
    "year": "III"
  },
  {
    "name": "NIVEDHA V",
    "email": "nivedha21005@gmail.com",
    "college": "VEL TECH HIGH TECHDR.RANGARAJAN DRSAKUNTALA ENGINEERING COLLEGE",
    "city": "Chennai",
    "year": "III"
  },
  {
    "name": "LAKSHMI  SRUTHI .R",
    "email": "ramichettylakshmisruthi@gmail.com",
    "college": "VEL TECH HIGH TECHDR.RANGARAJAN DRSAKUNTALA ENGINEERING COLLEGE",
    "city": "Chennai",
    "year": "III"
  },
  {
    "name": "PRAVEENA  M",
    "email": "praveena0369@gmail.com",
    "college": "VEL TECH HIGH TECHDR.RANGARAJAN DRSAKUNTALA ENGINEERING COLLEGE",
    "city": "Chennai",
    "year": "III"
  }
];

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  // First fetch the current team details to keep any properties we don't want to lose (e.g. team_name, college etc.)
  const fetchRes = await client.query('SELECT * FROM registrations WHERE id = 14');
  if (fetchRes.rows.length === 0) {
    console.log('Failed to find Team 14 in database.');
    await client.end();
    return;
  }

  const currentTeam = fetchRes.rows[0];
  console.log('Current Team details:', {
    id: currentTeam.id,
    team_name: currentTeam.team_name,
    college: currentTeam.college,
    leader_name: currentTeam.leader_name,
    leader_email: currentTeam.leader_email,
    leader_phone: currentTeam.leader_phone,
    team_size: currentTeam.team_size
  });

  const updateQuery = `
    UPDATE registrations
    SET 
      leader_name = $1,
      leader_email = $2,
      leader_phone = $3,
      members = $4,
      team_size = $5,
      college = $6
    WHERE id = 14
    RETURNING *;
  `;

  const values = [
    'KALAIYARASAN K',
    'kalaiyarasankalai044@gmail.com',
    '+91 6383458069',
    JSON.stringify(newMembers),
    newMembers.length,
    'VEL TECH HIGH TECHDR.RANGARAJAN DRSAKUNTALA ENGINEERING COLLEGE'
  ];

  const res = await client.query(updateQuery, values);
  if (res.rows.length > 0) {
    console.log('Update Successful in Neon PostgreSQL for Team 14:');
    const row = { ...res.rows[0] };
    delete row.payment_proof; // keep output clean
    console.log(JSON.stringify(row, null, 2));

    // Update private/backup_registrations.json as well so it persists locally
    try {
      const backupPath = path.join(__dirname, '../private/backup_registrations.json');
      if (fs.existsSync(backupPath)) {
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        const teamIndex = backupData.findIndex(t => t.id === 14);
        if (teamIndex !== -1) {
          backupData[teamIndex].leader_name = 'KALAIYARASAN K';
          backupData[teamIndex].leader_email = 'kalaiyarasankalai044@gmail.com';
          backupData[teamIndex].leader_phone = '+91 6383458069';
          backupData[teamIndex].members = newMembers;
          backupData[teamIndex].team_size = newMembers.length;
          backupData[teamIndex].college = 'VEL TECH HIGH TECHDR.RANGARAJAN DRSAKUNTALA ENGINEERING COLLEGE';
          fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
          console.log('Update Successful in local backup_registrations.json');
        }
      }
    } catch (err) {
      console.error('Error updating backup file:', err);
    }
  } else {
    console.log('Failed to update Team 14 in database.');
  }

  await client.end();
}

main().catch(console.error);
