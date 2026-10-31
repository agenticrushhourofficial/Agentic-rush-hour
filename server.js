const express = require('express');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();
const { sendConfirmationEmail, sendVerificationSuccessEmail, sendRejectionEmail, sendAccommodationConfirmationEmail, sendAccommodationVerificationEmail } = require('./emailService');

// ─── AES Encryption Helpers for Team ID Obfuscation ──────────────────────────
const SECRET_PASSPHRASE = process.env.ADMIN_PASSWORD || 'FallbackSecretPasswordKey123';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(SECRET_PASSPHRASE).digest(); // 32 bytes
const IV_LENGTH = 16;

function encryptId(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + 'g' + encrypted;
}

function decryptId(token) {
  try {
    const parts = token.split('g');
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null;
  }
}

const app = express();
const PORT = process.env.PORT || 8000;

// ─── Multer Storage (Payment Proof Screenshots in Memory) ───────────────────
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, GIF) are allowed for payment proof.'));
    }
  }
});

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json());
// Block direct access to /private directory
app.use('/private', (req, res) => res.status(404).send('Not Found'));

// Serve explicit root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve static assets and html pages
app.use(express.static(__dirname));

// ─── Admin Security & Authentication ──────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'superadmin123';
const adminSessions = new Set();

// Middleware to authenticate admin requests
const adminAuth = (req, res, next) => {
  let token = req.query.token;
  if (!token) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Session token is missing.' });
  }
  if (!adminSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized: Session has expired or is invalid.' });
  }
  next();
};

// ─── Hackathon Countdown Logic ──────────────────────────────────────────────
app.get('/api/hackathon-config', async (req, res) => {
  let startDate = process.env.HACKATHON_START_DATE || '2026-11-10T09:00:00+05:30';
  let actualStartTime = null;
  let isRedAlert = false;
  
  let durationHours = 24;
  if (isMockDb) {
    actualStartTime = mockConfig['hackathon_start_time'] || null;
    startDate = mockConfig['hackathon_start_date'] || startDate;
    isRedAlert = mockConfig['is_red_alert'] === 'true';
    durationHours = mockConfig['hackathon_duration_hours'] ? Number(mockConfig['hackathon_duration_hours']) : 24;
  } else {
    try {
      const result = await pool.query("SELECT value FROM hackathon_config WHERE key = 'hackathon_start_time';");
      if (result.rows.length > 0) {
        actualStartTime = result.rows[0].value;
      }
      
      const dateResult = await pool.query("SELECT value FROM hackathon_config WHERE key = 'hackathon_start_date';");
      if (dateResult.rows.length > 0) {
        startDate = dateResult.rows[0].value;
      }
      
      const raResult = await pool.query("SELECT value FROM hackathon_config WHERE key = 'is_red_alert';");
      if (raResult.rows.length > 0) {
        isRedAlert = raResult.rows[0].value === 'true';
      }

      const durResult = await pool.query("SELECT value FROM hackathon_config WHERE key = 'hackathon_duration_hours';");
      if (durResult.rows.length > 0) {
        durationHours = Number(durResult.rows[0].value) || 24;
      }
    } catch (err) {
      console.error('❌ Failed to fetch hackathon start config:', err);
    }
  }

  res.json({ startDate, actualStartTime, isRedAlert, durationHours });
});

// POST /api/countdown/start — Triggers the start of the 24-hour countdown globally
app.post('/api/countdown/start', adminAuth, async (req, res) => {
  const startTimeStr = new Date().toISOString();

  if (isMockDb) {
    mockConfig['hackathon_start_time'] = startTimeStr;
    console.log(`💾 [Mock DB] Hackathon started at: ${startTimeStr}`);
    return res.json({ success: true, actualStartTime: startTimeStr });
  } else {
    try {
      const query = `
        INSERT INTO hackathon_config (key, value)
        VALUES ('hackathon_start_time', $1)
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value;
      `;
      await pool.query(query, [startTimeStr]);
      console.log(`💾 [Neon DB] Hackathon started at: ${startTimeStr}`);
      return res.json({ success: true, actualStartTime: startTimeStr });
    } catch (err) {
      console.error('❌ Failed to save hackathon start time:', err);
      return res.status(500).json({ error: 'Failed to save hackathon start time.' });
    }
  }
});

// POST /api/countdown/reset — Stops/Resets the countdown globally
app.post('/api/countdown/reset', adminAuth, async (req, res) => {
  if (isMockDb) {
    delete mockConfig['hackathon_start_time'];
    console.log(`💾 [Mock DB] Hackathon timer reset.`);
    return res.json({ success: true });
  } else {
    try {
      const query = `DELETE FROM hackathon_config WHERE key = 'hackathon_start_time';`;
      await pool.query(query);
      console.log(`💾 [Neon DB] Hackathon timer reset.`);
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Failed to reset hackathon start time:', err);
      return res.status(500).json({ error: 'Failed to reset hackathon start time.' });
    }
  }
});

// POST /api/countdown/set-start-date — Sets custom hackathon start date
app.post('/api/countdown/set-start-date', adminAuth, async (req, res) => {
  const { startDate } = req.body;
  if (!startDate) {
    return res.status(400).json({ error: 'Start date is required.' });
  }
  if (isMockDb) {
    mockConfig['hackathon_start_date'] = startDate;
    console.log(`💾 [Mock DB] Hackathon start date set to: ${startDate}`);
    return res.json({ success: true });
  } else {
    try {
      const query = `
        INSERT INTO hackathon_config (key, value)
        VALUES ('hackathon_start_date', $1)
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value;
      `;
      await pool.query(query, [startDate]);
      console.log(`💾 [Neon DB] Hackathon start date set to: ${startDate}`);
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Failed to save hackathon start date:', err);
      return res.status(500).json({ error: 'Failed to save hackathon start date.' });
    }
  }
});

// POST /api/countdown/redalert — Toggles overdrive (red alert) status globally
app.post('/api/countdown/redalert', adminAuth, async (req, res) => {
  const { isRedAlert } = req.body;
  const valStr = isRedAlert ? 'true' : 'false';
  if (isMockDb) {
    mockConfig['is_red_alert'] = valStr;
    console.log(`💾 [Mock DB] Red alert set to: ${valStr}`);
    return res.json({ success: true });
  } else {
    try {
      const query = `
        INSERT INTO hackathon_config (key, value)
        VALUES ('is_red_alert', $1)
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value;
      `;
      await pool.query(query, [valStr]);
      console.log(`💾 [Neon DB] Red alert set to: ${valStr}`);
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Failed to save red alert status:', err);
      return res.status(500).json({ error: 'Failed to save red alert status.' });
    }
  }
});

// POST /api/countdown/set-duration — Sets custom hackathon duration in hours
app.post('/api/countdown/set-duration', adminAuth, async (req, res) => {
  const { durationHours } = req.body;
  if (!durationHours || durationHours < 1) {
    return res.status(400).json({ error: 'Valid durationHours required.' });
  }
  const valStr = String(Number(durationHours));
  if (isMockDb) {
    mockConfig['hackathon_duration_hours'] = valStr;
    console.log(`💾 [Mock DB] Duration set to: ${valStr}h`);
    return res.json({ success: true });
  } else {
    try {
      await pool.query(`INSERT INTO hackathon_config (key, value) VALUES ('hackathon_duration_hours', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`, [valStr]);
      console.log(`💾 [Neon DB] Duration set to: ${valStr}h`);
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Failed to save duration:', err);
      return res.status(500).json({ error: 'Failed to save duration.' });
    }
  }
});

// POST /api/countdown/set-start-time — Directly sets the actualStartTime (for remaining-time override)
app.post('/api/countdown/set-start-time', adminAuth, async (req, res) => {
  const { startTime } = req.body;
  if (!startTime) {
    return res.status(400).json({ error: 'startTime is required.' });
  }
  if (isMockDb) {
    mockConfig['hackathon_start_time'] = startTime;
    console.log(`💾 [Mock DB] Start time backfilled to: ${startTime}`);
    return res.json({ success: true });
  } else {
    try {
      await pool.query(`INSERT INTO hackathon_config (key, value) VALUES ('hackathon_start_time', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`, [startTime]);
      console.log(`💾 [Neon DB] Start time backfilled to: ${startTime}`);
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Failed to save start time:', err);
      return res.status(500).json({ error: 'Failed to save start time.' });
    }
  }
});
// GET /api/public/announcements — Public list of announcements
app.get('/api/public/announcements', async (req, res) => {
  if (isMockDb) {
    return res.json(mockAnnouncements);
  } else {
    try {
      const query = 'SELECT * FROM announcements ORDER BY id DESC;';
      const result = await pool.query(query);
      return res.json(result.rows);
    } catch (err) {
      console.error('❌ Failed to query announcements:', err);
      return res.status(500).json({ error: 'Failed to fetch announcements.' });
    }
  }
});

// POST /api/admin/announcements — Adds a new announcement
app.post('/api/admin/announcements', adminAuth, async (req, res) => {
  const { message, type } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message content is required.' });
  }
  const annType = type || 'info';

  if (isMockDb) {
    let nextId = 1;
    mockAnnouncements.forEach(a => { if (a.id >= nextId) nextId = a.id + 1; });
    const newAnn = {
      id: nextId,
      message,
      type: annType,
      created_at: new Date()
    };
    mockAnnouncements.unshift(newAnn);
    console.log(`💾 [Mock DB] Added announcement: ${message}`);
    return res.status(201).json(newAnn);
  } else {
    try {
      const query = `
        INSERT INTO announcements (message, type)
        VALUES ($1, $2)
        RETURNING *;
      `;
      const result = await pool.query(query, [message, annType]);
      console.log(`💾 [Neon DB] Added announcement: ${message}`);
      return res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('❌ Failed to save announcement:', err);
      return res.status(500).json({ error: 'Failed to save announcement.' });
    }
  }
});

