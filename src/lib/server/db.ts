import { createClient } from '@libsql/client';

// Turso DB client — server-side only (never import in client components)
// Credentials MUST come from environment variables. No hardcoded fallbacks.
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  // Fail loud on misconfiguration rather than silently using a stale credential.
  console.error('[db] Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables.');
}

export const db = createClient({
  url: TURSO_URL || 'libsql://placeholder.local',
  authToken: TURSO_TOKEN || '',
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
  } // end schema init block

  // === Data seeding — runs on EVERY call (idempotent, cheap SELECT-then-INSERT) ===
  // This must NOT be cached because warm Vercel lambdas may have been initialized
  // before a new seed was added in a deployment — the seed would never run.

  // Seed super admin if not exists
  const existing = await db.execute({ sql: 'SELECT id FROM users WHERE role = ?', args: ['super-admin'] });
  if (existing.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO users (id, name, email, password, role, status, title, mustChangePassword, blocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['U-SUPER', 'Faisal Khan', 'faisu577277@gmail.com', 'QaReLc_61y8', 'super-admin', 'Active', 'Chief Executive Officer', 0, 0],
    });
  }

  // ===================== DEMO DATA SEED =====================
  // Seeds a complete demo institute + branch + 5 role users + sample classes/timetable/announcements
  // so the founder can log in as any role and demo the full product to customers.
  // Idempotent — each INSERT uses OR IGNORE so partial seeds from prior deployments complete cleanly.
  const demoAdminExists = await db.execute({ sql: 'SELECT id FROM users WHERE id = ?', args: ['U-DEMO-ADMIN'] });
  if (demoAdminExists.rows.length === 0) {
    // 1. Demo Institute (may already exist from a partial seed — OR IGNORE handles it)
    await db.execute({
      sql: `INSERT OR IGNORE INTO institutes (id, name, short, city, country, plan, status, adminName, adminEmail, branches, students, staff, revenue, color, domain, blocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['I-DEMO', 'Al-Noor Public School', 'ANPS', 'Lahore', 'Pakistan', 'Premium', 'Active', 'Imran Siddiqui', 'admin@alnoor.edu', 1, 247, 18, 890000, 'emerald', 'edu', 0],
    });

    // 2. Demo Branch
    await db.execute({
      sql: `INSERT OR IGNORE INTO branches (id, instituteId, name, city, manager, managerEmail, students, teachers, status, blocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['B-DEMO', 'I-DEMO', 'Gulberg Campus', 'Lahore', 'Saima Bukhari', 'branch@alnoor.edu', 247, 18, 'Active', 0],
    });

    // 3. Demo Classes (3 classes)
    await db.execute({ sql: `INSERT OR IGNORE INTO classes (id, branchId, name, section, teacherId) VALUES (?, ?, ?, ?, ?)`, args: ['C-DEMO-10A', 'B-DEMO', 'Grade 10', 'A', 'U-DEMO-TEACHER'] });
    await db.execute({ sql: `INSERT OR IGNORE INTO classes (id, branchId, name, section, teacherId) VALUES (?, ?, ?, ?, ?)`, args: ['C-DEMO-9B', 'B-DEMO', 'Grade 9', 'B', 'U-DEMO-TEACHER'] });
    await db.execute({ sql: `INSERT OR IGNORE INTO classes (id, branchId, name, section, teacherId) VALUES (?, ?, ?, ?, ?)`, args: ['C-DEMO-8A', 'B-DEMO', 'Grade 8', 'A', 'U-DEMO-TEACHER'] });

    // 4. Demo Courses
    await db.execute({ sql: `INSERT OR IGNORE INTO courses (id, branchId, name, code) VALUES (?, ?, ?, ?)`, args: ['CR-DEMO-MATH', 'B-DEMO', 'Mathematics', 'MATH101'] });
    await db.execute({ sql: `INSERT OR IGNORE INTO courses (id, branchId, name, code) VALUES (?, ?, ?, ?)`, args: ['CR-DEMO-PHY', 'B-DEMO', 'Physics', 'PHY101'] });
    await db.execute({ sql: `INSERT OR IGNORE INTO courses (id, branchId, name, code) VALUES (?, ?, ?, ?)`, args: ['CR-DEMO-ENG', 'B-DEMO', 'English', 'ENG101'] });

    // 5. Demo Users — 5 roles (all password: demo123)
    // Institute Admin
    await db.execute({
      sql: `INSERT OR IGNORE INTO users (id, name, email, password, role, status, title, mustChangePassword, blocked, instituteId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['U-DEMO-ADMIN', 'Imran Siddiqui', 'admin@alnoor.edu', 'demo123', 'institute-admin', 'Active', 'Institute Administrator', 0, 0, 'I-DEMO'],
    });
    // Branch Manager
    await db.execute({
      sql: `INSERT OR IGNORE INTO users (id, name, email, password, role, status, title, mustChangePassword, blocked, instituteId, branchId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['U-DEMO-BRANCH', 'Saima Bukhari', 'branch@alnoor.edu', 'demo123', 'branch-manager', 'Active', 'Branch Manager', 0, 0, 'I-DEMO', 'B-DEMO'],
    });
    // Teacher
    await db.execute({
      sql: `INSERT OR IGNORE INTO users (id, name, email, rollNo, password, role, status, title, mustChangePassword, blocked, instituteId, branchId, subjects, classes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['U-DEMO-TEACHER', 'Ayesha Khan', 'ayesha@alnoor.edu', 'T001', 'demo123', 'teacher', 'Active', 'Senior Teacher — Mathematics', 0, 0, 'I-DEMO', 'B-DEMO', JSON.stringify(['Mathematics', 'Physics']), JSON.stringify(['C-DEMO-10A', 'C-DEMO-9B'])],
    });
    // Student
    await db.execute({
      sql: `INSERT OR IGNORE INTO users (id, name, email, rollNo, password, role, status, title, mustChangePassword, blocked, instituteId, branchId, class, section, guardian) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['U-DEMO-STUDENT', 'Ali Ahmed', 'ali@alnoor.edu', 'S001', 'demo123', 'student', 'Active', 'Student — Grade 10-A', 0, 0, 'I-DEMO', 'B-DEMO', 'Grade 10', 'A', 'Ahmed Raza'],
    });
    // Parent (linked to the student as ward)
    await db.execute({
      sql: `INSERT OR IGNORE INTO users (id, name, email, password, role, status, title, mustChangePassword, blocked, instituteId, branchId, ward, wardId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['U-DEMO-PARENT', 'Ahmed Raza', 'parent@alnoor.edu', 'demo123', 'parent', 'Active', 'Parent / Guardian', 0, 0, 'I-DEMO', 'B-DEMO', 'Ali Ahmed', 'U-DEMO-STUDENT'],
    });

    // 6. Demo Timetable entries (Mon-Fri, 8 AM - 1 PM, 5 periods)
    const timetableEntries = [
      ['Monday', 1, '08:00', '08:45', 'Mathematics', 'U-DEMO-TEACHER', 'Ayesha Khan', 'Room 101'],
      ['Monday', 2, '08:50', '09:35', 'Physics', 'U-DEMO-TEACHER', 'Ayesha Khan', 'Room 102'],
      ['Monday', 3, '09:40', '10:25', 'English', 'U-DEMO-TEACHER', 'Ayesha Khan', 'Room 103'],
      ['Tuesday', 1, '08:00', '08:45', 'Mathematics', 'U-DEMO-TEACHER', 'Ayesha Khan', 'Room 101'],
      ['Tuesday', 2, '08:50', '09:35', 'English', 'U-DEMO-TEACHER', 'Ayesha Khan', 'Room 103'],
      ['Wednesday', 1, '08:00', '08:45', 'Physics', 'U-DEMO-TEACHER', 'Ayesha Khan', 'Room 102'],
      ['Wednesday', 2, '08:50', '09:35', 'Mathematics', 'U-DEMO-TEACHER', 'Ayesha Khan', 'Room 101'],
      ['Thursday', 1, '08:00', '08:45', 'English', 'U-DEMO-TEACHER', 'Ayesha Khan', 'Room 103'],
      ['Friday', 1, '08:00', '08:45', 'Mathematics', 'U-DEMO-TEACHER', 'Ayesha Khan', 'Room 101'],
      ['Friday', 2, '08:50', '09:35', 'Physics', 'U-DEMO-TEACHER', 'Ayesha Khan', 'Room 102'],
    ];
    for (let i = 0; i < timetableEntries.length; i++) {
      const [day, period, start, end, subject, teacherId, teacherName, room] = timetableEntries[i];
      await db.execute({
        sql: `INSERT OR IGNORE INTO timetable (id, branchId, classId, className, section, day, period, startTime, endTime, subject, teacherId, teacherName, roomName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [`TT-DEMO-${i}`, 'B-DEMO', 'C-DEMO-10A', 'Grade 10', 'A', day, period as number, start, end, subject, teacherId, teacherName, room],
      });
    }

    // 7. Demo Announcements (3)
    await db.execute({
      sql: `INSERT OR IGNORE INTO announcements (id, senderId, senderRole, title, message, targetRole, targetScope, instituteId, branchId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['A-DEMO-1', 'U-DEMO-ADMIN', 'institute-admin', 'Annual Sports Day — Register Now!', 'Dear students, our Annual Sports Day will be held on February 15th, 2026 at the main ground. Registration is open until Feb 5th. See your class teacher for sign-up forms.', 'student', 'all', 'I-DEMO', 'B-DEMO'],
    });
    await db.execute({
      sql: `INSERT OR IGNORE INTO announcements (id, senderId, senderRole, title, message, targetRole, targetScope, instituteId, branchId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['A-DEMO-2', 'U-DEMO-BRANCH', 'branch-manager', 'Parent-Teacher Meeting — Saturday 10 AM', 'PTM for Grade 10-A is scheduled for this Saturday at 10:00 AM. All parents are requested to attend. Agenda: Mid-term result discussion + career counseling.', 'parent', 'all', 'I-DEMO', 'B-DEMO'],
    });
    await db.execute({
      sql: `INSERT OR IGNORE INTO announcements (id, senderId, senderRole, title, message, targetRole, targetScope, instituteId, branchId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['A-DEMO-3', 'U-DEMO-ADMIN', 'institute-admin', 'Fee Submission Deadline — 10th of Every Month', 'Reminder: Monthly tuition fee must be submitted by the 10th of every month to avoid late fee surcharge of PKR 500. Use the Campus Wallet or pay at the branch accounts office.', 'student', 'all', 'I-DEMO', 'B-DEMO'],
    });

    // 8. Demo Fee Invoices (2 — 1 Paid, 1 Unpaid)
    await db.execute({
      sql: `INSERT OR IGNORE INTO fee_invoices (id, studentId, studentName, className, branchId, instituteId, month, year, amount, type, status, paidDate, paidAmount, paymentMethod, challanNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['FI-DEMO-1', 'U-DEMO-STUDENT', 'Ali Ahmed', 'Grade 10', 'B-DEMO', 'I-DEMO', 'December', 2025, 8500, 'Tuition', 'Paid', '2025-12-08', 8500, 'JazzCash', 'CHN-2025-12-001'],
    });
    await db.execute({
      sql: `INSERT OR IGNORE INTO fee_invoices (id, studentId, studentName, className, branchId, instituteId, month, year, amount, type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['FI-DEMO-2', 'U-DEMO-STUDENT', 'Ali Ahmed', 'Grade 10', 'B-DEMO', 'I-DEMO', 'January', 2026, 8500, 'Tuition', 'Unpaid'],
    });

    // 9. Demo Attendance (last 5 days for the student)
    const today = new Date();
    for (let d = 0; d < 5; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      const status = d === 2 ? 'absent' : 'present'; // absent 2 days ago
      await db.execute({
        sql: `INSERT OR IGNORE INTO attendance (id, branchId, classId, date, teacherId, records) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [`ATT-DEMO-${d}`, 'B-DEMO', 'C-DEMO-10A', dateStr, 'U-DEMO-TEACHER', JSON.stringify([{ studentId: 'U-DEMO-STUDENT', studentName: 'Ali Ahmed', status }])],
      });
    }

    // 10. Demo Result (1 mid-term result)
    await db.execute({
      sql: `INSERT OR IGNORE INTO results (id, branchId, exam, courseId, classId, teacherId, totalMarks, date, records) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['R-DEMO-1', 'B-DEMO', 'Mid Term', 'CR-DEMO-MATH', 'C-DEMO-10A', 'U-DEMO-TEACHER', 100, '2025-12-15', JSON.stringify([{ studentId: 'U-DEMO-STUDENT', studentName: 'Ali Ahmed', obtained: 87, grade: 'A' }])],
    });

    // 11. Demo Library Books (3)
    await db.execute({ sql: `INSERT OR IGNORE INTO library_books (id, branchId, title, author, isbn, category, totalCopies, availableCopies, shelf) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, args: ['LB-DEMO-1', 'B-DEMO', 'Mathematics for Class 10', 'Dr. M. Iqbal', '978-969-5321-01-2', 'Mathematics', 5, 4, 'A-12'] });
    await db.execute({ sql: `INSERT OR IGNORE INTO library_books (id, branchId, title, author, isbn, category, totalCopies, availableCopies, shelf) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, args: ['LB-DEMO-2', 'B-DEMO', 'Physics Fundamentals', 'Halliday & Resnick', '978-111-8230-71-9', 'Physics', 3, 3, 'B-04'] });
    await db.execute({ sql: `INSERT OR IGNORE INTO library_books (id, branchId, title, author, isbn, category, totalCopies, availableCopies, shelf) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, args: ['LB-DEMO-3', 'B-DEMO', 'English Grammar in Use', 'Raymond Murphy', '978-052-1184-39-0', 'English', 4, 2, 'C-08'] });

    // 12. Demo Transport Routes (2)
    await db.execute({
      sql: `INSERT OR IGNORE INTO transport_routes (id, branchId, routeName, driver, vehicleNo, fare, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: ['TR-DEMO-1', 'B-DEMO', 'Gulberg Route', 'Rashid Mehmood', 'LEB-2024', 3500, 30],
    });
    await db.execute({
      sql: `INSERT OR IGNORE INTO transport_routes (id, branchId, routeName, driver, vehicleNo, fare, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: ['TR-DEMO-2', 'B-DEMO', 'Model Town Route', 'Tariq Khan', 'LEC-5588', 3000, 25],
    });

    // 13. Demo Events (2 upcoming)
    await db.execute({
      sql: `INSERT OR IGNORE INTO events (id, title, description, startDate, endDate, location, type, instituteId, branchId, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['E-DEMO-1', 'Annual Sports Day 2026', 'Annual sports competition for all classes. Track events, team sports, and prize distribution.', '2026-02-15', '2026-02-15', 'Main Sports Ground', 'Sports', 'I-DEMO', 'B-DEMO', 'U-DEMO-ADMIN'],
    });
    await db.execute({
      sql: `INSERT OR IGNORE INTO events (id, title, description, startDate, endDate, location, type, instituteId, branchId, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['E-DEMO-2', 'Science Exhibition', 'Class 8-10 students showcase their science projects. Parents invited.', '2026-02-20', '2026-02-20', 'School Auditorium', 'Academic', 'I-DEMO', 'B-DEMO', 'U-DEMO-ADMIN'],
    });
  }
}
