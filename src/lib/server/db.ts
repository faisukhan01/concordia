import { createClient } from '@libsql/client';

// ─────────────────────────────────────────────────────────────
// Database client — Turso (production) + local SQLite (dev fallback)
//
// PRODUCTION (Vercel): uses Turso exclusively. TURSO_DATABASE_URL +
//   TURSO_AUTH_TOKEN are configured in the Vercel project env vars.
//   Turso is the single source of truth — all data persists there.
//
// LOCAL DEV: if TURSO_AUTH_TOKEN is set in .env, uses Turso too.
//   If the token is missing (e.g. fresh checkout), falls back to a
//   local SQLite file so the dev server still runs. This fallback is
//   DEV-ONLY — production never hits it because Vercel always has
//   the Turso credentials.
//
// Required env vars for Turso:
//   TURSO_DATABASE_URL  e.g. libsql://<db>.turso.io
//   TURSO_AUTH_TOKEN    the Turso auth token
// ─────────────────────────────────────────────────────────────
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || '';
const LOCAL_DB = process.env.DATABASE_URL;

// Turso is used when BOTH the URL and a non-empty token are present.
const useTurso = !!(TURSO_URL && TURSO_TOKEN);
const dbUrl = useTurso ? TURSO_URL! : (LOCAL_DB || 'file:./db/custom.db');
const dbToken = useTurso ? TURSO_TOKEN : '';

if (useTurso) {
  // Production / authenticated dev — Turso
} else if (LOCAL_DB) {
  console.info('[db] TURSO_AUTH_TOKEN not set — using local SQLite at', LOCAL_DB, '(dev only. Production uses Turso.)');
} else {
  console.warn('[db] TURSO_AUTH_TOKEN not set — using local SQLite at file:./db/custom.db (dev only. Production uses Turso.)');
}

export const db = createClient({
  url: dbUrl,
  authToken: dbToken,
});

// Initialize schema on first call
let schemaInitialized = false;