// DELETE /api/admin/announcements/:id — Deletes an announcement
app.delete('/api/admin/announcements/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const idInt = parseInt(id);

  if (isMockDb) {
    const idx = mockAnnouncements.findIndex(a => a.id === idInt);
    if (idx === -1) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }
    mockAnnouncements.splice(idx, 1);
    console.log(`💾 [Mock DB] Deleted announcement ID: ${id}`);
    return res.json({ success: true });
  } else {
    try {
      const query = 'DELETE FROM announcements WHERE id = $1 RETURNING *;';
      const result = await pool.query(query, [idInt]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Announcement not found.' });
      }
      console.log(`💾 [Neon DB] Deleted announcement ID: ${id}`);
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ Failed to delete announcement:', err);
      return res.status(500).json({ error: 'Failed to delete announcement.' });
    }
  }
});

app.get('/countdown', (req, res) => {
  const startDateString = process.env.HACKATHON_START_DATE || '2026-11-10T09:00:00+05:30';
  const startDate = new Date(startDateString);
  const now = new Date();

  // If the current time is before the hackathon start time, block access
  if (now < startDate) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Countdown Locked</title>
        <link rel="stylesheet" href="/index.css">
        <style>
          body { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background: #050505; color: #fff; font-family: sans-serif; text-align: center; padding: 2rem; }
          h1 { color: #00ffcc; text-shadow: 0 0 10px rgba(0,255,204,0.5); font-size: 3rem; }
          p { font-size: 1.2rem; opacity: 0.8; }
        </style>
      </head>
      <body>
        <h1>ACCESS DENIED</h1>
        <p>The hackathon countdown page will unlock automatically on the day of the event.</p>
        <a href="/" style="color: #00ffcc; margin-top: 2rem; text-decoration: none; border: 1px solid #00ffcc; padding: 10px 20px; border-radius: 5px;">Return Home</a>
      </body>
      </html>
    `);
  }

  // If it's time, serve the actual countdown HTML file
  res.sendFile(path.join(__dirname, 'countdown.html'));
});

// ─── Database Setup ─────────────────────────────────────────────────────────
const databaseUrl = process.env.DATABASE_URL;
let pool = null;
let isMockDb = false;
let mockDb = [];
let mockConfig = {};
let mockAccommodation = []; // Fallback in-memory accommodation table
let mockAnnouncements = [
  { id: 1, message: '🚀 RUSH HOUR 24 HAS OFFICIALLY LAUNCHED! 24 Hours on the clock.', type: 'urgent', created_at: new Date() },
  { id: 2, message: '💡 Mentor Support Desk is live. Submit tickets under the Mentor & APIs tab.', type: 'info', created_at: new Date() }
];

try {
  const fs = require('fs');
  const path = require('path');
  const backupDir = path.join(__dirname, 'private');
  const regBackupPath = path.join(backupDir, 'backup_registrations.json');
  if (fs.existsSync(regBackupPath)) {
    const data = fs.readFileSync(regBackupPath, 'utf8');
    if (data.trim()) {
      mockDb = JSON.parse(data);
      // Map legacy fields and default values
      const featuresPath = path.join(backupDir, 'zeroth_hour_features.json');
      let featuresMap = {};
      try {
        if (fs.existsSync(featuresPath)) {
          featuresMap = JSON.parse(fs.readFileSync(featuresPath, 'utf8'));
        }
      } catch (fe) {
        console.error('⚠️ Failed to load zeroth_hour_features.json:', fe);
      }

      mockDb.forEach(r => {
        if (!r.team_name && r.teamName) r.team_name = r.teamName;
        if (!r.leader_name && r.leaderName) r.leader_name = r.leaderName;
        if (!r.leader_email && r.email) r.leader_email = r.email;
        if (!r.leader_phone && r.phone) r.leader_phone = r.phone;
        if (!r.team_size && r.teamSize) r.team_size = r.teamSize;
        if (!r.status) r.status = 'pending';
        if (!r.attendance) r.attendance = {};
        r.zeroth_hour_feature = r.zeroth_hour_feature || featuresMap[String(r.id)] || null;
      });
      console.log(`💾 Loaded ${mockDb.length} registrations from local backup for mock DB.`);
    }
  }
  const accBackupPath = path.join(backupDir, 'backup_accommodations.json');
  if (fs.existsSync(accBackupPath)) {
    const data = fs.readFileSync(accBackupPath, 'utf8');
    if (data.trim()) {
      mockAccommodation = JSON.parse(data);
      console.log(`💾 Loaded ${mockAccommodation.length} accommodations from local backup for mock DB.`);
    }
  }
} catch (e) {
  console.error('⚠️ Failed to load mock database backups:', e);
}

if (!databaseUrl || databaseUrl.startsWith('postgres://mock')) {
  console.warn('\n=============================================================');
  console.warn('⚠️ WARNING: Neon DATABASE_URL connection string is not configured.');
  console.warn('Running in local in-memory mock database mode.');
  console.warn('=============================================================\n');
  isMockDb = true;
} else {
  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    pool.on('error', (err) => {
      console.error('⚠️ Unexpected error on idle database client:', err.message);
    });

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        team_name VARCHAR(255) NOT NULL,
        college VARCHAR(255) NOT NULL,
        leader_name VARCHAR(255) NOT NULL,
        leader_email VARCHAR(255) NOT NULL,
        leader_phone VARCHAR(50) NOT NULL,
        team_size INT NOT NULL,
        members JSONB NOT NULL,
        payment_proof TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        project_title TEXT,
        problem_statement TEXT,
        project_description TEXT,
        domain VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS hackathon_config (
        key VARCHAR(50) PRIMARY KEY,
        value VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS accommodation (
        id SERIAL PRIMARY KEY,
        registration_id INT NOT NULL,
        team_name VARCHAR(255) NOT NULL,
        leader_email VARCHAR(255) NOT NULL,
        boys_count INT DEFAULT 0,
        girls_count INT DEFAULT 0,
        booked_members JSONB NOT NULL,
        payment_proof TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Migration: add columns if not exists, and alter column type to TEXT to support Base64
    const migrateQuery = `
      ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_proof TEXT;
      ALTER TABLE registrations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
      ALTER TABLE registrations ALTER COLUMN payment_proof TYPE TEXT;
      ALTER TABLE registrations ADD COLUMN IF NOT EXISTS project_title TEXT;
      ALTER TABLE registrations ADD COLUMN IF NOT EXISTS problem_statement TEXT;
      ALTER TABLE registrations ADD COLUMN IF NOT EXISTS project_description TEXT;
      ALTER TABLE registrations ADD COLUMN IF NOT EXISTS domain VARCHAR(100);
      ALTER TABLE registrations ADD COLUMN IF NOT EXISTS attendance JSONB DEFAULT '{}';
      ALTER TABLE registrations ADD COLUMN IF NOT EXISTS zeroth_hour_feature TEXT;
    `;

    pool.query(createTableQuery)
      .then(() => pool.query(migrateQuery))
      .then(() => console.log('✅ PostgreSQL "registrations" & "accommodation" tables verified/created successfully.'))
      .catch(err => {
        console.error('❌ Error setting up database tables. Falling back to memory database:', err);
        isMockDb = true;
      });
  } catch (err) {
    console.error('❌ Failed to initialize pg connection pool. Falling back to memory database:', err);
    isMockDb = true;
  }
}

// Helper function to save a local backup of every registration to prevent data loss
function saveToBackupFile(record) {
  try {
    const backupDir = path.join(__dirname, 'private');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupPath = path.join(backupDir, 'backup_registrations.json');
    let data = [];
    if (fs.existsSync(backupPath)) {
      const fileContent = fs.readFileSync(backupPath, 'utf8');
      if (fileContent.trim()) {
        data = JSON.parse(fileContent);
      }
    }
    // Remove Base64 screenshot from backup log to keep file size small (optional but recommended)
    const backupRecord = { ...record };
    delete backupRecord.payment_proof;
    delete backupRecord.paymentProof;
    
    data.push(backupRecord);
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`📝 [Local Backup] Persistent backup saved for team: ${record.team_name || record.teamName}`);
  } catch (err) {
    console.error('❌ Failed to write local backup file:', err);
  }
}

// Helper function to save local backup of accommodation bookings
function saveAccommodationToBackupFile(record) {
  try {
    const backupDir = path.join(__dirname, 'private');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupPath = path.join(backupDir, 'backup_accommodations.json');
    let data = [];
    if (fs.existsSync(backupPath)) {
      const fileContent = fs.readFileSync(backupPath, 'utf8');
      if (fileContent.trim()) {
        data = JSON.parse(fileContent);
      }
    }
    const backupRecord = { ...record };
    delete backupRecord.payment_proof;
    delete backupRecord.paymentProof;
    
    data.push(backupRecord);
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`📝 [Local Backup] Accommodation backup saved for team: ${record.team_name || record.teamName}`);
  } catch (err) {
    console.error('❌ Failed to write local backup file for accommodation:', err);
  }
}

// Background job to periodically synchronize temporary in-memory registrations to Neon PostgreSQL database
async function syncMockDbToPostgres() {
  if (mockDb.length === 0 || !pool) return;

  try {
    const client = await pool.connect();
    client.release();
    console.log(`🔄 [Auto-Sync] Database is reachable. Syncing ${mockDb.length} pending registrations to Neon...`);

    // Temporarily turn off isMockDb so new requests go straight to Neon
    isMockDb = false;

    // Copy items to process one by one
    const itemsToSync = [...mockDb];

    for (const record of itemsToSync) {
      try {
        const insertQuery = `
          INSERT INTO registrations (id, team_name, college, leader_name, leader_email, leader_phone, team_size, members, payment_proof, status, project_title, problem_statement, project_description, domain)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING id;
        `;
        const values = [
          record.id,
          record.team_name,
          record.college,
          record.leader_name || record.leaderName || record.teamLeader,
          record.leader_email || record.leaderEmail || record.email,
          record.leader_phone || record.leaderPhone || record.phone,
          record.team_size || record.teamSize,
          JSON.stringify(record.members),
          record.payment_proof || record.paymentProof,
          record.status || 'pending',
          record.project_title || record.projectTitle || null,
          record.problem_statement || record.problemStatement || null,
          record.project_description || record.projectDescription || null,
          record.domain || null
        ];
        
        await pool.query(insertQuery, values);
        console.log(`✅ [Auto-Sync] Successfully pushed team '${record.team_name}' to Neon database!`);

        // Remove the processed record from mockDb
        mockDb = mockDb.filter(item => item.id !== record.id);
      } catch (insertErr) {
        console.error(`❌ [Auto-Sync] Failed to insert synced team '${record.team_name}':`, insertErr);
        if (insertErr.code === '23505') {
          // Unique constraint violation (duplicate key). Remove from mock queue and continue.
          mockDb = mockDb.filter(item => item.id !== record.id);
          console.log(`💡 [Auto-Sync] Team '${record.team_name}' (ID: ${record.id}) already exists in Neon. Cleared from queue.`);
          continue;
        }
        isMockDb = true; // reset back to mock mode if other queries fail
        break; // stop processing
      }
    }
  } catch (connErr) {
    // Database still unreachable, keep mock mode active
    isMockDb = true;
  }
}

// Check and sync every 30 seconds
setInterval(syncMockDbToPostgres, 30000);

// ─── REST APIs ───────────────────────────────────────────────────────────────

const SLOT_LIMITS = {
  1: 100,
  2: 100,
  3: 100,
  4: 100,
  5: 100,
  6: 100
};

async function getRemainingSlots() {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  if (isMockDb) {
    mockDb.forEach(r => {
      if (r.status !== 'rejected' && counts[r.team_size] !== undefined) {
        counts[r.team_size]++;
      }
    });
  } else {
    try {
      const result = await pool.query(
        "SELECT team_size, COUNT(*) as count FROM registrations WHERE status != 'rejected' GROUP BY team_size;"
      );
      result.rows.forEach(row => {
        counts[parseInt(row.team_size)] = parseInt(row.count);
      });
    } catch (err) {
      console.error('Error fetching registration counts:', err);
    }
  }

  const remaining = {};
  for (let s = 1; s <= 6; s++) {
    remaining[s] = Math.max(0, (SLOT_LIMITS[s] || 100) - (counts[s] || 0));
  }
  return remaining;
}

// GET /api/registration-status — Return remaining slots for each team size
app.get('/api/registration-status', async (req, res) => {
  try {
    const slots = await getRemainingSlots();
    res.json({ success: true, slots });
  } catch (err) {
    console.error('Failed to retrieve registration status:', err);
    res.status(500).json({ error: 'Failed to retrieve registration status.' });
  }
});

// GET /api/public/team/:encryptedId — Public route to fetch non-sensitive team details for QR scanning
app.get('/api/public/team/:encryptedId', async (req, res) => {
  const { encryptedId } = req.params;
  const decrypted = decryptId(encryptedId);
  if (!decrypted) {
    return res.status(400).json({ error: 'Invalid secure token.' });
  }

  const parsedId = parseInt(decrypted, 10);
  if (isNaN(parsedId)) {
    return res.status(400).json({ error: 'Invalid secure token format.' });
  }

  if (isMockDb) {
    const record = mockDb.find(r => r.id === parsedId);
    if (!record) {
      return res.status(404).json({ error: 'Team not found.' });
    }
    const publicRecord = {
      id: record.id,
      team_name: record.team_name,
      college: record.college,
      leader_name: record.leader_name,
      team_size: record.team_size,
      members: record.members,
      project_title: record.project_title,
      problem_statement: record.problem_statement,
      project_description: record.project_description,
      domain: record.domain,
      created_at: record.created_at
    };
    return res.json({ success: true, team: publicRecord });
  } else {
    try {
      const query = `
        SELECT id, team_name, college, leader_name, team_size, members, project_title, problem_statement, project_description, domain, created_at
        FROM registrations
        WHERE id = $1;
      `;
      const result = await pool.query(query, [parsedId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Team not found.' });
      }
      return res.json({ success: true, team: result.rows[0] });
    } catch (dbErr) {
      console.error('❌ Public database query failed:', dbErr);
      return res.status(500).json({ error: 'Failed to retrieve team details.' });
    }
  }
});

// POST /api/register — multipart/form-data with optional file upload
app.post('/api/register', upload.single('paymentProof'), async (req, res) => {
  const {
    teamName,
    college,
    orgType,
    teamLeader,
    email,
    phone,
    teamSize: teamSizeStr,
    submissionType,
    tracks,
    members: membersStr,
    projectTitle,
    problemStatement,
    projectDescription,
    domain
  } = req.body;

  const teamSize = parseInt(teamSizeStr);
  let members;

  try {
    members = JSON.parse(membersStr);
  } catch {
    return res.status(400).json({ error: 'Invalid members data format.' });
  }

  // ── Basic field validation ──────────────────────────────────────────────
  if (!teamName || !college || !teamLeader || !email || !phone || !teamSize || !members) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (teamSize < 1 || teamSize > 6) {
    return res.status(400).json({ error: 'Team size must be between 1 and 6 members.' });
  }

  const slots = await getRemainingSlots();
  if (slots[teamSize] <= 0) {
    return res.status(400).json({ error: `Registrations for ${teamSize} member teams are currently closed.` });
  }

  if (members.length !== teamSize) {
    return res.status(400).json({ error: `Must provide exactly ${teamSize} members details.` });
  }

  // ── Payment proof validation ───────────────────────────────────────────
  if (!req.file) {
    return res.status(400).json({ error: 'Payment proof screenshot is required.' });
  }

  // ── Email validation ───────────────────────────────────────────────────
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Leader email is invalid.' });
  }

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (!member.name || !member.email || !member.college || !member.phone) {
      return res.status(400).json({ error: `Name, organization, phone, and email for Member ${i + 1} are required.` });
    }
    if (!emailRegex.test(member.email)) {
      return res.status(400).json({ error: `Email for Member ${i + 1} is invalid.` });
    }
  }

  // Convert uploaded image to Base64 Data URL string
  const paymentProofBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

  // ── Database Save ──────────────────────────────────────────────────────
  if (!isMockDb) {
    try {
      // Find the first unused positive integer ID (lowest gap starting from 1)
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
        INSERT INTO registrations (id, team_name, college, leader_name, leader_email, leader_phone, team_size, members, payment_proof, project_title, problem_statement, project_description, domain)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id;
      `;
      const values = [nextId, teamName, college, teamLeader, email, phone, teamSize, JSON.stringify(members), paymentProofBase64, projectTitle || null, problemStatement || null, projectDescription || null, domain || null];
      const result = await pool.query(insertQuery, values);
      const insertedId = result.rows[0].id;
      console.log(`💾 [Neon DB] Saved registration for team: ${teamName} (ID: ${insertedId}) with Base64 image`);

      // Save persistent local backup copy on the server
      saveToBackupFile({
        id: insertedId,
        teamName,
        college,
        orgType: orgType || null,
        leaderName: teamLeader,
        email,
        phone,
        teamSize,
        submissionType: submissionType || 'single',
        tracks: tracks || null,
        members,
        project_title: projectTitle || null,
        problem_statement: problemStatement || null,
        project_description: projectDescription || null,
        domain: domain || null,
        created_at: new Date()
      });

      // Send email confirmation in background
      sendConfirmationEmail({
        id: insertedId,
        teamName,
        college,
        leaderName: teamLeader,
        email,
        phone,
        teamSize,
        members
      }).catch(err => console.error('Background email confirmation failed:', err));

      return res.status(201).json({ success: true, id: insertedId, mode: 'neon' });
    } catch (dbErr) {
      console.error('❌ Database insertion failed. Falling back to memory database:', dbErr);
      isMockDb = true;
    }
  }

  // Fallback / In-Memory Mode
  let nextId = 1;
  const existingIds = new Set(mockDb.map(r => r.id));
  while (existingIds.has(nextId)) {
    nextId++;
  }

  const newRecord = {
    id: nextId,
    team_name: teamName,
    college,
    org_type: orgType || null,
    leader_name: teamLeader,
    leader_email: email,
    leader_phone: phone,
    team_size: teamSize,
    submission_type: submissionType || 'single',
    tracks: tracks || null,
    members,
    payment_proof: paymentProofBase64,
    project_title: projectTitle || null,
    problem_statement: problemStatement || null,
    project_description: projectDescription || null,
    domain: domain || null,
    status: 'pending',
    created_at: new Date()
  };
  mockDb.push(newRecord);
  console.log(`💾 [Mock DB] Saved registration for team: ${teamName}`);

  // Save persistent local backup copy on the server
  saveToBackupFile(newRecord);

  // Send email confirmation in background
  sendConfirmationEmail({
    id: newRecord.id,
    teamName,
    college,
    leaderName: teamLeader,
    email,
    phone,
    teamSize,
    members
  }).catch(err => console.error('Background email confirmation failed:', err));

  return res.status(201).json({ success: true, id: newRecord.id, mode: 'memory' });
});// POST /api/admin/login — Verify password and issue temporary session token
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }
  if (password === ADMIN_PASSWORD) {
    // Generate simple unique token
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    adminSessions.add(token);
    return res.json({ success: true, token });
  } else {
    return res.status(401).json({ error: 'Incorrect admin password.' });
  }
});

