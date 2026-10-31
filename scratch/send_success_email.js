const { Client } = require('pg');
require('dotenv').config();
const { sendVerificationSuccessEmail } = require('../emailService');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const res = await client.query('SELECT * FROM registrations WHERE id = 73;');
  if (res.rows.length > 0) {
    const record = res.rows[0];
    const teamDetails = {
      id: record.id,
      teamName: record.team_name,
      college: record.college,
      leaderName: record.leader_name,
      email: record.leader_email,
      phone: record.leader_phone,
      teamSize: record.team_size,
      members: typeof record.members === 'string' ? JSON.parse(record.members) : record.members
    };

    console.log('📧 Sending verification success email...');
    try {
      const emailRes = await sendVerificationSuccessEmail(teamDetails);
      console.log('✅ Email sent result:', emailRes);
    } catch (emailErr) {
      console.error('❌ Email failed:', emailErr);
    }
  } else {
    console.error('Team 73 not found.');
  }

  await client.end();
}

main().catch(console.error);
