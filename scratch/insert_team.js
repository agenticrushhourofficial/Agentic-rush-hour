const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { sendConfirmationEmail } = require('../emailService');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  // Find the first unused positive integer ID (lowest gap starting from 1)
  let nextId = 1;
  const checkOneResult = await client.query('SELECT 1 FROM registrations WHERE id = 1;');
  if (checkOneResult.rows.length > 0) {
    const gapResult = await client.query(`
      SELECT MIN(t1.id + 1) AS next_id
      FROM registrations t1
      LEFT JOIN registrations t2 ON t1.id + 1 = t2.id
      WHERE t2.id IS NULL;
    `);
    if (gapResult.rows.length > 0 && gapResult.rows[0].next_id) {
      nextId = parseInt(gapResult.rows[0].next_id);
    }
  }

  const teamName = 'Ai makeover minds';
  const college = 'J.J.COLLEGE OF ENGINEERING AND TECHNOLOGY TRICHY';
  const leaderName = 'R.J.SHINEE';
  const email = 'shineearwinoficialshinee@gmail.com';
  const phone = '+91 94886 29629';
  const teamSize = 6;
  const paymentProofBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const members = [
    {
      name: 'R.J.SHINEE',
      email: 'shineearwinoficialshinee@gmail.com',
      college: 'J.J.COLLEGE OF ENGINEERING AND TECHNOLOGY TRICHY',
      city: 'Trichy',
      year: 'II'
    },
    {
      name: 'M.MOHAMED SAMEER',
      email: 'mohamedsameer1507@gmail.com',
      college: 'j.j. college of engineering and technology',
      city: 'Trichy',
      year: 'II'
    },
    {
      name: 'Mohamed Rashik Jabar Sheik',
      email: 'mohamed786rashik@gmail.com',
      college: 'j.j.collge of engineering and technology Trichy',
      city: 'Trichy',
      year: 'II'
    },
    {
      name: 'M MOHAMED RAYYAN',
      email: 'mohamedrayyan2512@gmail.com',
      college: 'j.j.college of engineering and technology Trichy',
      city: 'Trichy',
      year: 'II'
    },
    {
      name: 'Mohanraj S',
      email: 'mohanraj730505@gmail.com',
      college: 'j.j.college of engineering and technology Trichy',
      city: 'Trichy',
      year: 'II'
    },
    {
      name: 'Mukeshvel M',
      email: 'mukeshvelmurugavel@gmail.com',
      college: 'R.M.K Engineering College Chennai',
      city: 'Chennai',
      year: 'II'
    }
  ];

  const insertQuery = `
    INSERT INTO registrations (id, team_name, college, leader_name, leader_email, leader_phone, team_size, members, payment_proof, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id;
  `;
  const values = [
    nextId,
    teamName,
    college,
    leaderName,
    email,
    phone,
    teamSize,
    JSON.stringify(members),
    paymentProofBase64,
    'pending'
  ];

  const result = await client.query(insertQuery, values);
  const insertedId = result.rows[0].id;
  console.log(`💾 [Neon DB] Saved registration for team: ${teamName} (ID: ${insertedId})`);

  // Save persistent local backup copy on the server
  const backupDir = path.join(__dirname, '..', 'private');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupPath = path.join(backupDir, 'backup_registrations.json');
  let data = [];
  if (fs.existsSync(backupPath)) {
    const fileContent = fs.readFileSync(backupPath, 'utf8');
    if (fileContent.trim()) {
      data = JSON.parse(fileContent);
    }
  }

  const backupRecord = {
    id: insertedId,
    teamName,
    college,
    leaderName,
    email,
    phone,
    teamSize,
    members,
    created_at: new Date()
  };

  data.push(backupRecord);
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`📝 [Local Backup] Persistent backup saved for team: ${teamName}`);

  // Send confirmation email in background / script
  try {
    const emailRes = await sendConfirmationEmail({
      id: insertedId,
      teamName,
      college,
      leaderName,
      email,
      phone,
      teamSize,
      members
    });
    console.log('📧 Email Confirmation sent result:', emailRes);
  } catch (emailErr) {
    console.error('❌ Failed to send confirmation email:', emailErr);
  }

  await client.end();
}

main().catch(console.error);
