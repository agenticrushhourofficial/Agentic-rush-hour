const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  const excelDataPath = path.join(__dirname, 'excel_data.json');
  if (!fs.existsSync(excelDataPath)) {
    console.error(`❌ parsed excel data not found at ${excelDataPath}`);
    process.exit(1);
  }

  const excelRows = JSON.parse(fs.readFileSync(excelDataPath, 'utf8'));
  console.log(`Loaded ${excelRows.length} rows from Excel JSON data.`);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log("Adding columns to database if they do not exist...");
  await client.query(`
    ALTER TABLE registrations ADD COLUMN IF NOT EXISTS project_title TEXT;
    ALTER TABLE registrations ADD COLUMN IF NOT EXISTS problem_statement TEXT;
    ALTER TABLE registrations ADD COLUMN IF NOT EXISTS project_description TEXT;
    ALTER TABLE registrations ADD COLUMN IF NOT EXISTS domain VARCHAR(100);
  `);
  console.log("Database schema columns verified/added.");

  console.log("Fetching current registrations from DB...");
  const dbResult = await client.query('SELECT id, team_name, leader_name, leader_email, members FROM registrations;');
  const dbRows = dbResult.rows;
  console.log(`Found ${dbRows.length} registrations in the database.`);

  let matchCount = 0;
  let updateCount = 0;

  for (const excelRow of excelRows) {
    const rawTeamId = excelRow['Team ID (check the received mail)'];
    const excelTeamName = excelRow['Team Name'];
    const excelLeadEmail = excelRow['Mail ID'] || excelRow['Email address'];
    const excelTitle = excelRow['Project Title'];
    const excelProblem = excelRow['Problem Statement'];
    const excelDesc = excelRow['Project Description'];
    const excelDomain = excelRow['Domain'];

    // Extract numeric ID from e.g., "RH-0036"
    let parsedId = null;
    if (rawTeamId && typeof rawTeamId === 'string') {
      const match = rawTeamId.match(/\d+/);
      if (match) {
        parsedId = parseInt(match[0], 10);
      }
    }

    // Try to find the matching row in DB
    let matchedDbRow = null;

    // Method 1: Match by ID
    if (parsedId !== null) {
      matchedDbRow = dbRows.find(r => r.id === parsedId);
    }

    // Method 2: Match by Leader Email or other emails
    if (!matchedDbRow && excelLeadEmail) {
      const targetEmail = excelLeadEmail.trim().toLowerCase();
      matchedDbRow = dbRows.find(r => {
        if (r.leader_email && r.leader_email.trim().toLowerCase() === targetEmail) {
          return true;
        }
        // Check member emails
        try {
          const members = typeof r.members === 'string' ? JSON.parse(r.members) : r.members;
          if (Array.isArray(members)) {
            return members.some(m => m.email && m.email.trim().toLowerCase() === targetEmail);
          }
        } catch (e) {}
        return false;
      });
    }

    // Method 3: Match by Team Name
    if (!matchedDbRow && excelTeamName) {
      const targetName = excelTeamName.trim().toLowerCase();
      matchedDbRow = dbRows.find(r => r.team_name && r.team_name.trim().toLowerCase() === targetName);
    }

    if (matchedDbRow) {
      matchCount++;
      try {
        await client.query(
          `UPDATE registrations 
           SET project_title = $1, problem_statement = $2, project_description = $3, domain = $4
           WHERE id = $5`,
          [excelTitle || null, excelProblem || null, excelDesc || null, excelDomain || null, matchedDbRow.id]
        );
        updateCount++;
        console.log(`✅ Updated team [ID: ${matchedDbRow.id}] "${matchedDbRow.team_name}" with project details.`);
      } catch (err) {
        console.error(`❌ Failed to update team [ID: ${matchedDbRow.id}] "${matchedDbRow.team_name}":`, err.message);
      }
    } else {
      console.warn(`⚠️ Could not match Excel row for Team: "${excelTeamName}" (ID: ${rawTeamId}, Lead Email: ${excelLeadEmail})`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Migration completed:`);
  console.log(`- Total Excel rows processed: ${excelRows.length}`);
  console.log(`- Matched teams: ${matchCount}`);
  console.log(`- Successfully updated database rows: ${updateCount}`);
  console.log(`========================================`);

  await client.end();
}

main().catch(console.error);
