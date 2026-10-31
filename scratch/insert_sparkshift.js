const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { sendVerificationSuccessEmail } = require('../emailService');

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

  const teamName = 'Sparkshift';
  const college = 'Dr. N.G.P Institute of Technology';
  const leaderName = 'Rithanya Sri S P';
  const email = '24205080@drngpit.ac.in';
  const phone = '+91 90806 77055';
  const teamSize = 4;
  
  const imagePath = 'C:\\Users\\A S U S\\.gemini\\antigravity-ide\\brain\\68bee961-d323-4f85-961d-37f280f28858\\media__1783429953136.png';
  let paymentProofBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  if (fs.existsSync(imagePath)) {
    const imageBuffer = fs.readFileSync(imagePath);
    paymentProofBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
  }

  const members = [
    {
      name: 'Rithanya Sri S P',
      email: '24205080@drngpit.ac.in',
      college: 'Dr. N.G.P Institute of Technology',
      city: 'Coimbatore',
      year: 'III'
    },
    {
      name: 'Thirush Nitha S',
      email: '24205115@drngpit.ac.in',
      college: 'Dr. N.G.P Institute of Technology',
      city: 'Coimbatore',
      year: 'III'
    },
    {
      name: 'Sridharan K',
      email: '24205102@drngpit.ac.in',
      college: 'Dr. N.G.P Institute of Technology',
      city: 'Coimbatore',
      year: 'III'
    },
    {
      name: 'Vasanth Kumar S',
      email: '24205120@drngpit.ac.in',
      college: 'Dr. N.G.P Institute of Technology',
      city: 'Coimbatore',
      year: 'III'
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
    'verified'
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
    status: 'verified',
    created_at: new Date()
  };

  data.push(backupRecord);
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`📝 [Local Backup] Persistent backup saved for team: ${teamName}`);

  // Send verification success email
  try {
    const emailRes = await sendVerificationSuccessEmail({
      id: insertedId,
      teamName,
      college,
      leaderName,
      email,
      phone,
      teamSize,
      members
    });
    console.log('📧 Verification success email sent result:', emailRes);
  } catch (emailErr) {
    console.error('❌ Failed to send verification success email:', emailErr);
  }

  await client.end();
}

main().catch(console.error);
