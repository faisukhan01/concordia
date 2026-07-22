// Role-scoped module catalogs — each role sees a different sidebar.
// Concordia College structure per the Admin Management System spec (v1.0):
//   Admin, Admission Office, Accountant, Academic Office, Teacher, Student, Parent
//
// DESIGN PHILOSOPHY (per document v1.0):
//   Each role has a MINIMAL, clearly-scoped set of modules matching its
//   permissions. No legacy modules (e-learning, exam-portal, digital-id,
//   campus-wallet, diary, sms, complaint-portal, transport, health-records,
//   ptm) — those are not in the spec.
//
// ADMIN HUB:
//   The Admin sidebar does NOT expand every sub-portal's modules as
//   dropdowns (that was too messy). Instead it has a single "Portals"
//   section with 6 entries. Clicking one opens a hub page showing all
//   that role's modules as cards — clean and organized.
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Building2, Network, Users, DollarSign, TrendingUp, Settings, ShieldCheck,
  CalendarCheck, GraduationCap, BookOpen, MessageSquare, Trophy,
  ClipboardList, FileText, Bell, CreditCard, Calendar, Award,
  UserPlus, UserCog, Receipt, CalendarDays, Megaphone, BookMarked, KeyRound,
  MessageCircle, FileSpreadsheet, Inbox,
} from 'lucide-react';

export type RoleModule = {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
};

export type RoleModules = {
  [role: string]: { group: string; items: RoleModule[] }[];
};

// Concordia orange professional palette.
const PRIMARY = 'from-primary to-primary/80';
const SECONDARY = 'from-primary/80 to-primary';