// POST /api/superadmin/login — Verify superadmin password and issue session token
app.post('/api/superadmin/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }
  if (password === SUPERADMIN_PASSWORD) {
    // Generate simple unique token and add to the same adminSessions set
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    adminSessions.add(token);
    return res.json({ success: true, token });
  } else {
    return res.status(401).json({ error: 'Incorrect super admin password.' });
  }
});

// GET /api/public/leaderboard-teams — Public safe list of verified teams for the dashboard leaderboard
app.get('/api/public/leaderboard-teams', async (req, res) => {
  if (isMockDb) {
    const publicList = mockDb
      .filter(r => r.status === 'verified')
      .map(r => ({
        id: r.id,
        team_name: r.team_name,
        college: r.college,
        domain: r.domain,
        project_title: r.project_title,
        project_description: r.project_description,
        members: r.members ? r.members.map(m => m.name) : [],
        created_at: r.created_at
      }));
    return res.json(publicList);
  } else {
    try {
      const query = `
        SELECT id, team_name, college, domain, project_title, project_description, members, created_at
        FROM registrations
        WHERE status = 'verified'
        ORDER BY id ASC;
      `;
      const result = await pool.query(query);
      const rows = result.rows.map(row => {
        let memberNames = [];
        try {
          const parsed = typeof row.members === 'string' ? JSON.parse(row.members) : row.members;
          if (Array.isArray(parsed)) {
            memberNames = parsed.map(m => m.name);
          }
        } catch (e) {
          console.error('Error parsing members for public list:', e);
        }
        return {
          id: row.id,
          team_name: row.team_name,
          college: row.college,
          domain: row.domain,
          project_title: row.project_title,
          project_description: row.project_description,
          members: memberNames,
          created_at: row.created_at
        };
      });
      return res.json(rows);
    } catch (dbErr) {
      console.error('❌ Public database query failed:', dbErr);
      return res.status(500).json({ error: 'Failed to retrieve leaderboard teams.' });
    }
  }
});

