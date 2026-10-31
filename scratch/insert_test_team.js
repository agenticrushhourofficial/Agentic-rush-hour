const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const teamName = 'Test Team ' + Math.floor(1000 + Math.random() * 9000);
    const leaderEmail = 'jpkishore04@gmail.com';
    const members = [
      { name: 'Test Leader', email: leaderEmail, college: 'Test College', city: 'Test City', year: 'III' },
      { name: 'Member 2', email: 'member2@example.com', college: 'Test College', city: 'Test City', year: 'III' },
      { name: 'Member 3', email: 'member3@example.com', college: 'Test College', city: 'Test City', year: 'III' }
    ];

    // Find the first unused positive integer ID
    let nextId = 1;
    const checkOneResult = await pool.query('SELECT 1 FROM registrations WHERE id = 1;');
    if (checkOneResult.rows.length > 0) {
      const gapResult = await pool.query(`
        SELECT MIN(t1.id + 1) AS next_id
        FROM registrations t1
        LEFT JOIN registrations t2 ON t1.id + 1 = t2.id
        WHERE t2.id IS NULL;
      `);
      if (gapResult.rows.length > 0 && gapResult.rows[0].next_id) {
        nextId = parseInt(gapResult.rows[0].next_id);
      }
    }

    const insertQuery = `
      INSERT INTO registrations (id, team_name, college, leader_name, leader_email, leader_phone, team_size, members, payment_proof, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, team_name;
    `;

    const values = [
      nextId,
      teamName,
      'Test College',
      'Test Leader',
      leaderEmail,
      '1234567890',
      3,
      JSON.stringify(members),
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'verified'
    ];

    const result = await pool.query(insertQuery, values);
    const teamId = `RH-${String(result.rows[0].id).padStart(4, '0')}`;
    console.log(`\n==================================================`);
    console.log(`✅ Success! Inserted test team:`);
    console.log(`   ID: ${result.rows[0].id} (${teamId})`);
    console.log(`   Team Name: ${result.rows[0].team_name}`);
    console.log(`   Leader Email: ${leaderEmail}`);
    console.log(`   Status: verified`);
    console.log(`==================================================\n`);
  } catch (err) {
    console.error('Error inserting test team:', err);
  } finally {
    await pool.end();
  }
}

run();