export async function initDB() {
  // Schema creation is cached after the first call (CREATE TABLE IF NOT EXISTS is
  // idempotent but we skip the round-trips for perf on warm lambdas).
  if (!schemaInitialized) {
    schemaInitialized = true;

  const statements = [
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, rollNo TEXT, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student', status TEXT NOT NULL DEFAULT 'Active', title TEXT DEFAULT '', mustChangePassword INTEGER NOT NULL DEFAULT 0, blocked INTEGER NOT NULL DEFAULT 0, blockedReason TEXT, instituteId TEXT, branchId TEXT, class TEXT, section TEXT DEFAULT 'A', guardian TEXT, ward TEXT, wardId TEXT, subjects TEXT, classes TEXT, createdById TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS institutes (id TEXT PRIMARY KEY, name TEXT NOT NULL, short TEXT, city TEXT DEFAULT '', country TEXT DEFAULT 'USA', plan TEXT DEFAULT 'Starter', status TEXT DEFAULT 'Trial', adminName TEXT, adminEmail TEXT, branches INTEGER DEFAULT 0, students INTEGER DEFAULT 0, staff INTEGER DEFAULT 0, revenue REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')), color TEXT DEFAULT 'emerald', domain TEXT DEFAULT 'edu', blocked INTEGER NOT NULL DEFAULT 0, blockedReason TEXT)`,
    `CREATE TABLE IF NOT EXISTS branches (id TEXT PRIMARY KEY, instituteId TEXT NOT NULL, name TEXT NOT NULL, city TEXT DEFAULT '', manager TEXT, managerEmail TEXT, students INTEGER DEFAULT 0, teachers INTEGER DEFAULT 0, status TEXT DEFAULT 'Active', createdAt TEXT DEFAULT (datetime('now')), blocked INTEGER NOT NULL DEFAULT 0, blockedReason TEXT)`,
    `CREATE TABLE IF NOT EXISTS classes (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, name TEXT NOT NULL, section TEXT DEFAULT 'A', teacherId TEXT)`,
    `CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, name TEXT NOT NULL, code TEXT)`,
    `CREATE TABLE IF NOT EXISTS class_courses (id TEXT PRIMARY KEY, classId TEXT NOT NULL, courseId TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS teacher_class_courses (id TEXT PRIMARY KEY, teacherId TEXT NOT NULL, classId TEXT NOT NULL, courseId TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY, senderId TEXT NOT NULL, senderRole TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, targetRole TEXT, targetScope TEXT DEFAULT 'all', targetIds TEXT, instituteId TEXT, branchId TEXT, classId TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS course_materials (id TEXT PRIMARY KEY, teacherId TEXT NOT NULL, classId TEXT NOT NULL, courseId TEXT NOT NULL, title TEXT NOT NULL, description TEXT, fileType TEXT, fileName TEXT, fileData TEXT, linkUrl TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS attendance (id TEXT PRIMARY KEY, branchId TEXT, classId TEXT, date TEXT NOT NULL, teacherId TEXT, records TEXT NOT NULL, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS results (id TEXT PRIMARY KEY, branchId TEXT, exam TEXT NOT NULL, courseId TEXT, classId TEXT, teacherId TEXT, totalMarks INTEGER DEFAULT 100, date TEXT NOT NULL, records TEXT NOT NULL, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS fees (id TEXT PRIMARY KEY, studentId TEXT NOT NULL, instituteId TEXT, branchId TEXT, amount REAL NOT NULL, type TEXT DEFAULT 'Tuition', method TEXT DEFAULT 'Online', date TEXT NOT NULL, status TEXT DEFAULT 'Paid')`,
    `CREATE TABLE IF NOT EXISTS diary (id TEXT PRIMARY KEY, teacherId TEXT NOT NULL, branchId TEXT, classId TEXT, courseId TEXT, subject TEXT, title TEXT NOT NULL, description TEXT, due TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, userId TEXT NOT NULL, role TEXT NOT NULL, issuedAt INTEGER NOT NULL, expiresAt INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS fee_structure (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, classId TEXT NOT NULL, monthlyFee REAL NOT NULL DEFAULT 0, admissionFee REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS fee_invoices (id TEXT PRIMARY KEY, studentId TEXT NOT NULL, studentName TEXT, className TEXT, branchId TEXT, instituteId TEXT, month TEXT NOT NULL, year INTEGER NOT NULL, amount REAL NOT NULL, type TEXT DEFAULT 'Tuition', status TEXT DEFAULT 'Unpaid', paidDate TEXT, paidAmount REAL DEFAULT 0, paymentMethod TEXT, challanNo TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS teacher_salaries (id TEXT PRIMARY KEY, teacherId TEXT NOT NULL, instituteId TEXT, branchId TEXT, monthlySalary REAL NOT NULL DEFAULT 0, effectiveFrom TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS salary_payments (id TEXT PRIMARY KEY, teacherId TEXT NOT NULL, teacherName TEXT, instituteId TEXT, branchId TEXT, month TEXT NOT NULL, year INTEGER NOT NULL, amount REAL NOT NULL, status TEXT DEFAULT 'Paid', paidDate TEXT, paymentMethod TEXT DEFAULT 'Bank Transfer', notes TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS sms_log (id TEXT PRIMARY KEY, senderId TEXT NOT NULL, senderRole TEXT, text TEXT NOT NULL, recipients INTEGER DEFAULT 0, type TEXT DEFAULT 'Notice', instituteId TEXT, branchId TEXT, classId TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS complaints (id TEXT PRIMARY KEY, parentId TEXT NOT NULL, studentId TEXT, instituteId TEXT, branchId TEXT, subject TEXT NOT NULL, message TEXT NOT NULL, status TEXT DEFAULT 'Open', response TEXT, respondedAt TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, startDate TEXT, endDate TEXT, location TEXT, type TEXT DEFAULT 'Event', instituteId TEXT, branchId TEXT, createdBy TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS library_books (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, title TEXT NOT NULL, author TEXT, isbn TEXT, category TEXT, totalCopies INTEGER DEFAULT 1, availableCopies INTEGER DEFAULT 1, shelf TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS transport_routes (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, routeName TEXT NOT NULL, driver TEXT, vehicleNo TEXT, fare REAL DEFAULT 0, stops TEXT, capacity INTEGER DEFAULT 30, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS manual_revenue (id TEXT PRIMARY KEY, enteredBy TEXT NOT NULL, enteredByRole TEXT NOT NULL, instituteId TEXT, sourceType TEXT NOT NULL, sourceId TEXT NOT NULL, sourceName TEXT NOT NULL, amount REAL NOT NULL DEFAULT 0, month TEXT NOT NULL, year INTEGER NOT NULL, notes TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS timetable (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, classId TEXT, className TEXT, section TEXT DEFAULT 'A', day TEXT NOT NULL, period INTEGER NOT NULL, startTime TEXT, endTime TEXT, subject TEXT, teacherId TEXT, teacherName TEXT, roomId TEXT, roomName TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS report_cards (id TEXT PRIMARY KEY, studentId TEXT NOT NULL, studentName TEXT, class TEXT, section TEXT DEFAULT 'A', branchId TEXT, instituteId TEXT, term TEXT NOT NULL, examName TEXT, totalMarks INTEGER DEFAULT 0, obtainedMarks INTEGER DEFAULT 0, percentage REAL DEFAULT 0, grade TEXT, remarks TEXT, generatedBy TEXT, generatedAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS royalty_settings (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, instituteId TEXT NOT NULL, method TEXT NOT NULL DEFAULT 'fixed', amount REAL DEFAULT 0, percentage REAL DEFAULT 0, effectiveFrom TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS royalty_invoices (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, instituteId TEXT NOT NULL, branchName TEXT, month TEXT NOT NULL, year INTEGER NOT NULL, method TEXT, studentCount INTEGER DEFAULT 0, branchRevenue REAL DEFAULT 0, royaltyAmount REAL NOT NULL DEFAULT 0, status TEXT DEFAULT 'Pending', paidDate TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
  ];

  for (const sql of statements) {
    try { await db.execute(sql); } catch {}
  }

  // === Column migrations for Concordia base-fee feature ===
  // admissions office sets a one-time locked base fee per student.
  try { await db.execute({ sql: 'ALTER TABLE users ADD COLUMN baseFee REAL', args: [] }); } catch {}
  try { await db.execute({ sql: 'ALTER TABLE users ADD COLUMN baseFeeLocked INTEGER NOT NULL DEFAULT 0', args: [] }); } catch {}
  try { await db.execute({ sql: 'ALTER TABLE users ADD COLUMN fatherName TEXT', args: [] }); } catch {}
  try { await db.execute({ sql: 'ALTER TABLE users ADD COLUMN cnic TEXT', args: [] }); } catch {}
  try { await db.execute({ sql: 'ALTER TABLE users ADD COLUMN dob TEXT', args: [] }); } catch {}
  try { await db.execute({ sql: 'ALTER TABLE users ADD COLUMN address TEXT', args: [] }); } catch {}
  try { await db.execute({ sql: 'ALTER TABLE users ADD COLUMN prevResult TEXT', args: [] }); } catch {}
  try { await db.execute({ sql: 'ALTER TABLE users ADD COLUMN program TEXT', args: [] }); } catch {}
  try { await db.execute({ sql: 'ALTER TABLE users ADD COLUMN photoUrl TEXT', args: [] }); } catch {}
  } // end schema init block

  // === Data seeding — runs on EVERY call (idempotent, cheap SELECT-then-INSERT) ===
  // This must NOT be cached because warm Vercel lambdas may have been initialized
  // before a new seed was added in a deployment — the seed would never run.

  // Seed super admin if not exists
  // Password is read from SEED_PASSWORD_SUPER_ADMIN env var (production should
  // set a strong password); falls back to a dev-only default if unset.
  const existing = await db.execute({ sql: 'SELECT id FROM users WHERE role = ?', args: ['super-admin'] });
  if (existing.rows.length === 0) {
    const superPwd = process.env.SEED_PASSWORD_SUPER_ADMIN || 'QaReLc_61y8';
    await db.execute({
      sql: `INSERT INTO users (id, name, email, password, role, status, title, mustChangePassword, blocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['U-SUPER', 'Faisal Khan', 'faisu577277@gmail.com', superPwd, 'super-admin', 'Active', 'Chief Executive Officer', 0, 0],
    });
  }

  // ===================== CONCORDIA INSTITUTE + OFFICE LOGINS =====================
  // Seeds a minimal Concordia College institute + branch (no demo students,
  // teachers, classes, timetable, announcements, fees, attendance, results,
  // library, transport or events). This keeps the portals clean — every
  // portal shows honest empty states until real data is entered by the
  // Admission / Accountant / Academic offices.
  //
  // Only the 4 advertised office logins are seeded (admin / admissions /
  // accountant / academics @concordia.edu.pk). Passwords are read from
  // SEED_PASSWORD_* env vars — production MUST set these. A development
  // fallback is used only when the env vars are unset (local dev).
  // Teacher & Student logins are created by the Academic Office at runtime.
  const concordiaAdminExists = await db.execute({ sql: 'SELECT id FROM users WHERE id = ?', args: ['U-CONCORDIA-ADMIN'] });
  if (concordiaAdminExists.rows.length === 0) {
    // 1. Concordia Institute (minimal — no fake student/teacher/revenue counts)
    await db.execute({
      sql: `INSERT OR IGNORE INTO institutes (id, name, short, city, country, plan, status, adminName, adminEmail, branches, students, staff, revenue, color, domain, blocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['I-DEMO', 'Concordia College', 'CC', 'Lahore', 'Pakistan', 'Premium', 'Active', 'Concordia Admin', 'admin@concordia.edu.pk', 1, 0, 4, 0, 'orange', 'edu', 0],
    });

    // 2. Concordia Branch (minimal)
    await db.execute({
      sql: `INSERT OR IGNORE INTO branches (id, instituteId, name, city, manager, managerEmail, students, teachers, status, blocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['B-DEMO', 'I-DEMO', 'Main Campus', 'Lahore', 'Concordia Admin', 'admin@concordia.edu.pk', 0, 0, 'Active', 0],
    });

    // 3. The 4 Concordia office logins — passwords from env vars (production
    //    should set strong passwords; dev falls back to 'concordia123').
    const adminPwd = process.env.SEED_PASSWORD_ADMIN || 'concordia123';
    const admissionsPwd = process.env.SEED_PASSWORD_ADMISSIONS || 'concordia123';
    const accountantPwd = process.env.SEED_PASSWORD_ACCOUNTANT || 'concordia123';
    const academicPwd = process.env.SEED_PASSWORD_ACADEMIC || 'concordia123';
    // Warn loudly if production-like environment is using fallback passwords.
    if (process.env.NODE_ENV === 'production' && !process.env.SEED_PASSWORD_ADMIN) {
      console.warn('[security] SEED_PASSWORD_* env vars not set — using dev fallback passwords in production. Set them in Vercel project settings immediately.');
    }
    await db.execute({
      sql: `INSERT OR IGNORE INTO users (id, name, email, password, role, status, title, mustChangePassword, blocked, instituteId, branchId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['U-CONCORDIA-ADMIN', 'Concordia Admin', 'admin@concordia.edu.pk', adminPwd, 'admin', 'Active', 'College Administrator', 0, 0, 'I-DEMO', 'B-DEMO'],
    });
    await db.execute({
      sql: `INSERT OR IGNORE INTO users (id, name, email, password, role, status, title, mustChangePassword, blocked, instituteId, branchId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['U-CONCORDIA-ADMISSIONS', 'Admission Office', 'admissions@concordia.edu.pk', admissionsPwd, 'admissions', 'Active', 'Admission Officer', 0, 0, 'I-DEMO', 'B-DEMO'],
    });
    await db.execute({
      sql: `INSERT OR IGNORE INTO users (id, name, email, password, role, status, title, mustChangePassword, blocked, instituteId, branchId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['U-CONCORDIA-ACCOUNTANT', 'Accountant', 'accountant@concordia.edu.pk', accountantPwd, 'accountant', 'Active', 'Chief Accountant', 0, 0, 'I-DEMO', 'B-DEMO'],
    });
    await db.execute({
      sql: `INSERT OR IGNORE INTO users (id, name, email, password, role, status, title, mustChangePassword, blocked, instituteId, branchId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['U-CONCORDIA-ACADEMIC', 'Academic Office', 'academics@concordia.edu.pk', academicPwd, 'academic', 'Active', 'Academic Coordinator', 0, 0, 'I-DEMO', 'B-DEMO'],
    });
  }

  // ===================== DEMO / FAKE DATA CLEANUP (unconditional) =====================
  // Permanently delete ALL previously-seeded demo / fake / test data so existing
  // deployments are cleaned up automatically on every request. Only the super
  // admin + 4 Concordia office logins remain. Each DELETE is wrapped in its own
  // try/catch so a failure on one table never blocks the others.
  //
  // CRITICAL: ALL announcements are wiped on every call. This guarantees that
  // no dummy / fake / test announcements survive across deployments. Real
  // announcements are created by users through the portals going forward.
  const wipe = async (sql: string) => { try { await db.execute({ sql }); } catch {} };

  // --- Announcements: wipe ALL (clean slate every call) ---
  await wipe(`DELETE FROM announcements`);

  // --- Legacy demo / test users ---
  await wipe(`DELETE FROM users WHERE role IN ('institute-admin', 'branch-manager')`);
  await wipe(`DELETE FROM users WHERE id IN ('U-DEMO-TEACHER', 'U-DEMO-STUDENT', 'U-DEMO-PARENT', 'U-DEMO-ADMIN', 'U-DEMO-BRANCH', 'U-7ec51783')`);

  // --- Test / demo content by ID pattern ---
  await wipe(`DELETE FROM timetable WHERE id LIKE 'TT-DEMO-%'`);
  await wipe(`DELETE FROM fee_invoices WHERE id LIKE 'FI-DEMO-%'`);
  await wipe(`DELETE FROM attendance WHERE id LIKE 'ATT-DEMO-%'`);
  await wipe(`DELETE FROM results WHERE id LIKE 'R-DEMO-%'`);
  await wipe(`DELETE FROM library_books WHERE id LIKE 'LB-DEMO-%'`);
  await wipe(`DELETE FROM transport_routes WHERE id LIKE 'TR-DEMO-%'`);
  await wipe(`DELETE FROM events WHERE id LIKE 'E-DEMO-%'`);
  await wipe(`DELETE FROM classes WHERE id LIKE 'C-DEMO-%'`);
  await wipe(`DELETE FROM courses WHERE id LIKE 'CR-DEMO-%'`);

  // --- Orphan allocations from deleted test teachers ---
  await wipe(`DELETE FROM teacher_class_courses WHERE teacherId IN ('U-DEMO-TEACHER', 'U-7ec51783')`);
  await wipe(`DELETE FROM course_materials WHERE teacherId IN ('U-DEMO-TEACHER', 'U-7ec51783')`);
  await wipe(`DELETE FROM diary WHERE teacherId IN ('U-DEMO-TEACHER', 'U-7ec51783')`);
  // Re-brand the institute + branch to Concordia on existing deployments
  // (updates only — no fake counts inserted).
  try {
    await db.execute({ sql: `UPDATE institutes SET name = 'Concordia College', short = 'CC', color = 'orange', students = 0, staff = 4, revenue = 0 WHERE id = 'I-DEMO'` });
  } catch {}
  try {
    await db.execute({ sql: `UPDATE branches SET name = 'Main Campus', manager = 'Concordia Admin', managerEmail = 'admin@concordia.edu.pk', students = 0, teachers = 0 WHERE id = 'B-DEMO'` });
  } catch {}
}