// GET /api/public/zeroth-hour-teams — Secure public list of verified teams for the dropdown
app.get('/api/public/zeroth-hour-teams', async (req, res) => {
  if (isMockDb) {
    const publicList = mockDb
      .filter(r => r.status === 'verified')
      .map(r => ({
        team_name: r.team_name || r.teamName || '',
        college: r.college || ''
      }));
    return res.json(publicList);
  } else {
    try {
      const query = `
        SELECT team_name, college
        FROM registrations
        WHERE status = 'verified'
        ORDER BY team_name ASC;
      `;
      const result = await pool.query(query);
      return res.json(result.rows);
    } catch (dbErr) {
      console.error('❌ Failed to fetch zeroth-hour teams:', dbErr);
      return res.status(500).json({ error: 'Failed to retrieve teams.' });
    }
  }
});

// POST /api/zeroth-hour/verify — Verify team name and Team ID and return the assigned feature
app.post('/api/zeroth-hour/verify', async (req, res) => {
  const { teamName, teamId } = req.body;
  if (!teamName || !teamId) {
    return res.status(400).json({ error: 'Both Team Name and Team ID are required.' });
  }

  let cleanId = String(teamId).trim().toLowerCase();
  if (cleanId.startsWith('rh-')) {
    cleanId = cleanId.substring(3);
  }
  const numericId = parseInt(cleanId, 10);
  if (isNaN(numericId)) {
    return res.status(400).json({ error: 'Invalid Team ID format. Please use numbers or format like rh-0001.' });
  }

  if (isMockDb) {
    // Check in-memory database
    const team = mockDb.find(r => {
      const dbTeamName = (r.team_name || r.teamName || '').toLowerCase().trim();
      const inputTeamName = teamName.toLowerCase().trim();
      return dbTeamName === inputTeamName && Number(r.id) === numericId && r.status === 'verified';
    });
    if (!team) {
      return res.status(404).json({ error: 'Team name and Team ID combination not found or team is not verified.' });
    }
    
    const feature = team.zeroth_hour_feature || null;
    if (feature) {
      return res.json({ feature });
    } else {
      return res.json({ feature: 'No feature has been assigned to your team yet. Please contact administrators.' });
    }
  } else {
    try {
      const query = `
        SELECT zeroth_hour_feature FROM registrations 
        WHERE LOWER(TRIM(team_name)) = LOWER(TRIM($1)) 
          AND id = $2 
          AND status = 'verified';
      `;
      const result = await pool.query(query, [teamName, numericId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Team name and Team ID combination not found or team is not verified.' });
      }
      
      const feature = result.rows[0].zeroth_hour_feature;
      if (feature) {
        return res.json({ feature });
      } else {
        return res.json({ feature: 'No feature has been assigned to your team yet. Please contact administrators.' });
      }
    } catch (dbErr) {
      console.error('❌ Error verifying zeroth hour team:', dbErr);
      return res.status(500).json({ error: 'Database verification failed.' });
    }
  }
});

// GET /api/admin/registrations — Admin secured view of all registrants (Optimized: Excludes heavy payment_proof base64 string)
app.get('/api/admin/registrations', adminAuth, async (req, res) => {
  if (isMockDb) {
    const listData = mockDb.map(r => {
      const copy = { ...r };
      delete copy.payment_proof;
      copy.encrypted_id = encryptId(r.id);
      return copy;
    });
    return res.json(listData.sort((a, b) => a.id - b.id));
  } else {
    try {
      const query = `
        SELECT id, team_name, college, leader_name, leader_email, leader_phone, team_size, members, status, table_no, created_at, project_title, problem_statement, project_description, domain, attendance
        FROM registrations
        ORDER BY id ASC;
      `;
      const result = await pool.query(query);
      const rows = result.rows.map(row => {
        return {
          ...row,
          encrypted_id: encryptId(row.id)
        };
      });
      return res.json(rows);
    } catch (dbErr) {
      console.error('❌ Database query failed:', dbErr);
      return res.status(500).json({ error: 'Failed to retrieve registrations.' });
    }
  }
});

// GET /api/admin/registration-proof/:id — Retrieve only the payment proof (Base64) for a single registrant
app.get('/api/admin/registration-proof/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  if (isMockDb) {
    const record = mockDb.find(r => r.id === parseInt(id));
    if (!record) {
      return res.status(404).json({ error: 'Registration not found in mock database.' });
    }
    return res.json({ payment_proof: record.payment_proof });
  } else {
    try {
      const result = await pool.query('SELECT payment_proof FROM registrations WHERE id = $1;', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Registration not found in database.' });
      }
      return res.json({ payment_proof: result.rows[0].payment_proof });
    } catch (dbErr) {
      console.error('❌ Database query failed:', dbErr);
      return res.status(500).json({ error: 'Failed to retrieve payment proof.' });
    }
  }
});

// POST /api/admin/verify/:id — Mark team as verified and dispatch success email
app.post('/api/admin/verify/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  let record;

  if (isMockDb) {
    record = mockDb.find(r => r.id === parseInt(id));
    if (!record) {
      return res.status(404).json({ error: 'Registration not found in mock database.' });
    }
    record.status = 'verified';
    console.log(`💾 [Mock DB] Team ${record.team_name} (ID: ${id}) verified.`);
  } else {
    try {
      const updateQuery = `
        UPDATE registrations
        SET status = 'verified'
        WHERE id = $1
        RETURNING *;
      `;
      const result = await pool.query(updateQuery, [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Registration not found in PostgreSQL database.' });
      }
      record = result.rows[0];
      console.log(`💾 [Neon DB] Team ${record.team_name} (ID: ${id}) verified.`);
    } catch (dbErr) {
      console.error('❌ Database update failed:', dbErr);
      return res.status(500).json({ error: 'Failed to verify registration in database.' });
    }
  }

  // Map database record properties to match the email service expectations
  const teamDetails = {
    id: record.id,
    teamName: record.team_name || record.teamName,
    college: record.college,
    leaderName: record.leader_name || record.leaderName || record.teamLeader,
    email: record.leader_email || record.leaderEmail || record.email,
    phone: record.leader_phone || record.leaderPhone || record.phone,
    teamSize: record.team_size || record.teamSize,
    members: typeof record.members === 'string' ? JSON.parse(record.members) : record.members
  };

  // Dispatch the verified/success email confirmation asynchronously
  sendVerificationSuccessEmail(teamDetails).catch(err => {
    console.error(`❌ Background verification success email failed for ${teamDetails.email}:`, err);
  });

  return res.json({ success: true, message: `Team '${teamDetails.teamName}' verified successfully.` });
});

// POST /api/admin/reject/:id — Mark team as rejected, with reason, and dispatch rejection email
app.post('/api/admin/reject/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason is required.' });
  }

  let record;

  if (isMockDb) {
    record = mockDb.find(r => r.id === parseInt(id));
    if (!record) {
      return res.status(404).json({ error: 'Registration not found in mock database.' });
    }
    record.status = 'rejected';
    console.log(`💾 [Mock DB] Team ${record.team_name} (ID: ${id}) rejected.`);
  } else {
    try {
      const updateQuery = `
        UPDATE registrations
        SET status = 'rejected'
        WHERE id = $1
        RETURNING *;
      `;
      const result = await pool.query(updateQuery, [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Registration not found in PostgreSQL database.' });
      }
      record = result.rows[0];
      console.log(`💾 [Neon DB] Team ${record.team_name} (ID: ${id}) rejected.`);
    } catch (dbErr) {
      console.error('❌ Database update failed:', dbErr);
      return res.status(500).json({ error: 'Failed to reject registration in database.' });
    }
  }

  // Map database record properties to match the email service expectations
  const teamDetails = {
    id: record.id,
    teamName: record.team_name || record.teamName,
    college: record.college,
    leaderName: record.leader_name || record.leaderName || record.teamLeader,
    email: record.leader_email || record.leaderEmail || record.email,
    phone: record.leader_phone || record.leaderPhone || record.phone,
    teamSize: record.team_size || record.teamSize,
    members: typeof record.members === 'string' ? JSON.parse(record.members) : record.members
  };

  // Dispatch the rejection email confirmation asynchronously
  sendRejectionEmail(teamDetails, reason).catch(err => {
    console.error(`❌ Background rejection email failed for ${teamDetails.email}:`, err);
  });

  return res.json({ success: true, message: `Team '${teamDetails.teamName}' rejected successfully.` });
});

