const { Pool } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function importFeatures() {
  const wb = XLSX.readFile(path.join(__dirname, '../vid/Untitled spreadsheet.xlsx'));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

  let updated = 0;
  let skipped = 0;
  let noFeature = 0;

  // Skip header row (row 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const teamName = (row[0] || '').toString().trim();
    const teamIdRaw = (row[1] || '').toString().trim();
    const feature = row[2] ? row[2].toString().trim() : null;

    if (!teamName || !teamIdRaw) continue;

    // Extract numeric ID from formats like RH-0001, RH0001, RH 0001
    const match = teamIdRaw.replace(/[\s-]/g, '').match(/RH(\d+)/i);
    if (!match) {
      console.log(`⚠️  Skipping row ${i}: Cannot parse ID from "${teamIdRaw}"`);
      skipped++;
      continue;
    }

    const numericId = parseInt(match[1], 10);

    if (!feature) {
      console.log(`⚠️  No feature for ${teamName} (${teamIdRaw})`);
      noFeature++;
      continue;
    }

    try {
      const result = await pool.query(
        `UPDATE registrations SET zeroth_hour_feature = $1 WHERE id = $2`,
        [feature, numericId]
      );
      if (result.rowCount > 0) {
        console.log(`✅ Updated: ${teamName} (ID: ${numericId})`);
        updated++;
      } else {
        console.log(`❌ Not found in DB: ${teamName} (ID: ${numericId}, raw: "${teamIdRaw}")`);
        skipped++;
      }
    } catch (err) {
      console.error(`❌ Error updating ${teamName}:`, err.message);
    }
  }

  console.log(`\n📊 Summary: ${updated} updated, ${noFeature} no feature, ${skipped} skipped/not found`);
  await pool.end();
}

importFeatures().catch(err => {
  console.error(err);
  pool.end();
});
