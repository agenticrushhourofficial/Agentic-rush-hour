const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const newMembers = [
  {
    "name": "Nenesh raj",
    "email": "neneshraj2006@gmail.com",
    "college": "Panimalar engineering college",
    "city": "Kanchipuram",
    "year": "III"
  },
  {
    "name": "Kabilesh",
    "email": "kabi03093@gmail.com",
    "college": "Panimalar engineering college",
    "city": "Kanchipuram",
    "year": "III"
  },
  {
    "name": "Siva",
    "email": "pgsiva@gmail.com",
    "college": "Panimalar engineering college",
    "city": "Kanchipuram",
    "year": "III"
  },
  {
    "name": "Akila",
    "email": "akilasurendran01@gmail.com",
    "college": "Panimalar engineering college",
    "city": "Kanchipuram",
    "year": "III"
  },
  {
    "name": "Jagan",
    "email": "jaganeswaripavi@gmail.com",
    "college": "Panimalar engineering college",
    "city": "Kanchipuram",
    "year": "III"
  },
  {
    "name": "Inaya",
    "email": "inaya161@gmail.com",
    "college": "Panimalar engineering college",
    "city": "Kanchipuram",
    "year": "III"
  }
];

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const updateQuery = `
    UPDATE registrations
    SET 
      team_name = $1,
      leader_name = $2,
      leader_email = $3,
      leader_phone = $4,
      members = $5
    WHERE id = 65
    RETURNING *;
  `;

  const values = [
    'Circuit Breakers',
    'Nenesh raj',
    'neneshraj2006@gmail.com',
    '8056619082',
    JSON.stringify(newMembers)
  ];

  const res = await client.query(updateQuery, values);
  if (res.rows.length > 0) {
    console.log('Update Successful for Team 65:');
    const row = { ...res.rows[0] };
    delete row.payment_proof; // keep output clean
    console.log(JSON.stringify(row, null, 2));
  } else {
    console.log('Failed to find Team 65 in database.');
  }

  await client.end();
}

main().catch(console.error);
