const { Resend } = require('resend');

// Initialize Resend safely
let resend = null;
if (process.env.RESEND_API_KEY) {
  try {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('📧 Resend is initialized to send confirmation emails.');
  } catch (err) {
    console.error('❌ Failed to initialize Resend client:', err.message);
  }
} else {
  console.warn('⚠️ WARNING: RESEND_API_KEY is not defined in environment variables. Email sending is disabled.');
}

/**
 * Sends a confirmation email to the team leader.
 * @param {Object} teamDetails - Registration details of the team.
 * @param {string} teamDetails.id - Registration ID.
 * @param {string} teamDetails.teamName - Name of the team.
 * @param {string} teamDetails.college - College name.
 * @param {string} teamDetails.leaderName - Team leader's name.
 * @param {string} teamDetails.email - Team leader's email.
 * @param {string} teamDetails.phone - Team leader's phone.
 * @param {number} teamDetails.teamSize - Team size.
 * @param {Array} teamDetails.members - List of all team members.
 */
async function sendConfirmationEmail(teamDetails) {
  const { id, teamName, college, leaderName, email, teamSize, members } = teamDetails;

  const registrationId = `RH-${String(id).padStart(4, '0')}`;

  // If Resend is not initialized, log a warning and return success: false
  if (!resend) {
    console.warn(`⚠️ Resend is not initialized. Skipping sending confirmation email to ${email}.`);
    return { success: false, error: 'Resend is not initialized (missing API key)' };
  }

  // Generate team members rows for HTML table
  const romanMap = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', '1': 'I', '2': 'II', '3': 'III', '4': 'IV' };
  const membersListHtml = members.map((member, index) => `
    <tr style="border-bottom: 1px solid rgba(168, 85, 247, 0.15);">
      <td style="padding: 14px 10px; color: #f472b6; font-size: 13px; font-weight: bold; text-align: center; font-family: monospace; text-shadow: 0 0 4px rgba(244,114,182,0.3);">${String(index + 1).padStart(2, '0')}</td>
      <td style="padding: 14px 10px; color: #ffffff; font-size: 14px; font-weight: 600;">
        ${member.name} 
        ${index === 0 ? '<span style="color: #ffffff; font-size: 10px; background: linear-gradient(90deg, #a855f7, #f472b6); padding: 3px 10px; border-radius: 20px; margin-left: 6px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 0 8px rgba(168, 85, 247, 0.4);">Leader</span>' : ''}
      </td>
      <td style="padding: 14px 10px; color: #cbd5e1; font-size: 13px;">${member.email}</td>
      <td style="padding: 14px 10px; color: #c084fc; font-size: 13px; text-align: center; font-weight: bold;">${romanMap[member.year] || member.year}</td>
      <td style="padding: 14px 10px; color: #cbd5e1; font-size: 13px;">${member.city}</td>
    </tr>
  `).join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RUSH HOUR 24 — Registration Confirmed</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #03000a; color: #e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #03000a linear-gradient(180deg, #05020c 0%, #0c081d 100%); padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background: #0a0614; border-radius: 24px; border: 2px solid #a855f7; overflow: hidden; box-shadow: 0 0 35px rgba(168, 85, 247, 0.25), inset 0 0 15px rgba(168, 85, 247, 0.1);">
          
          <!-- Header Accent Glow Line -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #a855f7 0%, #ec4899 50%, #3b82f6 100%);"></td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 40px 30px 25px 30px; background: radial-gradient(circle at top, rgba(168, 85, 247, 0.2) 0%, transparent 70%);">
              <div style="font-size: 11px; font-weight: 700; color: #a855f7; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 8px;">[ NATIONAL HACKATHON ]</div>
              <h1 style="margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                RUSH<span style="color: #a855f7; text-shadow: 0 0 15px rgba(168, 85, 247, 0.65);">HOUR</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 4px; color: #f472b6; text-transform: uppercase;">
                24-Hours National Engineering Challenge
              </p>
            </td>
          </tr>

          <!-- Success Icon & Welcome message -->
          <tr>
            <td align="center" style="padding: 0 40px 30px 40px; text-align: center;">
              <div style="display: inline-block; width: 72px; height: 72px; line-height: 72px; border-radius: 22px; background: rgba(168, 85, 247, 0.12); border: 2px solid rgba(168, 85, 247, 0.35); margin-bottom: 24px; box-shadow: 0 0 25px rgba(168, 85, 247, 0.3);">
                <span style="font-size: 34px; color: #a855f7; vertical-align: middle;">✓</span>
              </div>
              <h2 style="margin: 0 0 12px 0; font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Registration Confirmed!</h2>
              <p style="margin: 0; font-size: 15px; color: #94a3b8; line-height: 1.6;">
                Welcome to the grid, <strong>${leaderName}</strong>! Your team's details have been successfully locked into our databases. Get ready to build, break, and innovate.
              </p>
            </td>
          </tr>

          <!-- Cyber Ticket representation -->
          <tr>
            <td style="padding: 0 35px 30px 35px;">
              <div style="background: linear-gradient(135deg, #0e091b 0%, #150d28 100%); border: 2px solid #581c87; border-radius: 20px; padding: 30px; box-shadow: inset 0 2px 4px rgba(255,255,255,0.05), 0 10px 20px rgba(0,0,0,0.4);">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-bottom: 24px;">
                      <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #f472b6; letter-spacing: 2px; display: block; margin-bottom: 6px;">[ ENTRY PASS ID ]</span>
                      <strong style="font-size: 28px; color: #ffffff; letter-spacing: 2px; font-family: 'Space Grotesk', monospace; text-shadow: 0 0 15px rgba(168,85,247,0.7);">${registrationId}</strong>
                    </td>
                    <td style="padding-bottom: 24px; text-align: right;">
                      <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #f472b6; letter-spacing: 2px; display: block; margin-bottom: 6px;">[ TEAM NAME ]</span>
                      <strong style="font-size: 20px; color: #c084fc; font-family: 'Space Grotesk', sans-serif; text-shadow: 0 0 10px rgba(192,132,252,0.4);">${teamName}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="border-top: 2px dashed #581c87; height: 1px; padding: 0; font-size: 0; line-height: 0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding-top: 24px;">
                      <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #a78bfa; letter-spacing: 2px; display: block; margin-bottom: 6px;">[ INSTITUTION ]</span>
                      <span style="font-size: 15px; color: #e2e8f0; font-weight: 600;">${college}</span>
                    </td>
                    <td style="padding-top: 24px; text-align: right;">
                      <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #a78bfa; letter-spacing: 2px; display: block; margin-bottom: 6px;">[ TEAM SIZE ]</span>
                      <span style="font-size: 14px; color: #ffffff; font-weight: 700; background: rgba(168, 85, 247, 0.15); padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(168, 85, 247, 0.35);">${teamSize} Members</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Team Composition -->
          <tr>
            <td style="padding: 0 35px 30px 35px;">
              <h3 style="margin: 0 0 16px 0; font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 700; color: #ffffff; border-left: 4px solid #a855f7; padding-left: 12px; letter-spacing: 0.5px;">TEAM ROSTER</h3>
              <div style="background: #0d091b; border-radius: 16px; border: 1px solid #3b0764; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                  <thead>
                    <tr style="background: rgba(168, 85, 247, 0.15); border-bottom: 2px solid #3b0764;">
                      <th align="center" style="padding: 14px 10px; color: #c084fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">#</th>
                      <th align="left" style="padding: 14px 10px; color: #c084fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Name</th>
                      <th align="left" style="padding: 14px 10px; color: #c084fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Email</th>
                      <th align="center" style="padding: 14px 10px; color: #c084fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Year</th>
                      <th align="left" style="padding: 14px 10px; color: #c084fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">City</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${membersListHtml}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          <!-- Schedule & Venue Details -->
          <tr>
            <td style="padding: 0 35px 35px 35px;">
              <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.08) 100%); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 16px; padding: 25px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                <h3 style="margin: 0 0 15px 0; font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">📅 Venue & Date Info</h3>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td valign="top" style="padding-bottom: 16px;">
                      <strong style="color: #c084fc; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Date & Timing</strong>
                      <span style="font-size: 14px; color: #cbd5e1; line-height: 1.5; font-weight: 500;">July 24 – 25, 2026<br><span style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Hacking starts at 10:00 AM on July 24</span></span>
                    </td>
                  </tr>
                  <tr>
                    <td valign="top">
                      <strong style="color: #c084fc; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Venue Location</strong>
                      <span style="font-size: 14px; color: #cbd5e1; line-height: 1.5; font-weight: 500;">Sathyabama Institute of Science and Technology,<br>Rajiv Gandhi Salai, Jeppiaar Nagar, Chennai, Tamil Nadu 600119</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Important Guidelines -->
          <tr>
            <td style="padding: 0 35px 40px 35px;">
              <h3 style="margin: 0 0 16px 0; font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 700; color: #ffffff; border-left: 4px solid #ec4899; padding-left: 12px; letter-spacing: 0.5px;">IMPORTANT GUIDELINES</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #94a3b8; line-height: 1.7;">
                <li style="margin-bottom: 10px; color: #cbd5e1;">Please carry your physical <strong>College ID Card</strong> for check-in verification.</li>
                <li style="margin-bottom: 10px; color: #cbd5e1;">Bring your own laptops, chargers, and extension boards.</li>
                <li style="margin-bottom: 10px; color: #cbd5e1;">Ensure required development software and IDEs are pre-installed.</li>
                <li style="margin-bottom: 10px; color: #cbd5e1;">Free WiFi, food, snacks, and overnight stay facilities will be provided at the venue.</li>
              </ul>
            </td>
          </tr>

          <!-- Email Footer -->
          <tr>
            <td align="center" style="background: rgba(8, 4, 18, 0.95); padding: 35px 30px; border-top: 2px solid #3b0764; text-align: center;">
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8;">
                Have questions or need to make updates to your registration?
              </p>
              <p style="margin: 0; font-size: 15px; font-weight: 700; font-family: 'Space Grotesk', sans-serif;">
                Email us at: <a href="mailto:rushhour2026.sathyabama@gmail.com" style="color: #c084fc; text-decoration: none; text-shadow: 0 0 8px rgba(192,132,252,0.3);">rushhour2026.sathyabama@gmail.com</a>
              </p>
              <p style="margin: 24px 0 0 0; font-size: 11px; color: #4b5563; letter-spacing: 0.5px;">
                &copy; 2026 Sathyabama Institute of Science and Technology. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `RUSH HOUR 24 <hello@rushhour.sistcybersummit.tech>`,
      to: [email],
      bcc: ['rushhour2026.sathyabama@gmail.com'],
      reply_to: 'rushhour2026.sathyabama@gmail.com',
      subject: `🔥 Registration Confirmed! Team: ${teamName} [ID: ${registrationId}] - RUSH HOUR 24`,
      html: htmlContent
    });

    if (error) {
      console.error(`❌ Failed to send confirmation email to ${email}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✉️ Email successfully sent to ${email} (MessageID: ${data.id})`);
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error(`❌ Failed to send confirmation email to ${email}:`, err);
    return { success: false, error: err.message };
  }
}

