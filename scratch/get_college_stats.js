const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  // Fetch all registrations
  const res = await client.query('SELECT id, team_name, college, team_size FROM registrations ORDER BY id ASC');
  const teams = res.rows;
  
  // Categorize
  let sathyabamaChennaiTeams = 0;
  let sathyabamaChennaiMembers = 0;
  
  let sathyabamaSriperumpudurTeams = 0;
  let sathyabamaSriperumpudurMembers = 0;
  
  // Map of other colleges: name -> { teamsCount, membersCount }
  const otherColleges = {};

  teams.forEach(t => {
    const colName = (t.college || '').trim();
    const size = parseInt(t.team_size) || 0;
    const colLower = colName.toLowerCase();

    if (colLower.includes('sathyabama') && (colLower.includes('sriperumbudur') || colLower.includes('sriperumpudur'))) {
      sathyabamaSriperumpudurTeams++;
      sathyabamaSriperumpudurMembers += size;
    } else if (colLower.includes('sathyabama')) {
      // General Sathyabama (usually Chennai)
      sathyabamaChennaiTeams++;
      sathyabamaChennaiMembers += size;
    } else {
      // Other colleges
      // Normalize name slightly
      if (!otherColleges[colName]) {
        otherColleges[colName] = { teams: 0, members: 0 };
      }
      otherColleges[colName].teams++;
      otherColleges[colName].members += size;
    }
  });

  console.log('--- STATS SUMMARY ---');
  console.log(`Sathyabama Chennai (Main/General): ${sathyabamaChennaiTeams} Teams, ${sathyabamaChennaiMembers} Members`);
  console.log(`Sathyabama Sriperumpudur Campus: ${sathyabamaSriperumpudurTeams} Teams, ${sathyabamaSriperumpudurMembers} Members`);
  console.log('\n--- OTHER COLLEGES ---');
  let totalOtherTeams = 0;
  let totalOtherMembers = 0;
  for (const [name, stats] of Object.entries(otherColleges)) {
    console.log(`- ${name}: ${stats.teams} Teams, ${stats.members} Members`);
    totalOtherTeams += stats.teams;
    totalOtherMembers += stats.members;
  }
  console.log(`\nTotal Other Colleges: ${totalOtherTeams} Teams, ${totalOtherMembers} Members`);
  console.log(`Grand Total: ${sathyabamaChennaiTeams + sathyabamaSriperumpudurTeams + totalOtherTeams} Teams, ${sathyabamaChennaiMembers + sathyabamaSriperumpudurMembers + totalOtherMembers} Members`);

  await client.end();
}

main().catch(console.error);