// DELETE /api/admin/registrations/:id — Remove a team registration from database
app.delete('/api/admin/registrations/:id', adminAuth, async (req, res) => {
  const { id } = req.params;

  if (isMockDb) {
    const index = mockDb.findIndex(r => r.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: 'Registration not found in mock database.' });
    }
    const removed = mockDb.splice(index, 1);
    console.log(`💾 [Mock DB] Team ${removed[0].team_name} (ID: ${id}) removed.`);
  } else {
    try {
      const deleteQuery = `
        DELETE FROM registrations
        WHERE id = $1
        RETURNING *;
      `;
      const result = await pool.query(deleteQuery, [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Registration not found in PostgreSQL database.' });
      }
      const record = result.rows[0];
      console.log(`💾 [Neon DB] Team ${record.team_name} (ID: ${id}) removed.`);
    } catch (dbErr) {
      console.error('❌ Database delete failed:', dbErr);
      return res.status(500).json({ error: 'Failed to delete registration in database.' });
    }
  }

  return res.json({ success: true, message: `Team registration removed successfully.` });
});

// POST /api/admin/attendance/:id — Save team roster attendance check-ins
app.post('/api/admin/attendance/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { attendance } = req.body;

  if (isMockDb) {
    const record = mockDb.find(r => r.id === parseInt(id));
    if (!record) {
      return res.status(404).json({ error: 'Registration not found in mock database.' });
    }
    record.attendance = attendance || {};
    
    // Save updated state to local backup JSON file
    try {
      const backupDir = path.join(__dirname, 'private');
      const backupPath = path.join(backupDir, 'backup_registrations.json');
      fs.writeFileSync(backupPath, JSON.stringify(mockDb, null, 2), 'utf8');
    } catch (err) {
      console.error('❌ Failed to update backup_registrations.json:', err);
    }
    
    return res.json({ success: true, attendance: record.attendance });
  } else {
    try {
      const result = await pool.query(
        'UPDATE registrations SET attendance = $1 WHERE id = $2 RETURNING attendance;',
        [JSON.stringify(attendance || {}), id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Registration not found in database.' });
      }
      return res.json({ success: true, attendance: result.rows[0].attendance });
    } catch (dbErr) {
      console.error('❌ Database query failed:', dbErr);
      return res.status(500).json({ error: 'Failed to update team attendance.' });
    }
  }
});


// ─── Accommodation Booking Endpoints ────────────────────────────────────────

// GET /api/accommodation/suggestions — Get search suggestions for teams/emails
app.get('/api/accommodation/suggestions', async (req, res) => {
  const { q } = req.query;
  const queryStr = q ? q.trim().toLowerCase() : '';

  if (isMockDb) {
    let matches = mockDb;
    if (queryStr) {
      matches = mockDb.filter(r => 
        r.team_name.toLowerCase().includes(queryStr) || 
        r.leader_email.toLowerCase().includes(queryStr)
      );
    }
    matches.sort((a, b) => a.team_name.localeCompare(b.team_name));
    return res.json(matches.map(r => ({
      id: r.id,
      team_name: r.team_name,
      leader_email: r.leader_email
    })));
  } else {
    try {
      let dbQuery, params;
      if (queryStr) {
        dbQuery = `
          SELECT id, team_name, leader_email 
          FROM registrations 
          WHERE LOWER(team_name) LIKE $1 OR LOWER(leader_email) LIKE $1 
          ORDER BY team_name ASC;
        `;
        params = [`%${queryStr}%`];
      } else {
        dbQuery = `
          SELECT id, team_name, leader_email 
          FROM registrations 
          ORDER BY team_name ASC;
        `;
        params = [];
      }
      const result = await pool.query(dbQuery, params);
      return res.json(result.rows);
    } catch (err) {
      console.error('❌ Failed to fetch autocomplete suggestions:', err);
      return res.status(500).json({ error: 'Database error fetching suggestions.' });
    }
  }
});

// GET /api/accommodation/team — Lookup a registered team by name or leader email
app.get('/api/accommodation/team', async (req, res) => {
  const { query, teamId } = req.query;
  if (!query || !teamId) {
    return res.status(400).json({ error: 'Search query (team name or leader email) and Team ID are required.' });
  }

  const normalizedQuery = query.trim().toLowerCase();

  let team = null;
  if (isMockDb) {
    team = mockDb.find(r => 
      r.team_name.toLowerCase() === normalizedQuery || 
      r.leader_email.toLowerCase() === normalizedQuery
    );
  } else {
    try {
      const dbQuery = `
        SELECT id, team_name, leader_email, members 
        FROM registrations 
        WHERE LOWER(team_name) = $1 OR LOWER(leader_email) = $1;
      `;
      const result = await pool.query(dbQuery, [normalizedQuery]);
      if (result.rows.length > 0) {
        team = result.rows[0];
      }
    } catch (err) {
      console.error('❌ Failed to lookup team in DB:', err);
      return res.status(500).json({ error: 'Database error searching for team.' });
    }
  }

  if (!team) {
    return res.status(404).json({ error: 'No verified team registration found with that name or email.' });
  }

  // Validate Team ID match (e.g. RH-0018)
  const expectedTeamId = `RH-${String(team.id).padStart(4, '0')}`;
  if (teamId.trim().toUpperCase() !== expectedTeamId) {
    return res.status(400).json({ error: `Invalid Team ID. Please enter the correct ID from your registration pass (e.g. ${expectedTeamId}).` });
  }

  // Check if this team already has an accommodation booking/request
  let existingBooking = null;
  if (isMockDb) {
    existingBooking = mockAccommodation.find(a => a.registration_id === team.id && a.status !== 'rejected');
  } else {
    try {
      const result = await pool.query('SELECT id, status, booked_members FROM accommodation WHERE registration_id = $1 AND status != \'rejected\';', [team.id]);
      if (result.rows.length > 0) {
        existingBooking = result.rows[0];
      }
    } catch (err) {
      console.error('❌ Failed to check existing accommodation booking:', err);
    }
  }

  return res.json({
    id: team.id,
    team_name: team.team_name || team.teamName,
    leader_email: team.leader_email || team.email,
    members: typeof team.members === 'string' ? JSON.parse(team.members) : team.members,
    existingBooking: existingBooking ? { id: existingBooking.id, status: existingBooking.status } : null
  });
});

// GET /api/accommodation/status — Get remaining available slots (Max 46 boys / 46 girls)
app.get('/api/accommodation/status', async (req, res) => {
  let boysCount = 0;
  let girlsCount = 0;

  if (isMockDb) {
    mockAccommodation.forEach(a => {
      if (a.status !== 'rejected') {
        boysCount += (a.boys_count || 0);
        girlsCount += (a.girls_count || 0);
      }
    });
  } else {
    try {
      const result = await pool.query(`
        SELECT SUM(boys_count) as boys, SUM(girls_count) as girls 
        FROM accommodation 
        WHERE status != 'rejected';
      `);
      if (result.rows.length > 0) {
        boysCount = parseInt(result.rows[0].boys || 0);
        girlsCount = parseInt(result.rows[0].girls || 0);
      }
    } catch (err) {
      console.error('❌ Failed to get accommodation sum from DB:', err);
      return res.status(500).json({ error: 'Database error counting slots.' });
    }
  }

  res.json({
    boysBooked: boysCount,
    girlsBooked: girlsCount,
    boysRemaining: Math.max(0, 30 - boysCount),
    girlsRemaining: Math.max(0, 30 - girlsCount)
  });
});

