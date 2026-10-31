const fs = require('fs');
const path = require('path');

const privateDir = path.join(__dirname, '..', 'private');
const accPath = path.join(privateDir, 'backup_accommodations.json');
const regPath = path.join(privateDir, 'backup_registrations.json');

if (!fs.existsSync(accPath) || !fs.existsSync(regPath)) {
  console.error("Missing backup files!");
  process.exit(1);
}

const accommodations = JSON.parse(fs.readFileSync(accPath, 'utf8'));
const registrations = JSON.parse(fs.readFileSync(regPath, 'utf8'));

// Build email/id to phone map
const phoneMap = {};
registrations.forEach(r => {
  const email = (r.leader_email || r.email || '').toLowerCase().trim();
  const phone = r.leader_phone || r.phone || 'N/A';
  if (email) {
    phoneMap[email] = phone;
  }
  if (r.id) {
    phoneMap[r.id] = phone;
  }
});

let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RUSH HOUR 24 — Accommodation Roster</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #111827;
      margin: 40px;
      line-height: 1.5;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #111827;
      padding-bottom: 20px;
    }
    .title {
      font-size: 26px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 5px 0;
    }
    .subtitle {
      font-size: 14px;
      color: #4b5563;
      margin: 0;
    }
    .meta-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 12px;
      color: #6b7280;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th {
      background-color: #f3f4f6;
      border: 1px solid #111827;
      padding: 10px;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      text-align: left;
    }
    td {
      border: 1px solid #e5e7eb;
      padding: 12px 10px;
      font-size: 13px;
      vertical-align: top;
    }
    .team-title {
      font-weight: 700;
      font-size: 14px;
    }
    .college {
      font-size: 11px;
      color: #4b5563;
      margin-top: 4px;
    }
    .member-tag {
      display: inline-block;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: bold;
      border-radius: 4px;
      text-transform: uppercase;
      margin-left: 5px;
    }
    .boy {
      background-color: #dbeafe;
      color: #1e40af;
    }
    .girl {
      background-color: #fce7f3;
      color: #9d174d;
    }
    .roster-list {
      margin: 0;
      padding-left: 15px;
    }
    .roster-list li {
      margin-bottom: 6px;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
      margin-top: 50px;
      border-top: 1px solid #e5e7eb;
      padding-top: 10px;
    }
    @media print {
      body {
        margin: 20px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">RUSH HOUR 24 HACKATHON</div>
    <div class="subtitle">Official Accommodation Booking Roster</div>
  </div>

  <div class="meta-info">
    <div>Report Generated: ${new Date().toLocaleDateString()}</div>
    <div>Total Bookings: ${accommodations.length}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50px;">ID</th>
        <th style="width: 220px;">Team / College</th>
        <th style="width: 220px;">Leader Contact</th>
        <th style="width: 100px; text-align: center;">Counts</th>
        <th>Booked Members Roster</th>
      </tr>
    </thead>
    <tbody>
`;

accommodations.forEach(acc => {
  const email = (acc.leader_email || '').toLowerCase().trim();
  const phone = phoneMap[email] || phoneMap[acc.registration_id] || 'N/A';
  
  const rosterHtml = acc.booked_members.map(m => `
    <li>
      <strong>${m.name}</strong> 
      <span class="member-tag ${m.gender}">${m.gender}</span>
      <div style="font-size: 11px; color: #4b5563;">${m.email}</div>
    </li>
  `).join('');

  htmlContent += `
      <tr>
        <td>#${acc.id}</td>
        <td>
          <div class="team-title">${acc.team_name}</div>
          <div class="college">${acc.booked_members[0]?.college || 'N/A'}</div>
          <div style="font-size:10px; color:#9ca3af; margin-top:5px;">Reg ID: #${acc.registration_id}</div>
        </td>
        <td>
          <strong>Email:</strong> ${acc.leader_email}<br>
          <strong>Phone:</strong> <span style="font-size:14px; font-weight:700; color:#1e40af;">${phone}</span>
        </td>
        <td style="text-align: center;">
          Boys: <strong>${acc.boys_count}</strong><br>
          Girls: <strong>${acc.girls_count}</strong>
        </td>
        <td>
          <ul class="roster-list">
            ${rosterHtml}
          </ul>
        </td>
      </tr>
  `;
});

htmlContent += `
    </tbody>
  </table>

  <div class="footer">
    RUSH HOUR 24 Hackathon — Accommodation Management Section
  </div>
</body>
</html>
`;

const outputPath = path.join(__dirname, '..', 'accommodation_report.html');
fs.writeFileSync(outputPath, htmlContent, 'utf8');
console.log("SUCCESS: Created accommodation_report.html successfully.");
