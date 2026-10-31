const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const newMembers = [
    {
      city: "Chennai",
      name: "Vinay E",
      year: "II",
      email: "vinayji2007@gmail.com",
      college: "Sathyabama Institute of Science and Technology"
    },
    {
      city: "Chennai",
      name: "Sara Fareen K",
      year: "II",
      email: "sarafareenk@gmail.com",
      college: "Sathyabama Institute of Science and Technology"
    },
    {
      city: "Chennai",
      name: "Akshaya RK",
      year: "II",
      email: "akshayakannan567@gmail.com",
      college: "Sathyabama Institute of Science and Technology"
    },
    {
      city: "Chennai",
      name: "Aishwarya S",
      year: "II",
      email: "aishsep@gmail.com",
      college: "Sathyabama Institute of Science and Technology"
    }
  ];

  const updateQuery = `
    UPDATE registrations
    SET 
      team_name = $1,
      college = $2,
      leader_name = $3,
      leader_email = $4,
      leader_phone = $5,
      members = $6
    WHERE id = 20
    RETURNING *;
  `;

  const values = [
    'POWERHOUSE',
    'Sathyabama Institute of Science and Technology',
    'Vinay E',
    'vinayji2007@gmail.com',
    '7401005002',
    JSON.stringify(newMembers)
  ];

  const res = await client.query(updateQuery, values);
  if (res.rows.length > 0) {
    const row = { ...res.rows[0] };
    if (row.payment_proof) {
      row.payment_proof = row.payment_proof.substring(0, 100) + '...';
    }
    console.log('Update Successful:');
    console.log(JSON.stringify(row, null, 2));
  } else {
    console.log('No registration found with ID 20 to update.');
  }
  await client.end();
}

main().catch(console.error);


