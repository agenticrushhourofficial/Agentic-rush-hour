const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const newMembers = [
  {
    "name": "Surendar Kumar",
    "email": "surendarkx27@gmail.com",
    "college": "Sri Manakula Vinayagar Engineering College",
    "city": "Puducherry",
    "year": "IV"
  },
  {
    "name": "Mahasweta S",
    "email": "swetamaha8@gmail.com",
    "college": "Sri Manakula Vinayagar Engineering College",
    "city": "Puducherry",
    "year": "IV"
  },
  {
    "name": "Arsha Shanaki D",
    "email": "arshadhanigaivel06@gmail.com",
    "college": "Sri Manakula Vinayagar Engineering College",
    "city": "Puducherry",
    "year": "IV"
  },
  {
    "name": "Daranya",
    "email": "daranya1107@gmail.com",
    "college": "Sri Manakula Vinayagar Engineering College",
    "city": "Puducherry",
    "year": "III"
  },
  {
    "name": "Arya R",
    "email": "btecheee230245@smvec.ac.in",
    "college": "Sri Manakula Vinayagar Engineering College",
    "city": "Puducherry",
    "year": "III"
  },
  {
    "name": "Karthik Kishore",
    "email": "karthik8022005@gmail.com",
    "college": "Sri Manakula Vinayagar Engineering College",
    "city": "Puducherry",
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
      members = $1
    WHERE id = 66
    RETURNING *;
  `;

  const res = await client.query(updateQuery, [JSON.stringify(newMembers)]);
  if (res.rows.length > 0) {
    console.log('Update Successful for Team 66:');
    const row = { ...res.rows[0] };
    delete row.payment_proof; // keep output clean
    console.log(JSON.stringify(row, null, 2));
  } else {
    console.log('Failed to find Team 66 in database.');
  }

  await client.end();
}

main().catch(console.error);