async function sendVerificationSuccessEmail(teamDetails) {
  const { id, teamName, college, leaderName, email, teamSize, members } = teamDetails;

  const registrationId = `RH-${String(id).padStart(4, '0')}`;

  // If Resend is not initialized, log a warning and return success: false
  if (!resend) {
    console.warn(`⚠️ Resend is not initialized. Skipping sending verification success email to ${email}.`);
    return { success: false, error: 'Resend is not initialized (missing API key)' };
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RUSH HOUR 24 — Registration Fully Verified</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #03000a; color: #e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #03000a linear-gradient(180deg, #05020c 0%, #0c081d 100%); padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background: #0a0614; border-radius: 24px; border: 2px solid #10b981; overflow: hidden; box-shadow: 0 0 35px rgba(16, 185, 129, 0.25), inset 0 0 15px rgba(16, 185, 129, 0.1);">
          
          <!-- Header Accent Glow Line -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);"></td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 40px 30px 25px 30px; background: radial-gradient(circle at top, rgba(16, 185, 129, 0.2) 0%, transparent 70%);">
              <div style="font-size: 11px; font-weight: 700; color: #10b981; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 8px;">[ REGISTRATION VERIFIED ]</div>
              <h1 style="margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                RUSH<span style="color: #10b981; text-shadow: 0 0 15px rgba(16, 185, 129, 0.65);">HOUR</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 4px; color: #3b82f6; text-transform: uppercase;">
                24-Hours National Engineering Challenge
              </p>
            </td>
          </tr>

          <!-- Success Icon & Welcome message -->
          <tr>
            <td align="center" style="padding: 0 40px 30px 40px; text-align: center;">
              <div style="display: inline-block; width: 72px; height: 72px; line-height: 72px; border-radius: 22px; background: rgba(16, 185, 129, 0.12); border: 2px solid rgba(16, 185, 129, 0.35); margin-bottom: 24px; box-shadow: 0 0 25px rgba(16, 185, 129, 0.3);">
                <span style="font-size: 34px; color: #10b981; vertical-align: middle;">🎟️</span>
              </div>
              <h2 style="margin: 0 0 12px 0; font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Payment Verified!</h2>
              <p style="margin: 0; font-size: 15px; color: #94a3b8; line-height: 1.6;">
                Excellent, <strong>${leaderName}</strong>! Your team's payment proof for <strong>${teamName}</strong> has been successfully reviewed and verified by our finance team.
              </p>
              <div style="margin-top: 18px; padding: 6px 20px; background: linear-gradient(90deg, #10b981, #059669); border-radius: 30px; display: inline-block; box-shadow: 0 0 12px rgba(16, 185, 129, 0.45); color: #ffffff; font-weight: 700; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">
                STATUS: FULLY CONFIRMED
              </div>
            </td>
          </tr>

          <!-- Cyber Ticket representation -->
          <tr>
            <td style="padding: 0 35px 30px 35px;">
              <div style="background: linear-gradient(135deg, #0d1a15 0%, #0c1322 100%); border: 2px solid #065f46; border-radius: 20px; padding: 30px; box-shadow: inset 0 2px 4px rgba(255,255,255,0.05), 0 10px 20px rgba(0,0,0,0.4);">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-bottom: 24px;">
                      <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #3b82f6; letter-spacing: 2px; display: block; margin-bottom: 6px;">[ ENTRY PASS ID ]</span>
                      <strong style="font-size: 28px; color: #10b981; letter-spacing: 2px; font-family: 'Space Grotesk', monospace; text-shadow: 0 0 15px rgba(16,185,129,0.7);">${registrationId}</strong>
                    </td>
                    <td style="padding-bottom: 24px; text-align: right;">
                      <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #3b82f6; letter-spacing: 2px; display: block; margin-bottom: 6px;">[ TEAM NAME ]</span>
                      <strong style="font-size: 20px; color: #ffffff; font-family: 'Space Grotesk', sans-serif; text-shadow: 0 0 10px rgba(255,255,255,0.3);">${teamName}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="border-top: 2px dashed #065f46; height: 1px; padding: 0; font-size: 0; line-height: 0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding-top: 24px;">
                      <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #3b82f6; letter-spacing: 2px; display: block; margin-bottom: 6px;">[ COLLEGE ]</span>
                      <span style="font-size: 15px; color: #e2e8f0; font-weight: 600;">${college}</span>
                    </td>
                    <td style="padding-top: 24px; text-align: right;">
                      <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #3b82f6; letter-spacing: 2px; display: block; margin-bottom: 6px;">[ REGISTRATION ]</span>
                      <span style="font-size: 14px; color: #10b981; font-weight: 700; background: rgba(16, 185, 129, 0.15); padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.35);">VERIFIED & ACTIVE</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Schedule & Venue Details -->
          <tr>
            <td style="padding: 0 35px 35px 35px;">
              <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 25px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                <h3 style="margin: 0 0 15px 0; font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">📅 Hackathon Check-in Info</h3>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td valign="top" style="padding-bottom: 16px;">
                      <strong style="color: #3b82f6; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Check-in Date & Time</strong>
                      <span style="font-size: 14px; color: #cbd5e1; line-height: 1.5; font-weight: 500;">July 24, 2026 at 08:30 AM<br><span style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Hacking begins exactly at 10:00 AM</span></span>
                    </td>
                  </tr>
                  <tr>
                    <td valign="top">
                      <strong style="color: #3b82f6; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Venue Location</strong>
                      <span style="font-size: 14px; color: #cbd5e1; line-height: 1.5; font-weight: 500;">Sathyabama Institute of Science and Technology,<br>Rajiv Gandhi Salai, Jeppiaar Nagar, Chennai, Tamil Nadu 600119</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Important Guidelines -->
          <tr>
            <td style="padding: 0 35px 40px 35px;">
              <h3 style="margin: 0 0 16px 0; font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 700; color: #ffffff; border-left: 4px solid #10b981; padding-left: 12px; letter-spacing: 0.5px;">CHECK-IN REQUIREMENTS</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #94a3b8; line-height: 1.7;">
                <li style="margin-bottom: 10px; color: #cbd5e1;">Keep this email ready on your phone — show the **ENTRY PASS ID** at the registration desk.</li>
                <li style="margin-bottom: 10px; color: #cbd5e1;">All team members must carry their physical **College ID Card**.</li>
                <li style="margin-bottom: 10px; color: #cbd5e1;">Make sure to bring laptops, chargers, extension cords, and toiletries.</li>
              </ul>
            </td>
          </tr>

          <!-- Email Footer -->
          <tr>
            <td align="center" style="background: rgba(8, 4, 18, 0.95); padding: 35px 30px; border-top: 2px solid #065f46; text-align: center;">
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8;">
                Need help or have questions regarding boarding or logistics?
              </p>
              <p style="margin: 0; font-size: 15px; font-weight: 700; font-family: 'Space Grotesk', sans-serif;">
                Email us at: <a href="mailto:rushhour2026.sathyabama@gmail.com" style="color: #10b981; text-decoration: none; text-shadow: 0 0 8px rgba(16,185,129,0.3);">rushhour2026.sathyabama@gmail.com</a>
              </p>
              <p style="margin: 24px 0 0 0; font-size: 11px; color: #4b5563; letter-spacing: 0.5px;">
                &copy; 2026 Sathyabama Institute of Science and Technology. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `RUSH HOUR 24 <hello@rushhour.sistcybersummit.tech>`,
      to: [email],
      reply_to: 'rushhour2026.sathyabama@gmail.com',
      subject: `🔥 REGISTRATION CONFIRMED & VERIFIED! Team: ${teamName} [ID: ${registrationId}]`,
      html: htmlContent
    });

    if (error) {
      console.error(`❌ Failed to send verification success email to ${email}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✉️ Verification Success email sent to ${email} (MessageID: ${data.id})`);
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error(`❌ Failed to send verification success email to ${email}:`, err);
    return { success: false, error: err.message };
  }
}

