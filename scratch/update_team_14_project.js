const { Client } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const updateData = {
  project_title: "StudentInsight AI – Smart Academic Success Platform",
  domain: "Software",
  problem_statement: "College students use multiple apps for timetables, notes, reminders, expenses, and placement preparation. However, these applications only store information and do not analyze student behavior or provide personalized guidance. As a result, many students struggle with poor academic performance, ineffective study habits, burnout, and inadequate placement preparation. There is a need for an AI-powered platform that can automatically analyze student data, predict academic risks, and provide personalized recommendations to improve learning outcomes and career readiness.",
  project_description: "StudentInsight AI is an AI-powered intelligent automation platform that acts as a personal academic mentor for students. The system automatically analyzes attendance, marks, assignment completion, study habits, coding practice, productivity, and placement preparation using Artificial Intelligence and Machine Learning. Based on this analysis, it predicts academic risks, estimates GPA, detects burnout, evaluates placement readiness, and generates personalized study plans and smart recommendations. By transforming raw student data into actionable insights, StudentInsight AI helps students make better academic decisions, improve productivity, and achieve long-term academic and career success."
};

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const updateQuery = `
    UPDATE registrations
    SET 
      project_title = $1,
      domain = $2,
      problem_statement = $3,
      project_description = $4
    WHERE id = 14
    RETURNING *;
  `;

  const values = [
    updateData.project_title,
    updateData.domain,
    updateData.problem_statement,
    updateData.project_description
  ];

  const res = await client.query(updateQuery, values);
  if (res.rows.length > 0) {
    console.log('Update Successful in Neon PostgreSQL for Team 14 Project Details:');
    const row = { ...res.rows[0] };
    delete row.payment_proof;
    console.log(JSON.stringify(row, null, 2));

    // Update local private/backup_registrations.json as well
    try {
      const backupPath = path.join(__dirname, '../private/backup_registrations.json');
      if (fs.existsSync(backupPath)) {
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        const teamIndex = backupData.findIndex(t => t.id === 14);
        if (teamIndex !== -1) {
          backupData[teamIndex].project_title = updateData.project_title;
          backupData[teamIndex].domain = updateData.domain;
          backupData[teamIndex].problem_statement = updateData.problem_statement;
          backupData[teamIndex].project_description = updateData.project_description;
          fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
          console.log('Update Successful in local backup_registrations.json');
        }
      }
    } catch (err) {
      console.error('Error updating backup file:', err);
    }
  } else {
    console.log('Failed to update Team 14 project details.');
  }

  await client.end();
}

main().catch(console.error);