// POST /api/accommodation/book — Submit request for accommodation
app.post('/api/accommodation/book', upload.single('paymentProof'), async (req, res) => {
  const { registrationId, teamName, leaderEmail, bookedMembers: bookedMembersStr } = req.body;

  if (!registrationId || !teamName || !leaderEmail || !bookedMembersStr || !req.file) {
    return res.status(400).json({ error: 'All fields and payment screenshot are required.' });
  }

  let bookedMembers = [];
  try {
    bookedMembers = JSON.parse(bookedMembersStr);
  } catch {
    return res.status(400).json({ error: 'Invalid booked members data format.' });
  }

  if (bookedMembers.length === 0) {
    return res.status(400).json({ error: 'Please select at least one member for accommodation.' });
  }

  let reqBoys = 0;
  let reqGirls = 0;
  bookedMembers.forEach(m => {
    if (m.gender === 'boy') reqBoys++;
    else if (m.gender === 'girl') reqGirls++;
  });

  // Check remaining slots
  let boysCount = 0;
  let girlsCount = 0;
  if (isMockDb) {
    mockAccommodation.forEach(a => {
      if (a.status !== 'rejected') {
        boysCount += (a.boys_count || 0);
        girlsCount += (a.girls_count || 0);
      }
    });
  } else {
    try {
      const result = await pool.query(`
        SELECT SUM(boys_count) as boys, SUM(girls_count) as girls 
        FROM accommodation 
        WHERE status != 'rejected';
      `);
      if (result.rows.length > 0) {
        boysCount = parseInt(result.rows[0].boys || 0);
        girlsCount = parseInt(result.rows[0].girls || 0);
      }
    } catch (err) {
      console.error('❌ Failed to calculate slots:', err);
      return res.status(500).json({ error: 'Database error validating slots.' });
    }
  }

  if (boysCount + reqBoys > 30) {
    return res.status(400).json({ error: `Not enough boys accommodation slots remaining. (Only ${Math.max(0, 30 - boysCount)} slots left)` });
  }
  if (girlsCount + reqGirls > 30) {
    return res.status(400).json({ error: `Not enough girls accommodation slots remaining. (Only ${Math.max(0, 30 - girlsCount)} slots left)` });
  }

  const paymentProofBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

  const regIdInt = parseInt(registrationId);

  if (isMockDb) {
    let nextId = 1;
    const existingIds = new Set(mockAccommodation.map(a => a.id));
    while (existingIds.has(nextId)) {
      nextId++;
    }
    const newBooking = {
      id: nextId,
      registration_id: regIdInt,
      team_name: teamName,
      leader_email: leaderEmail,
      boys_count: reqBoys,
      girls_count: reqGirls,
      booked_members: bookedMembers,
      payment_proof: paymentProofBase64,
      status: 'pending',
      created_at: new Date()
    };
    mockAccommodation.push(newBooking);
    saveAccommodationToBackupFile(newBooking);
    console.log(`💾 [Mock DB] Saved accommodation for team: ${teamName}`);

    // Send accommodation confirmation email in background
    sendAccommodationConfirmationEmail({
      registrationId: regIdInt,
      teamName,
      email: leaderEmail,
      boysCount: reqBoys,
      girlsCount: reqGirls,
      bookedMembers
    }).catch(err => console.error('Background accommodation confirmation email failed:', err));

    return res.status(201).json({ success: true, id: nextId, mode: 'memory' });
  } else {
    try {
      const insertQuery = `
        INSERT INTO accommodation (registration_id, team_name, leader_email, boys_count, girls_count, booked_members, payment_proof)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
      `;
      const values = [regIdInt, teamName, leaderEmail, reqBoys, reqGirls, JSON.stringify(bookedMembers), paymentProofBase64];
      const result = await pool.query(insertQuery, values);
      const insertedId = result.rows[0].id;
      console.log(`💾 [Neon DB] Saved accommodation for team: ${teamName} (ID: ${insertedId})`);

      saveAccommodationToBackupFile({
        id: insertedId,
        registration_id: regIdInt,
        team_name: teamName,
        leader_email: leaderEmail,
        boys_count: reqBoys,
        girls_count: reqGirls,
        booked_members: bookedMembers,
        created_at: new Date()
      });

      // Send accommodation confirmation email in background
      sendAccommodationConfirmationEmail({
        registrationId: regIdInt,
        teamName,
        email: leaderEmail,
        boysCount: reqBoys,
        girlsCount: reqGirls,
        bookedMembers
      }).catch(err => console.error('Background accommodation confirmation email failed:', err));

      return res.status(201).json({ success: true, id: insertedId, mode: 'neon' });
    } catch (err) {
      console.error('❌ Failed to insert accommodation booking:', err);
      return res.status(500).json({ error: 'Failed to save accommodation booking.' });
    }
  }
});