async function sendRejectionEmail(teamDetails, reason) {
  const { id, teamName, leaderName, email } = teamDetails;

  const registrationId = `RH-${String(id).padStart(4, '0')}`;

  // If Resend is not initialized, log a warning and return success: false
  if (!resend) {
    console.warn(`⚠️ Resend is not initialized. Skipping sending rejection email to ${email}.`);
    return { success: false, error: 'Resend is not initialized (missing API key)' };
  }

  // Check if this is a slot-full / refund cancellation
  const isRefundRejection = reason.toLowerCase().includes('refund') || reason.toLowerCase().includes('slot') || reason.toLowerCase().includes('full');

  const subjectLine = isRefundRejection 
    ? `⚠️ IMPORTANT: Registration Status Update - Team ${teamName} [ID: ${registrationId}]`
    : `⚠️ ACTION REQUIRED: Payment Rejection for Team ${teamName} [ID: ${registrationId}]`;

  const headerLabel = isRefundRejection ? `[ REGISTRATION CANCELLED ]` : `[ ACTION REQUIRED ]`;
  const mainTitle = isRefundRejection ? `Slots Full` : `Payment Rejected`;
  const iconSpan = isRefundRejection ? `⚠️` : `❌`;
  const borderHex = isRefundRejection ? `#f59e0b` : `#ef4444`; // amber or red
  const glowHex = isRefundRejection ? `rgba(245, 158, 11, 0.25)` : `rgba(239, 68, 68, 0.25)`;
  const innerGlowHex = isRefundRejection ? `rgba(245, 158, 11, 0.1)` : `rgba(239, 68, 68, 0.1)`;
  const headerGlowColor = isRefundRejection ? `rgba(245, 158, 11, 0.2)` : `rgba(239, 68, 68, 0.2)`;
  const bannerBg = isRefundRejection 
    ? `linear-gradient(90deg, #f59e0b, #d97706)` 
    : `linear-gradient(90deg, #ef4444, #dc2626)`;
  const statusText = isRefundRejection ? `CANCELLED / REFUND PENDING` : `REJECTED`;
  const infoBoxBg = isRefundRejection
    ? `linear-gradient(135deg, #2b1c0c 0%, #1f1408 100%)`
    : `linear-gradient(135deg, #270f0f 0%, #1a0a0a 100%)`;
  const infoBoxBorder = isRefundRejection ? `#b45309` : `#991b1b`;
  const infoBoxTitleColor = isRefundRejection ? `#fbbf24` : `#f87171`;
  const footerBorder = isRefundRejection ? `#b45309` : `#991b1b`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RUSH HOUR 24 — Registration Update</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #03000a; color: #e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #03000a linear-gradient(180deg, #05020c 0%, #0c081d 100%); padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background: #0a0614; border-radius: 24px; border: 2px solid ${borderHex}; overflow: hidden; box-shadow: 0 0 35px ${glowHex}, inset 0 0 15px ${innerGlowHex};">
          
          <!-- Header Accent Glow Line -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, ${borderHex} 0%, #f87171 100%);"></td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 40px 30px 25px 30px; background: radial-gradient(circle at top, ${headerGlowColor} 0%, transparent 70%);">
              <div style="font-size: 11px; font-weight: 700; color: ${borderHex}; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 8px;">${headerLabel}</div>
              <h1 style="margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                RUSH<span style="color: ${borderHex}; text-shadow: 0 0 15px ${glowHex};">${mainTitle}</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 4px; color: #f87171; text-transform: uppercase;">
                24-Hours National Engineering Challenge
              </p>
            </td>
          </tr>

          <!-- Rejection Icon & Message -->
          <tr>
            <td align="center" style="padding: 0 40px 30px 40px; text-align: center;">
              <div style="display: inline-block; width: 72px; height: 72px; line-height: 72px; border-radius: 22px; background: rgba(245,158,11,0.08); border: 2px solid ${borderHex}; margin-bottom: 24px; box-shadow: 0 0 25px ${glowHex};">
                <span style="font-size: 34px; color: ${borderHex}; vertical-align: middle;">${iconSpan}</span>
              </div>
              <h2 style="margin: 0 0 12px 0; font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${mainTitle}</h2>
              <p style="margin: 0; font-size: 15px; color: #cbd5e1; line-height: 1.6;">
                Hi <strong>${leaderName}</strong>, your registration for team <strong>${teamName}</strong> (ID: ${registrationId}) has been updated.
              </p>
              <div style="margin-top: 18px; padding: 6px 20px; background: ${bannerBg}; border-radius: 30px; display: inline-block; box-shadow: 0 0 12px ${glowHex}; color: #ffffff; font-weight: 700; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">
                STATUS: ${statusText}
              </div>
            </td>
          </tr>

          <!-- Rejection details -->
          <tr>
            <td style="padding: 0 35px 30px 35px;">
              <div style="background: ${infoBoxBg}; border: 2px solid ${infoBoxBorder}; border-radius: 20px; padding: 30px; box-shadow: inset 0 2px 4px rgba(255,255,255,0.05), 0 10px 20px rgba(0,0,0,0.4);">
                <h3 style="margin: 0 0 12px 0; font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: ${infoBoxTitleColor}; text-transform: uppercase; letter-spacing: 1px;">⚠️ Details</h3>
                <p style="margin: 0; font-size: 15px; color: #e2e8f0; line-height: 1.6; font-weight: 600;">
                  ${reason}
                </p>
                <p style="margin: 15px 0 0 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                  ${isRefundRejection ? 'Our finance team will process your refund shortly. We appreciate your interest in RUSH HOUR 24 and hope to see you in future events.' : 'Please submit a new registration with valid proof of payment, or contact our support team immediately if you believe this is an error.'}
                </p>
              </div>
            </td>
          </tr>

          <!-- Support & Info -->
          <tr>
            <td style="padding: 0 35px 35px 35px;">
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 25px; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                  If you have any questions or queries, please reply to this email or contact us at:
                  <br>
                  <strong style="color: #ffffff; display: block; margin-top: 8px; font-size: 15px;">rushhour2026.sathyabama@gmail.com</strong>
                </p>
              </div>
            </td>
          </tr>

          <!-- Email Footer -->
          <tr>
            <td align="center" style="background: rgba(8, 4, 18, 0.95); padding: 35px 30px; border-top: 2px solid ${footerBorder}; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #4b5563; letter-spacing: 0.5px;">
                &copy; 2026 Sathyabama Institute of Science and Technology. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `RUSH HOUR 24 <hello@rushhour.sistcybersummit.tech>`,
      to: [email],
      reply_to: 'rushhour2026.sathyabama@gmail.com',
      subject: subjectLine,
      html: htmlContent
    });

    if (error) {
      console.error(`❌ Failed to send rejection email to ${email}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✉️ Rejection email sent to ${email} (MessageID: ${data.id})`);
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error(`❌ Failed to send rejection email to ${email}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends an accommodation confirmation email to the team leader.
 */
async function sendAccommodationConfirmationEmail(bookingDetails) {
  const { registrationId, teamName, email, boysCount, girlsCount, bookedMembers } = bookingDetails;
  const formattedId = `RH-${String(registrationId).padStart(4, '0')}`;

  if (!resend) {
    console.warn(`⚠️ Resend is not initialized. Skipping accommodation confirmation email to ${email}.`);
    return { success: false, error: 'Resend is not initialized (missing API key)' };
  }

  const membersListHtml = bookedMembers.map((member, index) => `
    <tr style="border-bottom: 1px solid rgba(168, 85, 247, 0.15);">
      <td style="padding: 14px 10px; color: #f472b6; font-size: 13px; font-weight: bold; text-align: center; font-family: monospace; text-shadow: 0 0 4px rgba(244,114,182,0.3);">${String(index + 1).padStart(2, '0')}</td>
      <td style="padding: 14px 10px; color: #ffffff; font-size: 14px; font-weight: 600;">${member.name}</td>
      <td style="padding: 14px 10px; color: #cbd5e1; font-size: 13px;">${member.email}</td>
      <td style="padding: 14px 10px; color: #c084fc; font-size: 13px; text-align: center; font-weight: bold; text-transform: uppercase;">${member.gender}</td>
    </tr>
  `).join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RUSH HOUR 24 — Accommodation Request Received</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #03000a; color: #e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #03000a linear-gradient(180deg, #05020c 0%, #0c081d 100%); padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background: #0a0614; border-radius: 24px; border: 2px solid #a855f7; overflow: hidden; box-shadow: 0 0 35px rgba(168, 85, 247, 0.25), inset 0 0 15px rgba(168, 85, 247, 0.1);">
          
          <!-- Header Accent Glow Line -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #a855f7 0%, #f472b6 100%);"></td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 40px 30px 25px 30px; background: radial-gradient(circle at top, rgba(168, 85, 247, 0.2) 0%, transparent 70%);">
              <div style="font-size: 11px; font-weight: 700; color: #a855f7; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 8px;">[ ACCOMMODATION REQUEST ]</div>
              <h1 style="margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                RUSH<span style="color: #a855f7; text-shadow: 0 0 15px rgba(168, 85, 247, 0.65);">HOUR</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 4px; color: #f472b6; text-transform: uppercase;">
                24-Hours National Engineering Challenge
              </p>
            </td>
          </tr>

          <!-- Welcome message -->
          <tr>
            <td align="center" style="padding: 0 40px 30px 40px; text-align: center;">
              <div style="display: inline-block; width: 72px; height: 72px; line-height: 72px; border-radius: 22px; background: rgba(168, 85, 247, 0.12); border: 2px solid rgba(168, 85, 247, 0.35); margin-bottom: 24px; box-shadow: 0 0 25px rgba(168, 85, 247, 0.3);">
                <span style="font-size: 34px; color: #a855f7; vertical-align: middle;">🏨</span>
              </div>
              <h2 style="margin: 0 0 12px 0; font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Request Received!</h2>
              <p style="margin: 0; font-size: 15px; color: #94a3b8; line-height: 1.6;">
                We have received your accommodation booking request for team <strong>${teamName}</strong>. Our logistics team is verifying your payment proof.
              </p>
              <div style="margin-top: 18px; padding: 6px 20px; background: linear-gradient(90deg, #a855f7, #f472b6); border-radius: 30px; display: inline-block; box-shadow: 0 0 12px rgba(168, 85, 247, 0.45); color: #ffffff; font-weight: 700; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">
                STATUS: PENDING VERIFICATION
              </div>
            </td>
          </tr>

          <!-- Summary Ticket -->
          <tr>
            <td style="padding: 0 35px 30px 35px;">
              <div style="background: linear-gradient(135deg, #0e091b 0%, #150d28 100%); border: 2px solid #581c87; border-radius: 20px; padding: 30px; box-shadow: inset 0 2px 4px rgba(255,255,255,0.05), 0 10px 20px rgba(0,0,0,0.4);">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-bottom: 24px;">
                      <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #f472b6; letter-spacing: 2px; display: block; margin-bottom: 6px;">[ ENTRY PASS ID ]</span>
                      <strong style="font-size: 28px; color: #ffffff; letter-spacing: 2px; font-family: 'Space Grotesk', monospace; text-shadow: 0 0 15px rgba(168,85,247,0.7);">${formattedId}</strong>
                    </td>
                    <td style="padding-bottom: 24px; text-align: right;">
                      <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #f472b6; letter-spacing: 2px; display: block; margin-bottom: 6px;">[ ROOMING REQUEST ]</span>
                      <strong style="font-size: 20px; color: #c084fc; font-family: 'Space Grotesk', sans-serif; text-shadow: 0 0 10px rgba(192,132,252,0.4);">${boysCount} Boys / ${girlsCount} Girls</strong>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Roster -->
          <tr>
            <td style="padding: 0 35px 30px 35px;">
              <h3 style="margin: 0 0 16px 0; font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 700; color: #ffffff; border-left: 4px solid #a855f7; padding-left: 12px; letter-spacing: 0.5px;">ACCOMMODATION MEMBERS</h3>
              <div style="background: #0d091b; border-radius: 16px; border: 1px solid #3b0764; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                  <thead>
                    <tr style="background: rgba(168, 85, 247, 0.15); border-bottom: 2px solid #3b0764;">
                      <th align="center" style="padding: 14px 10px; color: #c084fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">#</th>
                      <th align="left" style="padding: 14px 10px; color: #c084fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Name</th>
                      <th align="left" style="padding: 14px 10px; color: #c084fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Email</th>
                      <th align="center" style="padding: 14px 10px; color: #c084fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Gender</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${membersListHtml}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          <!-- Email Footer -->
          <tr>
            <td align="center" style="background: rgba(8, 4, 18, 0.95); padding: 35px 30px; border-top: 2px solid #3b0764; text-align: center;">
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8;">
                Have questions or need updates regarding accommodation?
              </p>
              <p style="margin: 0; font-size: 15px; font-weight: 700; font-family: 'Space Grotesk', sans-serif;">
                Email us at: <a href="mailto:rushhour2026.sathyabama@gmail.com" style="color: #c084fc; text-decoration: none; text-shadow: 0 0 8px rgba(192,132,252,0.3);">rushhour2026.sathyabama@gmail.com</a>
              </p>
              <p style="margin: 24px 0 0 0; font-size: 11px; color: #4b5563; letter-spacing: 0.5px;">
                &copy; 2026 Sathyabama Institute of Science and Technology. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `RUSH HOUR 24 <hello@rushhour.sistcybersummit.tech>`,
      to: [email],
      reply_to: 'rushhour2026.sathyabama@gmail.com',
      subject: `🏨 Accommodation Request Received: Team ${teamName} [ID: ${formattedId}]`,
      html: htmlContent
    });

    if (error) {
      console.error(`❌ Failed to send accommodation confirmation email to ${email}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✉️ Accommodation confirmation email sent to ${email} (MessageID: ${data.id})`);
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error(`❌ Failed to send accommodation confirmation email to ${email}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends an accommodation verification success email to the team leader.
 */
async function sendAccommodationVerificationEmail(bookingDetails) {
  const { registrationId, teamName, email, boysCount, girlsCount, bookedMembers } = bookingDetails;
  const formattedId = `RH-${String(registrationId).padStart(4, '0')}`;

  if (!resend) {
    console.warn(`⚠️ Resend is not initialized. Skipping accommodation verification email to ${email}.`);
    return { success: false, error: 'Resend is not initialized (missing API key)' };
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RUSH HOUR 24 — Accommodation Confirmed</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #03000a; color: #e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #03000a linear-gradient(180deg, #05020c 0%, #0c081d 100%); padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background: #0a0614; border-radius: 24px; border: 2px solid #10b981; overflow: hidden; box-shadow: 0 0 35px rgba(16, 185, 129, 0.25), inset 0 0 15px rgba(16, 185, 129, 0.1);">
          
          <!-- Header Accent Glow Line -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);"></td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 40px 30px 25px 30px; background: radial-gradient(circle at top, rgba(16, 185, 129, 0.2) 0%, transparent 70%);">
              <div style="font-size: 11px; font-weight: 700; color: #10b981; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 8px;">[ ACCOMMODATION VERIFIED ]</div>
              <h1 style="margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                RUSH<span style="color: #10b981; text-shadow: 0 0 15px rgba(16, 185, 129, 0.65);">HOUR</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 4px; color: #3b82f6; text-transform: uppercase;">
                24-Hours National Engineering Challenge
              </p>
            </td>
          </tr>

          <!-- Success Icon & Welcome message -->
          <tr>
            <td align="center" style="padding: 0 40px 30px 40px; text-align: center;">
              <div style="display: inline-block; width: 72px; height: 72px; line-height: 72px; border-radius: 22px; background: rgba(16, 185, 129, 0.12); border: 2px solid rgba(16, 185, 129, 0.35); margin-bottom: 24px; box-shadow: 0 0 25px rgba(16, 185, 129, 0.3);">
                <span style="font-size: 34px; color: #10b981; vertical-align: middle;">🏨</span>
              </div>
              <h2 style="margin: 0 0 12px 0; font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Accommodation Confirmed!</h2>
              <p style="margin: 0; font-size: 15px; color: #94a3b8; line-height: 1.6;">
                Great news! Your accommodation payment and booking details for team <strong>${teamName}</strong> have been successfully verified.
              </p>
              <div style="margin-top: 18px; padding: 6px 20px; background: linear-gradient(90deg, #10b981, #059669); border-radius: 30px; display: inline-block; box-shadow: 0 0 12px rgba(16, 185, 129, 0.45); color: #ffffff; font-weight: 700; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">
                STATUS: BOOKING VERIFIED
              </div>
            </td>
          </tr>

          <!-- Room Allocation Info -->
          <tr>
            <td style="padding: 0 35px 35px 35px;">
              <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 25px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                <h3 style="margin: 0 0 15px 0; font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">🏨 Accommodation Allocation Details</h3>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td valign="top" style="padding-bottom: 16px;">
                      <strong style="color: #3b82f6; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Allocated Allocation</strong>
                      <span style="font-size: 14px; color: #cbd5e1; line-height: 1.5; font-weight: 500;">
                        ${boysCount > 0 ? `• Boys: ${boysCount} slot(s) in Men's Hostel<br>` : ''}
                        ${girlsCount > 0 ? `• Girls: ${girlsCount} slot(s) in Women's Hostel<br>` : ''}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td valign="top">
                      <strong style="color: #3b82f6; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Important Instructions</strong>
                      <span style="font-size: 14px; color: #cbd5e1; line-height: 1.5; font-weight: 500;">
                        Upon arrival at Sathyabama Institute of Science and Technology, please head to the respective hostel reception desks for room keys and instructions. Keep this verified pass ready.
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Check-in requirements -->
          <tr>
            <td style="padding: 0 35px 40px 35px;">
              <h3 style="margin: 0 0 16px 0; font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 700; color: #ffffff; border-left: 4px solid #10b981; padding-left: 12px; letter-spacing: 0.5px;">CHECK-IN REQUIREMENTS</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #94a3b8; line-height: 1.7;">
                <li style="margin-bottom: 10px; color: #cbd5e1;">Show this verified accommodation email pass at the hostel check-in desk.</li>
                <li style="margin-bottom: 10px; color: #cbd5e1;">All students must bring their physical college identity card.</li>
                <li style="margin-bottom: 10px; color: #cbd5e1;">Students are advised to bring personal lock & key, blankets, and essential personal care items.</li>
              </ul>
            </td>
          </tr>

          <!-- Email Footer -->
          <tr>
            <td align="center" style="background: rgba(8, 4, 18, 0.95); padding: 35px 30px; border-top: 2px solid #065f46; text-align: center;">
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8;">
                Need help or have questions regarding boarding or logistics?
              </p>
              <p style="margin: 0; font-size: 15px; font-weight: 700; font-family: 'Space Grotesk', sans-serif;">
                Email us at: <a href="mailto:rushhour2026.sathyabama@gmail.com" style="color: #10b981; text-decoration: none; text-shadow: 0 0 8px rgba(16,185,129,0.3);">rushhour2026.sathyabama@gmail.com</a>
              </p>
              <p style="margin: 24px 0 0 0; font-size: 11px; color: #4b5563; letter-spacing: 0.5px;">
                &copy; 2026 Sathyabama Institute of Science and Technology. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `RUSH HOUR 24 <hello@rushhour.sistcybersummit.tech>`,
      to: [email],
      reply_to: 'rushhour2026.sathyabama@gmail.com',
      subject: `✅ ACCOMMODATION VERIFIED! Team: ${teamName} [ID: ${formattedId}]`,
      html: htmlContent
    });

    if (error) {
      console.error(`❌ Failed to send accommodation verification email to ${email}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✉️ Accommodation verification email sent to ${email} (MessageID: ${data.id})`);
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error(`❌ Failed to send accommodation verification email to ${email}:`, err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendConfirmationEmail,
  sendVerificationSuccessEmail,
  sendRejectionEmail,
  sendAccommodationConfirmationEmail,
  sendAccommodationVerificationEmail
};