export const ROLE_MODULES: RoleModules = {
  'super-admin': [
    { group: 'Platform', items: [
      { id: 'platform-overview', name: 'Dashboard', icon: LayoutDashboard, color: PRIMARY },
      { id: 'institutes', name: 'Institutes', icon: Building2, color: PRIMARY },
      { id: 'platform-analytics', name: 'Analytics', icon: TrendingUp, color: PRIMARY },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: SECONDARY },
    ]},
    { group: 'System', items: [
      { id: 'config', name: 'Platform Config', icon: Settings, color: SECONDARY },
      { id: 'branding', name: 'Branding', icon: ShieldCheck, color: SECONDARY },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: SECONDARY },
    ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // Admin — top-level, oversees all other roles (spec §1.1)
  //
  // CLEAN HUB APPROACH:
  //   The sidebar has a single "Portals" section with 6 entries (one per
  //   subordinate role). Clicking a portal entry opens a hub page that
  //   shows all that role's modules as cards. This keeps the sidebar
  //   minimal (~11 items) while giving the admin full access to every
  //   sub-portal's functionality.
  //
  //   Portal entry IDs use the format `role:__hub__` (e.g.
  //   `admissions:__hub__`). The AdminPortal component detects this and
  //   renders a PortalHub component with cards for each module.
  // ═══════════════════════════════════════════════════════════════
  'admin': [
    { group: 'Overview', items: [
      { id: 'admin-overview', name: 'Dashboard', icon: LayoutDashboard, color: PRIMARY },
      { id: 'admin-analytics', name: 'Analytics', icon: TrendingUp, color: PRIMARY },
      { id: 'announcements', name: 'Announcements', icon: Megaphone, color: SECONDARY },
    ]},
    { group: 'People', items: [
      { id: 'admin-students', name: 'All Students', icon: GraduationCap, color: PRIMARY },
      { id: 'admin-teachers', name: 'All Teachers', icon: Users, color: PRIMARY },
      { id: 'admin-staff', name: 'Office Staff', icon: UserCog, color: SECONDARY },
    ]},
    { group: 'Portals', items: [
      { id: 'admissions:__hub__', name: 'Admission Office', icon: UserPlus, color: PRIMARY },
      { id: 'accountant:__hub__', name: 'Accountant', icon: CreditCard, color: PRIMARY },
      { id: 'academic:__hub__', name: 'Academic Office', icon: BookOpen, color: PRIMARY },
      { id: 'teacher:__hub__', name: 'Teacher', icon: Users, color: SECONDARY },
      { id: 'student:__hub__', name: 'Student', icon: GraduationCap, color: SECONDARY },
      { id: 'parent:__hub__', name: 'Parent', icon: MessageCircle, color: SECONDARY },
    ]},
    { group: 'Reports & Events', items: [
      { id: 'admin-fees', name: 'Fee Management', icon: CreditCard, color: PRIMARY },
      { id: 'admin-reports', name: 'Reports', icon: FileSpreadsheet, color: SECONDARY },
      { id: 'events', name: 'Events', icon: Trophy, color: SECONDARY },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: SECONDARY },
    ]},
  ],

  // ─────────────────────────────────────────────────────────────
  // Admission Office — registers students + finalizes (locks) base fee
  // (spec §2)
  // ─────────────────────────────────────────────────────────────
  'admissions': [
    { group: 'Enrollment', items: [
      { id: 'admissions-overview', name: 'Dashboard', icon: LayoutDashboard, color: PRIMARY },
      { id: 'admissions-new', name: 'New Enrollment', icon: UserPlus, color: PRIMARY },
      { id: 'admissions-students', name: 'Student Records', icon: GraduationCap, color: PRIMARY },
      { id: 'admissions-base-fee', name: 'Base Fee Finalization', icon: DollarSign, color: SECONDARY },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: SECONDARY },
    ]},
  ],

  // ─────────────────────────────────────────────────────────────
  // Accountant — fee collection, challans, installments, misc charges
  // (spec §3)
  // ─────────────────────────────────────────────────────────────
  'accountant': [
    { group: 'Finance', items: [
      { id: 'accountant-overview', name: 'Dashboard', icon: LayoutDashboard, color: PRIMARY },
      { id: 'accountant-students', name: 'Students (Class-wise)', icon: GraduationCap, color: PRIMARY },
      { id: 'accountant-collect', name: 'Collect Payment', icon: CreditCard, color: PRIMARY },
      { id: 'accountant-challans', name: 'Fee Challans', icon: Receipt, color: SECONDARY },
      { id: 'accountant-installments', name: 'Installments', icon: ClipboardList, color: SECONDARY },
      { id: 'accountant-misc', name: 'Miscellaneous Charges', icon: DollarSign, color: SECONDARY },
      { id: 'accountant-logins', name: 'Student Logins', icon: KeyRound, color: SECONDARY },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: SECONDARY },
    ]},
  ],

  // ─────────────────────────────────────────────────────────────
  // Academic Office — teachers, timetables, date sheets, tests, results
  // (spec §4)
  // ─────────────────────────────────────────────────────────────
  'academic': [
    { group: 'Overview', items: [
      { id: 'academic-overview', name: 'Dashboard', icon: LayoutDashboard, color: PRIMARY },
      { id: 'academic-announcements', name: 'Announcements', icon: Megaphone, color: SECONDARY },
    ]},
    { group: 'Staff & Students', items: [
      { id: 'academic-teachers', name: 'Teachers', icon: Users, color: PRIMARY },
      { id: 'academic-assign', name: 'Class / Subject Assign', icon: BookMarked, color: SECONDARY },
      { id: 'academic-students', name: 'Students', icon: GraduationCap, color: SECONDARY },
      { id: 'academic-logins', name: 'Create Logins', icon: KeyRound, color: PRIMARY },
    ]},
    { group: 'Academics', items: [
      { id: 'timetable', name: 'Timetable', icon: Calendar, color: SECONDARY },
      { id: 'academic-datesheet', name: 'Date Sheets', icon: CalendarDays, color: SECONDARY },
      { id: 'academic-tests', name: 'Monthly Tests', icon: FileText, color: PRIMARY },
      { id: 'results', name: 'Review Marks', icon: ClipboardList, color: SECONDARY },
      { id: 'report-cards', name: 'Result Cards', icon: Award, color: PRIMARY },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: SECONDARY },
    ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // Teacher — manages attendance, results, and feedback for ASSIGNED
  // classes/subjects only (spec §5)
  //
  // Permissions:
  //   ✓ Mark/manage attendance for allocated classes
  //   ✓ Enter and submit test results for allocated subjects
  //   ✓ Give feedback on students
  //   ✓ Post class-specific announcements
  //   ✗ Access classes/subjects outside allocation
  // ═══════════════════════════════════════════════════════════════
  'teacher': [
    { group: 'Teaching', items: [
      { id: 'teacher-dashboard', name: 'Dashboard', icon: LayoutDashboard, color: PRIMARY },
      { id: 'teacher-classes', name: 'My Classes', icon: BookOpen, color: PRIMARY },
      { id: 'teacher-attendance', name: 'Attendance', icon: CalendarCheck, color: PRIMARY },
      { id: 'teacher-results', name: 'Test Results', icon: ClipboardList, color: PRIMARY },
      { id: 'teacher-feedback', name: 'Student Feedback', icon: MessageCircle, color: SECONDARY },
      { id: 'teacher-announcements', name: 'Announcements', icon: Megaphone, color: SECONDARY },
      { id: 'teacher-timetable', name: 'My Timetable', icon: Calendar, color: SECONDARY },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: SECONDARY },
    ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // Student — view-only access to their own academic data (spec §6.1)
  //
  // Receives notifications of: results, announcements, attendance, date sheets
  // ═══════════════════════════════════════════════════════════════
  'student': [
    { group: 'My Portal', items: [
      { id: 'student-dashboard', name: 'Dashboard', icon: LayoutDashboard, color: PRIMARY },
      { id: 'student-results', name: 'My Results', icon: GraduationCap, color: PRIMARY },
      { id: 'student-report-card', name: 'Report Card', icon: Award, color: PRIMARY },
      { id: 'student-attendance', name: 'My Attendance', icon: CalendarCheck, color: SECONDARY },
      { id: 'student-timetable', name: 'Timetable', icon: Calendar, color: SECONDARY },
      { id: 'student-datesheet', name: 'Date Sheets', icon: CalendarDays, color: SECONDARY },
      { id: 'student-announcements', name: 'Announcements', icon: Bell, color: SECONDARY },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: SECONDARY },
    ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // Parent — view-only, mirrors the Student role exactly (spec §6.2)
  // ═══════════════════════════════════════════════════════════════
  'parent': [
    { group: 'My Portal', items: [
      { id: 'parent-dashboard', name: 'Dashboard', icon: LayoutDashboard, color: PRIMARY },
      { id: 'parent-results', name: 'Results', icon: GraduationCap, color: PRIMARY },
      { id: 'parent-report-card', name: 'Report Card', icon: Award, color: PRIMARY },
      { id: 'parent-attendance', name: 'Attendance', icon: CalendarCheck, color: SECONDARY },
      { id: 'parent-timetable', name: 'Timetable', icon: Calendar, color: SECONDARY },
      { id: 'parent-datesheet', name: 'Date Sheets', icon: CalendarDays, color: SECONDARY },
      { id: 'parent-announcements', name: 'Announcements', icon: Bell, color: SECONDARY },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: SECONDARY },
    ]},
  ],

  // Legacy roles — kept for backward compat but login is blocked in handler.ts
  'institute-admin': [
    { group: 'Institute', items: [
      { id: 'institute-overview', name: 'Dashboard', icon: LayoutDashboard, color: PRIMARY },
    ]},
  ],
  'branch-manager': [
    { group: 'Branch', items: [
      { id: 'branch-overview', name: 'Dashboard', icon: LayoutDashboard, color: PRIMARY },
    ]},
  ],
};

// ─────────────────────────────────────────────────────────────
// SUB-PORTAL MODULE MAP — used by the Admin PortalHub
//
// When the admin clicks a portal entry (e.g. "Admission Office"), the
// hub page shows cards for each module in that role's sidebar. This map
// is the single source of truth — it reuses ROLE_MODULES so the hub
// always matches the dedicated portal's actual modules.
// ─────────────────────────────────────────────────────────────
export const SUB_PORTAL_ROLES = [
  'admissions',
  'accountant',
  'academic',
  'teacher',
  'student',
  'parent',
] as const;

export const SUB_PORTAL_META: Record<string, { label: string; description: string; icon: LucideIcon }> = {
  admissions: { label: 'Admission Office', description: 'Register new students and finalize base fees', icon: UserPlus },
  accountant: { label: 'Accountant', description: 'Manage fee collection, challans, and installments', icon: CreditCard },
  academic:   { label: 'Academic Office', description: 'Manage teachers, timetables, tests, and result cards', icon: BookOpen },
  teacher:    { label: 'Teacher', description: 'Attendance, test results, and feedback for assigned classes', icon: Users },
  student:    { label: 'Student', description: 'View-only access to academic data', icon: GraduationCap },
  parent:     { label: 'Parent', description: 'View-only access, mirrored to the linked student', icon: MessageCircle },
};

export const roleAccent: Record<string, { from: string; to: string; text: string; bg: string }> = {
  'super-admin': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'admin': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'admissions': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'accountant': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'academic': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'teacher': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'student': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'parent': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
};