// GET /api/admin/download-attendance-pdf — Admin download/preview registration attendance sheets
app.get('/api/admin/download-attendance-pdf', adminAuth, async (req, res) => {
  let teams = [];
  try {
    if (isMockDb) {
      teams = mockDb.map(r => ({
        id: r.id,
        team_name: r.team_name || r.teamName,
        college: r.college,
        leader_name: r.leader_name || r.leaderName || r.teamLeader,
        leader_email: r.leader_email || r.email,
        leader_phone: r.leader_phone || r.phone || 'N/A',
        team_size: r.team_size || r.teamSize,
        members: r.members,
        status: r.status || 'pending',
        table_no: r.table_no || 'N/A'
      }));
    } else {
      const dbRes = await pool.query(`
        SELECT id, team_name, college, leader_name, leader_email, leader_phone, team_size, members, status, table_no, created_at
        FROM registrations
        ORDER BY id ASC;
      `);
      teams = dbRes.rows;
    }

    const token = req.query.token || '';

    let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RUSH HOUR 24 — Official Session Attendance Sheets</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #4f46e5;
      --primary-subtle: #e0e7ff;
      --text-dark: #0f172a;
      --text-muted: #475569;
      --border-color: #cbd5e1;
      --bg-header: #f8fafc;
    }
    body {
      font-family: 'Inter', sans-serif;
      color: var(--text-dark);
      margin: 10px;
      line-height: 1.1;
      background-color: #ffffff;
    }
    .team-card {
      border: 1px solid var(--border-color);
      border-radius: 4px;
      margin-bottom: 3px;
      background: white;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .card-header {
      background-color: #1e1b4b;
      color: white;
      padding: 4px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'Outfit', sans-serif;
      font-size: 10px;
      line-height: 1.3;
    }
    .card-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-team-id {
      background-color: var(--primary-subtle);
      color: var(--primary);
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 9px;
    }
    .card-team-name {
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .card-college {
      font-size: 8.5px;
      color: #cbd5e1;
      font-weight: 400;
    }
    .card-table-no {
      background-color: #f59e0b;
      color: #1e1b4b;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 9px;
    }
    .attendance-table {
      width: 100%;
      border-collapse: collapse;
    }
    .attendance-table th {
      background-color: #f8fafc;
      color: var(--text-muted);
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 5px;
      border: 1px solid var(--border-color);
      text-align: center;
      line-height: 1.2;
    }
    .attendance-table td {
      border: 1px solid var(--border-color);
      padding: 2px 4px;
      font-size: 9px;
      text-align: center;
      height: 24px;
      vertical-align: middle;
      line-height: 1.2;
    }
    .session-label {
      font-weight: 700;
      font-size: 9px;
      color: var(--text-dark);
      background-color: #f1f5f9;
      width: 70px;
    }
    .sig-line {
      width: 85%;
      height: 14px;
      border-bottom: 1px dashed #94a3b8;
      margin: 0 auto;
    }
    .print-page {
      page-break-after: always;
    }
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .team-card {
        border-color: #cbd5e1 !important;
        margin-bottom: 2.5px;
      }
      .card-header {
        background-color: #1e1b4b !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .card-team-id {
        background-color: var(--primary-subtle) !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .card-table-no {
        background-color: #f59e0b !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <!-- Control Bar (hidden during printing) -->
  <div class="no-print" style="background: #1e1b4b; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px; margin-bottom: 20px; font-family: 'Inter', sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px;">
      <span>📋 Attendance Sheets Preview</span>
      <span style="background: rgba(255,255,255,0.2); font-size: 10px; padding: 2px 6px; border-radius: 12px; font-weight: 500;">Total Teams: ${teams.length}</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px; font-family: 'Inter', sans-serif;">🖨️ Print Sheets</button>
      <a href="/api/admin/download-attendance-pdf?token=${encodeURIComponent(token)}&download=true" style="background: #10b981; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 12px; font-family: 'Inter', sans-serif;">📥 Download PDF</a>
    </div>
  </div>
`;

    const teamsPerPage = 5;
    for (let i = 0; i < teams.length; i += teamsPerPage) {
      const pageTeams = teams.slice(i, i + teamsPerPage);
      htmlContent += `<div class="print-page">`;

      pageTeams.forEach(t => {
        let membersList = [];
        try {
          membersList = typeof t.members === 'string' ? JSON.parse(t.members) : t.members || [];
        } catch (e) {
          membersList = t.members || [];
        }

        const ths = membersList.map((m, idx) => `
          <th>
            <div style="font-weight:700; color:var(--text-dark);">${m.name}</div>
            <div style="font-size:7px; color:var(--text-muted); font-weight:500;">Member ${idx + 1} (${m.year || 'N/A'})</div>
          </th>
        `).join('');

        const tdsSession1 = membersList.map(() => `<td><div class="sig-line"></div></td>`).join('');
        const tdsSession2 = membersList.map(() => `<td><div class="sig-line"></div></td>`).join('');
        const tdsSession3 = membersList.map(() => `<td><div class="sig-line"></div></td>`).join('');

        htmlContent += `
        <div class="team-card">
          <div class="card-header">
            <div class="card-header-left">
              <span class="card-team-id">#${t.id}</span>
              <span class="card-team-name">${t.team_name}</span>
              <span style="color:#64748b;">|</span>
              <span class="card-college">${t.college}</span>
            </div>
            <div>
              <span class="card-table-no">TABLE T-${t.table_no || 'N/A'}</span>
            </div>
          </div>
          <table class="attendance-table">
            <thead>
              <tr>
                <th style="width: 100px;">Session</th>
                ${ths || '<th style="color:var(--text-muted);">No members uploaded</th>'}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="session-label">Session 1</td>
                ${tdsSession1}
              </tr>
              <tr>
                <td class="session-label">Session 2</td>
                ${tdsSession2}
              </tr>
              <tr>
                <td class="session-label">Session 3</td>
                ${tdsSession3}
              </tr>
            </tbody>
          </table>
        </div>
        `;
      });

      htmlContent += `</div>`;
    }

    htmlContent += `
</body>
</html>
`;

    const htmlPath = path.resolve(__dirname, 'registration_attendance_sheets.html');
    const pdfPath = path.resolve(__dirname, 'teams_attendance.pdf');

    fs.writeFileSync(htmlPath, htmlContent, 'utf8');

    if (req.query.download === 'true') {
      const { execFile } = require('child_process');
      const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
      const args = [
        '--headless',
        '--disable-gpu',
        `--print-to-pdf=${pdfPath}`,
        '--no-pdf-header-footer',
        htmlPath
      ];

      execFile(edgePath, args, (err) => {
        if (err) {
          console.error("❌ Headless Edge print failed:", err);
          return res.status(500).json({ error: 'Failed to compile PDF.' });
        }
        res.download(pdfPath, 'teams_attendance.pdf');
      });
    } else {
      res.setHeader('Content-Type', 'text/html');
      return res.send(htmlContent);
    }
  } catch (err) {
    console.error("❌ PDF download handler error:", err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/admin/download-checkin-pdf — Admin download/preview registration checkin sheets
app.get('/api/admin/download-checkin-pdf', adminAuth, async (req, res) => {
  let teams = [];
  try {
    if (isMockDb) {
      teams = mockDb.map(r => ({
        id: r.id,
        team_name: r.team_name || r.teamName,
        college: r.college,
        leader_name: r.leader_name || r.leaderName || r.teamLeader,
        leader_email: r.leader_email || r.email,
        leader_phone: r.leader_phone || r.phone || 'N/A',
        team_size: r.team_size || r.teamSize,
        members: r.members,
        status: r.status || 'pending',
        table_no: r.table_no || 'N/A'
      }));
    } else {
      const dbRes = await pool.query(`
        SELECT id, team_name, college, leader_name, leader_email, leader_phone, team_size, members, status, table_no, created_at
        FROM registrations
        ORDER BY id ASC;
      `);
      teams = dbRes.rows;
    }

    const token = req.query.token || '';

    let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RUSH HOUR 24 — Official Registration Check-in Sheets</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #4f46e5;
      --primary-subtle: #e0e7ff;
      --text-dark: #0f172a;
      --text-muted: #475569;
      --border-color: #cbd5e1;
      --bg-header: #f8fafc;
    }
    body {
      font-family: 'Inter', sans-serif;
      color: var(--text-dark);
      margin: 20px;
      line-height: 1.2;
      background-color: #ffffff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    tr {
      page-break-inside: avoid;
    }
    th {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg-header);
      color: var(--text-muted);
      border: 1px solid var(--border-color);
      padding: 6px 8px;
      font-size: 8.5px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-align: left;
    }
    td {
      border: 1px solid var(--border-color);
      padding: 6px 8px;
      font-size: 9.5px;
      vertical-align: middle;
    }
    .team-id-badge {
      display: inline-block;
      background-color: var(--primary-subtle);
      color: var(--primary);
      font-weight: 800;
      font-size: 9px;
      padding: 2px 5px;
      border-radius: 4px;
      font-family: 'Outfit', sans-serif;
    }
    .table-no-text {
      font-size: 8.5px;
      font-weight: 800;
      color: #b45309;
      margin-top: 3px;
      text-transform: uppercase;
    }
    .team-name {
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      color: var(--text-dark);
      margin-top: 4px;
    }
    .college {
      font-size: 7.5px;
      color: var(--text-muted);
      margin-top: 1px;
      font-weight: 500;
      text-transform: capitalize;
    }
    .leader-info-block {
      line-height: 1.3;
    }
    .leader-name {
      font-weight: 700;
      color: var(--text-dark);
    }
    .phone-text {
      font-weight: 700;
      color: var(--primary);
      font-size: 10px;
    }
    
    .roster-signature-container {
      display: flex;
      flex-direction: column;
      gap: 5px;
      max-width: 320px;
    }
    .roster-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 18px;
    }
    .member-name-text {
      font-weight: 600;
      color: var(--text-dark);
      font-size: 9.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 180px;
    }
    .signature-underline {
      border-bottom: 1px dashed var(--border-color);
      width: 120px;
      height: 14px;
    }

    @media print {
      body {
        margin: 10px;
      }
      .no-print {
        display: none !important;
      }
      th {
        background-color: var(--bg-header) !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .team-id-badge {
        background-color: var(--primary-subtle) !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <!-- Control Bar (hidden during printing) -->
  <div class="no-print" style="background: #1e1b4b; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px; margin-bottom: 20px; font-family: 'Inter', sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px;">
      <span>📋 Check-in Sheets Preview</span>
      <span style="background: rgba(255,255,255,0.2); font-size: 10px; padding: 2px 6px; border-radius: 12px; font-weight: 500;">Total Teams: ${teams.length}</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px; font-family: 'Inter', sans-serif;">🖨️ Print Sheets</button>
      <a href="/api/admin/download-checkin-pdf?token=${encodeURIComponent(token)}&download=true" style="background: #10b981; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 12px; font-family: 'Inter', sans-serif;">📥 Download PDF</a>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 55px; text-align: center;">ID / Table</th>
        <th style="width: 170px;">Team / College</th>
        <th style="width: 160px;">Leader Details</th>
        <th>Roster Members & Signatures</th>
      </tr>
    </thead>
    <tbody>
`;

    teams.forEach(t => {
      let membersList = [];
      try {
        membersList = typeof t.members === 'string' ? JSON.parse(t.members) : t.members || [];
      } catch (e) {
        membersList = t.members || [];
      }

      const rosterHtml = membersList.map((m, idx) => `
        <div class="roster-row">
          <div class="member-name-text">
            ${idx + 1}. ${m.name} <span style="font-size:7.5px; color:var(--text-muted); font-weight:400;">(${m.year || 'N/A'})</span>
          </div>
          <div class="signature-underline"></div>
        </div>
      `).join('');

      htmlContent += `
      <tr>
        <td style="text-align: center; vertical-align: middle;">
          <span class="team-id-badge">#${t.id}</span>
          <div class="table-no-text">T-${t.table_no || 'N/A'}</div>
        </td>
        <td>
          <div class="team-name">${t.team_name}</div>
          <div class="college">${t.college}</div>
        </td>
        <td>
          <div class="leader-info-block">
            <strong>Ldr:</strong> <span class="leader-name">${t.leader_name}</span> (${t.team_size})<br>
            <strong>Ph:</strong> <span class="phone-text">${t.leader_phone}</span>
          </div>
        </td>
        <td>
          <div class="roster-signature-container">
            ${rosterHtml || '<div style="color:var(--text-muted)">No roster uploaded</div>'}
          </div>
        </td>
      </tr>
      `;
    });

    htmlContent += `
    </tbody>
  </table>

</body>
</html>
`;

    const htmlPath = path.resolve(__dirname, 'registration_checkin_sheets.html');
    const pdfPath = path.resolve(__dirname, 'teams_roster.pdf');

    fs.writeFileSync(htmlPath, htmlContent, 'utf8');

    // If download flag is true, compile and send PDF; otherwise return HTML preview
    if (req.query.download === 'true') {
      const { execFile } = require('child_process');
      const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
      const args = [
        '--headless',
        '--disable-gpu',
        `--print-to-pdf=${pdfPath}`,
        '--no-pdf-header-footer',
        htmlPath
      ];

      execFile(edgePath, args, (err) => {
        if (err) {
          console.error("❌ Headless Edge print failed:", err);
          return res.status(500).json({ error: 'Failed to compile PDF.' });
        }
        res.download(pdfPath, 'teams_roster.pdf');
      });
    } else {
      res.setHeader('Content-Type', 'text/html');
      return res.send(htmlContent);
    }
  } catch (err) {
    console.error("❌ PDF download handler error:", err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/admin/accommodations — Admin retrieve all accommodation requests (excl proof screenshot)
app.get('/api/admin/accommodations', adminAuth, async (req, res) => {
  if (isMockDb) {
    const listData = mockAccommodation.map(a => {
      const copy = { ...a };
      delete copy.payment_proof;
      const reg = mockDb.find(r => r.id === a.registration_id || (r.leader_email && r.leader_email.toLowerCase() === a.leader_email.toLowerCase()));
      copy.leader_phone = reg ? (reg.leader_phone || reg.phone || 'N/A') : 'N/A';
      return copy;
    });
    return res.json(listData.sort((a, b) => a.id - b.id));
  } else {
    try {
      const result = await pool.query(`
        SELECT a.id, a.registration_id, a.team_name, a.leader_email, a.boys_count, a.girls_count, a.booked_members, a.status, a.created_at, r.leader_phone
        FROM accommodation a
        LEFT JOIN registrations r ON a.registration_id = r.id
        ORDER BY a.id ASC;
      `);
      return res.json(result.rows);
    } catch (err) {
      console.error('❌ Failed to retrieve accommodations:', err);
      return res.status(500).json({ error: 'Failed to retrieve accommodations.' });
    }
  }
});

// GET /api/admin/download-accommodation-checkin-pdf — Admin download/preview accommodation checkin sheets
app.get('/api/admin/download-accommodation-checkin-pdf', adminAuth, async (req, res) => {
  let accommodations = [];
  try {
    if (isMockDb) {
      accommodations = mockAccommodation.map(a => {
        const copy = { ...a };
        const reg = mockDb.find(r => r.id === a.registration_id || (r.leader_email && r.leader_email.toLowerCase() === a.leader_email.toLowerCase()));
        copy.leader_phone = reg ? (reg.leader_phone || reg.phone || 'N/A') : 'N/A';
        return copy;
      });
    } else {
      const dbRes = await pool.query(`
        SELECT a.id, a.registration_id, a.team_name, a.leader_email, a.boys_count, a.girls_count, a.booked_members, a.status, r.leader_phone
        FROM accommodation a
        LEFT JOIN registrations r ON a.registration_id = r.id
        ORDER BY a.id ASC;
      `);
      accommodations = dbRes.rows;
    }

    const token = req.query.token || '';

    let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RUSH HOUR 24 — Accommodation Check-in Sheets</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #8b5cf6;
      --primary-subtle: #f5f3ff;
      --text-dark: #0f172a;
      --text-muted: #475569;
      --border-color: #cbd5e1;
      --bg-header: #f8fafc;
    }
    body {
      font-family: 'Inter', sans-serif;
      color: var(--text-dark);
      margin: 20px;
      line-height: 1.2;
      background-color: #ffffff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    tr {
      page-break-inside: avoid;
    }
    th {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg-header);
      color: var(--text-muted);
      border: 1px solid var(--border-color);
      padding: 6px 8px;
      font-size: 8.5px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-align: left;
    }
    td {
      border: 1px solid var(--border-color);
      padding: 6px 8px;
      font-size: 9.5px;
      vertical-align: middle;
    }
    .team-id-badge {
      display: inline-block;
      background-color: var(--primary-subtle);
      color: var(--primary);
      font-weight: 800;
      font-size: 9px;
      padding: 2px 5px;
      border-radius: 4px;
      font-family: 'Outfit', sans-serif;
    }
    .count-badge {
      font-size: 8.5px;
      font-weight: 800;
      color: #b45309;
      margin-top: 3px;
      text-transform: uppercase;
    }
    .team-name {
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      color: var(--text-dark);
      margin-top: 4px;
    }
    .leader-info-block {
      line-height: 1.3;
    }
    .leader-name {
      font-weight: 700;
      color: var(--text-dark);
    }
    .phone-text {
      font-weight: 700;
      color: var(--primary);
      font-size: 10px;
    }
    .roster-signature-container {
      display: flex;
      flex-direction: column;
      gap: 5px;
      max-width: 320px;
    }
    .roster-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 18px;
    }
    .member-name-text {
      font-weight: 600;
      color: var(--text-dark);
      font-size: 9.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 180px;
    }
    .signature-underline {
      border-bottom: 1px dashed var(--border-color);
      width: 120px;
      height: 14px;
    }
    @media print {
      body {
        margin: 10px;
      }
      .no-print {
        display: none !important;
      }
      th {
        background-color: var(--bg-header) !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .team-id-badge {
        background-color: var(--primary-subtle) !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <div class="no-print" style="background: #6d28d9; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px; margin-bottom: 20px; font-family: 'Inter', sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px;">
      <span>🏢 Accommodation Check-in Sheets Preview</span>
      <span style="background: rgba(255,255,255,0.2); font-size: 10px; padding: 2px 6px; border-radius: 12px; font-weight: 500;">Total Bookings: ${accommodations.length}</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button onclick="window.print()" style="background: #8b5cf6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px; font-family: 'Inter', sans-serif;">🖨️ Print Sheets</button>
      <a href="/api/admin/download-accommodation-checkin-pdf?token=${encodeURIComponent(token)}&download=true" style="background: #10b981; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 12px; font-family: 'Inter', sans-serif;">📥 Download PDF</a>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 70px; text-align: center;">ID / Capacity</th>
        <th style="width: 170px;">Team Name</th>
        <th style="width: 160px;">Contact & Status</th>
        <th>Roster Stay Members & Signatures</th>
      </tr>
    </thead>
    <tbody>
`;

    accommodations.forEach(a => {
      let membersList = [];
      try {
        membersList = typeof a.booked_members === 'string' ? JSON.parse(a.booked_members) : a.booked_members || [];
      } catch (e) {
        membersList = a.booked_members || [];
      }

      const rosterHtml = membersList.map((m, idx) => `
        <div class="roster-row">
          <div class="member-name-text">
            ${idx + 1}. ${m.name} <span style="font-size:7.5px; color:var(--text-muted); font-weight:400;">(${m.gender === 'boy' ? 'Boy ♂' : 'Girl ♀'})</span>
          </div>
          <div class="signature-underline"></div>
        </div>
      `).join('');

      htmlContent += `
      <tr>
        <td style="text-align: center; vertical-align: middle;">
          <span class="team-id-badge">#${a.id}</span>
          <div class="count-badge">B:${a.boys_count || 0} | G:${a.girls_count || 0}</div>
        </td>
        <td>
          <div class="team-name">${a.team_name}</div>
          <div style="font-size:7.5px; color:var(--text-muted); margin-top:2px;">Reg ID: #${a.registration_id}</div>
        </td>
        <td>
          <div class="leader-info-block">
            <strong>Email:</strong> <span>${a.leader_email}</span><br>
            <strong>Phone:</strong> <span class="phone-text">${a.leader_phone}</span><br>
            <strong>Status:</strong> <span style="font-weight:700; color: ${a.status === 'verified' ? '#10b981' : '#f59e0b'};">${(a.status || 'pending').toUpperCase()}</span>
          </div>
        </td>
        <td>
          <div class="roster-signature-container">
            ${rosterHtml || '<div style="color:var(--text-muted)">No stay members uploaded</div>'}
          </div>
        </td>
      </tr>
      `;
    });

    htmlContent += `
    </tbody>
  </table>

</body>
</html>
`;

    const htmlPath = path.resolve(__dirname, 'accommodation_checkin_sheets.html');
    const pdfPath = path.resolve(__dirname, 'accommodations_checkin.pdf');

    fs.writeFileSync(htmlPath, htmlContent, 'utf8');

    if (req.query.download === 'true') {
      const { execFile } = require('child_process');
      const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
      const args = [
        '--headless',
        '--disable-gpu',
        `--print-to-pdf=${pdfPath}`,
        '--no-pdf-header-footer',
        htmlPath
      ];

      execFile(edgePath, args, (err) => {
        if (err) {
          console.error("❌ Headless Edge print failed:", err);
          return res.status(500).json({ error: 'Failed to compile PDF.' });
        }
        res.download(pdfPath, 'accommodations_checkin.pdf');
      });
    } else {
      res.setHeader('Content-Type', 'text/html');
      return res.send(htmlContent);
    }
  } catch (err) {
    console.error("❌ PDF download handler error:", err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/admin/accommodation-proof/:id — Retrieve screenshot
app.get('/api/admin/accommodation-proof/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  if (isMockDb) {
    const record = mockAccommodation.find(a => a.id === parseInt(id));
    if (!record) {
      return res.status(404).json({ error: 'Record not found.' });
    }
    return res.json({ payment_proof: record.payment_proof });
  } else {
    try {
      const result = await pool.query('SELECT payment_proof FROM accommodation WHERE id = $1;', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Record not found.' });
      }
      return res.json({ payment_proof: result.rows[0].payment_proof });
    } catch (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ error: 'Failed to retrieve payment proof.' });
    }
  }
});

// POST /api/admin/accommodation/verify/:id — Verify accommodation
app.post('/api/admin/accommodation/verify/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  if (isMockDb) {
    const record = mockAccommodation.find(a => a.id === parseInt(id));
    if (!record) {
      return res.status(404).json({ error: 'Record not found.' });
    }
    record.status = 'verified';

    sendAccommodationVerificationEmail({
      registrationId: record.registration_id,
      teamName: record.team_name,
      email: record.leader_email,
      boysCount: record.boys_count,
      girlsCount: record.girls_count,
      bookedMembers: typeof record.booked_members === 'string' ? JSON.parse(record.booked_members) : record.booked_members
    }).catch(err => console.error('Background accommodation verification email failed:', err));

    return res.json({ success: true });
  } else {
    try {
      const result = await pool.query('UPDATE accommodation SET status = \'verified\' WHERE id = $1 RETURNING *;', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Record not found.' });
      }
      const record = result.rows[0];

      sendAccommodationVerificationEmail({
        registrationId: record.registration_id,
        teamName: record.team_name,
        email: record.leader_email,
        boysCount: record.boys_count,
        girlsCount: record.girls_count,
        bookedMembers: typeof record.booked_members === 'string' ? JSON.parse(record.booked_members) : record.booked_members
      }).catch(err => console.error('Background accommodation verification email failed:', err));

      return res.json({ success: true });
    } catch (err) {
      console.error('❌ DB update error:', err);
      return res.status(500).json({ error: 'Failed to update record.' });
    }
  }
});

// POST /api/admin/accommodation/reject/:id — Reject accommodation
app.post('/api/admin/accommodation/reject/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  if (isMockDb) {
    const record = mockAccommodation.find(a => a.id === parseInt(id));
    if (!record) {
      return res.status(404).json({ error: 'Record not found.' });
    }
    record.status = 'rejected';
    return res.json({ success: true });
  } else {
    try {
      const result = await pool.query('UPDATE accommodation SET status = \'rejected\' WHERE id = $1 RETURNING *;', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Record not found.' });
      }
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ DB update error:', err);
      return res.status(500).json({ error: 'Failed to update record.' });
    }
  }
});

// DELETE /api/admin/accommodation/:id — Remove accommodation request
app.delete('/api/admin/accommodation/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  if (isMockDb) {
    const index = mockAccommodation.findIndex(a => a.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: 'Record not found.' });
    }
    mockAccommodation.splice(index, 1);
    return res.json({ success: true });
  } else {
    try {
      const result = await pool.query('DELETE FROM accommodation WHERE id = $1 RETURNING *;', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Record not found.' });
      }
      return res.json({ success: true });
    } catch (err) {
      console.error('❌ DB delete error:', err);
      return res.status(500).json({ error: 'Failed to delete record.' });
    }
  }
});


// ─── Secret Admin Panel Route ─────────────────────────────────────────────
const ADMIN_SECRET_PATH = process.env.ADMIN_SECRET_PATH || '/rh24-panel-x9q7m';
app.get(ADMIN_SECRET_PATH, (req, res) => {
  const adminFilePath = path.join(__dirname, 'private', 'admin.html');
  if (fs.existsSync(adminFilePath)) {
    res.sendFile(adminFilePath);
  } else {
    res.status(404).send('Admin panel not found.');
  }
});

// ─── Secret Super Admin Panel Route ───────────────────────────────────────
const SUPERADMIN_SECRET_PATH = process.env.SUPERADMIN_SECRET_PATH || '/rh24-super-panel-x9q7m';
app.get(SUPERADMIN_SECRET_PATH, (req, res) => {
  const superadminFilePath = path.join(__dirname, 'private', 'superadmin.html');
  if (fs.existsSync(superadminFilePath)) {
    res.sendFile(superadminFilePath);
  } else {
    res.status(404).send('Super admin panel not found.');
  }
});

console.log(`🔐 Admin panel is available at: http://localhost:${PORT}${ADMIN_SECRET_PATH}`);
console.log(`🔐 Super Admin panel is available at: http://localhost:${PORT}${SUPERADMIN_SECRET_PATH}`);

// ─── Export app for Vercel serverless ──────────────────────────────────────
module.exports = app;

// Only listen when run directly (local node execution)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`⚡ Server running on http://localhost:${PORT}`);
  });
}
