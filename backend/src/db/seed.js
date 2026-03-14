const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./schema');

const SEED_USERS = [
  { email: 'admin@company.com',  password: 'admin123',  name: 'Admin User',   role: 'admin',    department: 'Security',    risk_score: 0  },
  { email: 'raj@company.com',    password: 'pass123',   name: 'Raj Sharma',   role: 'employee', department: 'Engineering', risk_score: 72 },
  { email: 'priya@company.com',  password: 'pass123',   name: 'Priya Kapoor', role: 'employee', department: 'Engineering', risk_score: 30 },
  { email: 'amit@company.com',   password: 'pass123',   name: 'Amit Tiwari',  role: 'employee', department: 'Finance',     risk_score: 55 },
];

const SEED_POLICIES = [
  { id: uuidv4(), name: 'API key detection',       type: 'builtin', pattern: 'sk-[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16}|ghp_[a-zA-Z0-9]{36}', threshold: 'block', enabled: 1 },
  { id: uuidv4(), name: 'PII detection',           type: 'builtin', pattern: 'email|phone|aadhaar|ssn',                                    threshold: 'warn',  enabled: 1 },
  { id: uuidv4(), name: 'Source code detection',   type: 'builtin', pattern: 'function|class|def |import |const |let |var ',               threshold: 'warn',  enabled: 1 },
  { id: uuidv4(), name: 'Prompt injection guard',  type: 'builtin', pattern: 'ignore previous|disregard|system prompt|you are now',        threshold: 'block', enabled: 1 },
  { id: uuidv4(), name: 'Credential patterns',     type: 'builtin', pattern: 'password=|passwd=|secret=|token=',                          threshold: 'block', enabled: 1 },
];

const PLATFORMS   = ['chatgpt', 'claude', 'gemini', 'copilot', 'mistral'];
const RISK_LEVELS = ['critical', 'high', 'medium', 'low'];
const ACTIONS     = ['blocked', 'warned', 'allowed', 'sanitized'];
const THREATS     = [
  ['api_key', 'credentials'],
  ['pii', 'source_code'],
  ['prompt_injection'],
  ['cross_session_bleed'],
  ['hallucinated_credentials'],
  ['source_code'],
  ['pii'],
];

function seedIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount > 0) return; // Already seeded

  console.log('🌱 Seeding demo data...');

  // Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password, name, role, department, risk_score)
    VALUES (@id, @email, @password, @name, @role, @department, @risk_score)
  `);

  const userIds = [];
  for (const u of SEED_USERS) {
    const id = uuidv4();
    userIds.push({ id, department: u.department });
    insertUser.run({ ...u, id, password: bcrypt.hashSync(u.password, 10) });
  }

  // Policies
  const insertPolicy = db.prepare(`
    INSERT INTO policies (id, name, type, pattern, threshold, enabled)
    VALUES (@id, @name, @type, @pattern, @threshold, @enabled)
  `);
  for (const p of SEED_POLICIES) insertPolicy.run(p);

  // 15 sample incidents spread over last 24 hours
  const insertIncident = db.prepare(`
    INSERT INTO incidents
      (id, timestamp, user_id, department, ai_platform, risk_level, action, threat_types, prompt_preview, sanitized, device_id)
    VALUES
      (@id, @timestamp, @user_id, @department, @ai_platform, @risk_level, @action, @threat_types, @prompt_preview, @sanitized, @device_id)
  `);

  const now = Date.now();
  for (let i = 0; i < 15; i++) {
    const user     = userIds[Math.floor(Math.random() * userIds.length)];
    const risk     = RISK_LEVELS[Math.floor(Math.random() * RISK_LEVELS.length)];
    const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
    const action   = risk === 'critical' ? 'blocked' : ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const threats  = THREATS[Math.floor(Math.random() * THREATS.length)];
    const hoursAgo = Math.floor(Math.random() * 23);

    insertIncident.run({
      id:             uuidv4(),
      timestamp:      new Date(now - hoursAgo * 3600 * 1000).toISOString(),
      user_id:        user.id,
      department:     user.department,
      ai_platform:    platform,
      risk_level:     risk,
      action,
      threat_types:   JSON.stringify(threats),
      prompt_preview: `[Sample prompt — ${threats.join(', ')} detected]`,
      sanitized:      action === 'sanitized' ? 1 : 0,
      device_id:      `device_${Math.floor(Math.random() * 5) + 1}`,
    });
  }

  console.log('✅ Seed complete — admin@company.com / admin123');
}

module.exports = { seedIfEmpty };
