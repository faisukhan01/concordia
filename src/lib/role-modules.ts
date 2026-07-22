// Role-scoped module catalogs — each role sees a different sidebar.
// Concordia College structure per the Admin Management System spec:
//   super-admin, admin, admissions, accountant, academic, teacher, student, parent
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Building2, Network, Users, DollarSign, TrendingUp, Settings, ShieldCheck,
  CalendarCheck, GraduationCap, BookOpen, MessageSquare, Library, Bus, Trophy, Landmark,
  ClipboardList, FileText, Bell, CreditCard, Calendar, MessageCircleWarning, Award, Crown,
  Navigation, IdCard, Wallet, Video, HeartPulse, FileCheck, AlertTriangle, UserPlus,
  UserCog, Receipt, CalendarDays, FileSpreadsheet, Megaphone, BookMarked, KeyRound,
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
// `from-primary to-primary/80` is the primary module gradient; `from-primary/80 to-primary`
// is used for secondary modules. Rose is reserved for destructive/block actions only.
export const ROLE_MODULES: RoleModules = {
  'super-admin': [
    { group: 'Platform', items: [
      { id: 'platform-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'institutes', name: 'Institutes', icon: Building2, color: 'from-primary to-primary/80' },
      { id: 'platform-analytics', name: 'Analytics', icon: TrendingUp, color: 'from-primary to-primary/80' },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'System', items: [
      { id: 'config', name: 'Platform Config', icon: Settings, color: 'from-primary/80 to-primary' },
      { id: 'branding', name: 'Branding', icon: ShieldCheck, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-primary/80 to-primary' },
    ]},
  ],
  // ─────────────────────────────────────────────────────────────
  // Admin — top-level, oversees all other roles (per Concordia spec §1.1)
  //
  // The Admin sidebar includes dropdown groups for EACH subordinate role
  // portal so the admin can access every sub-portal's modules directly.
  // Clicking a group header expands it to reveal that role's modules.
  //
  // Sub-portal modules use namespaced IDs in the format `role:moduleId`
  // (e.g. `admissions:admissions-new`) so that shared module IDs like
  // `timetable` or `announcements` don't collide between roles. The
  // AdminPortal component parses the namespace and routes to the
  // corresponding dedicated portal component.
  // ─────────────────────────────────────────────────────────────
  'admin': [
    { group: 'Overview', items: [
      { id: 'admin-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'admin-analytics', name: 'Analytics', icon: TrendingUp, color: 'from-primary to-primary/80' },
      { id: 'announcements', name: 'Announcements', icon: Megaphone, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'People', items: [
      { id: 'admin-students', name: 'All Students', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'admin-teachers', name: 'All Teachers', icon: Users, color: 'from-primary to-primary/80' },
      { id: 'admin-staff', name: 'Office Staff', icon: UserCog, color: 'from-primary/80 to-primary' },
    ]},
    // ── Admission Office dropdown ──
    { group: 'Admission Office', items: [
      { id: 'admissions:admissions-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'admissions:admissions-new', name: 'New Enrollment', icon: UserPlus, color: 'from-primary to-primary/80' },
      { id: 'admissions:admissions-students', name: 'Student Records', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'admissions:admissions-base-fee', name: 'Base Fee Finalization', icon: DollarSign, color: 'from-primary/80 to-primary' },
    ]},
    // ── Accountant dropdown ──
    { group: 'Accountant', items: [
      { id: 'accountant:accountant-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'accountant:accountant-students', name: 'Students (Class-wise)', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'accountant:accountant-collect', name: 'Collect Payment', icon: CreditCard, color: 'from-primary to-primary/80' },
      { id: 'accountant:accountant-challans', name: 'Fee Challans', icon: Receipt, color: 'from-primary/80 to-primary' },
      { id: 'accountant:accountant-installments', name: 'Installments', icon: ClipboardList, color: 'from-primary/80 to-primary' },
      { id: 'accountant:accountant-misc', name: 'Miscellaneous Charges', icon: DollarSign, color: 'from-primary/80 to-primary' },
      { id: 'accountant:accountant-logins', name: 'Student Logins', icon: KeyRound, color: 'from-primary/80 to-primary' },
    ]},
    // ── Academic Office dropdown ──
    { group: 'Academic Office', items: [
      { id: 'academic:academic-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'academic:academic-announcements', name: 'Announcements', icon: Megaphone, color: 'from-primary/80 to-primary' },
      { id: 'academic:academic-teachers', name: 'Teachers', icon: Users, color: 'from-primary to-primary/80' },
      { id: 'academic:academic-assign', name: 'Class / Subject Assign', icon: BookMarked, color: 'from-primary/80 to-primary' },
      { id: 'academic:academic-students', name: 'Students', icon: GraduationCap, color: 'from-primary/80 to-primary' },
      { id: 'academic:academic-logins', name: 'Create Logins', icon: KeyRound, color: 'from-primary to-primary/80' },
      { id: 'academic:timetable', name: 'Timetable', icon: Calendar, color: 'from-primary/80 to-primary' },
      { id: 'academic:academic-datesheet', name: 'Date Sheets', icon: CalendarDays, color: 'from-primary/80 to-primary' },
      { id: 'academic:academic-tests', name: 'Monthly Tests', icon: FileText, color: 'from-primary to-primary/80' },
      { id: 'academic:results', name: 'Review Marks', icon: ClipboardList, color: 'from-primary/80 to-primary' },
      { id: 'academic:report-cards', name: 'Result Cards', icon: Award, color: 'from-primary to-primary/80' },
    ]},
    // ── Teacher dropdown ──
    { group: 'Teacher', items: [
      { id: 'teacher:teacher-dashboard', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'teacher:teacher-overview', name: 'My Classes', icon: BookOpen, color: 'from-primary to-primary/80' },
      { id: 'teacher:e-learning', name: 'E-Learning Hub', icon: Video, color: 'from-primary/80 to-primary' },
      { id: 'teacher:exam-portal', name: 'Exam Portal', icon: FileCheck, color: 'from-primary/80 to-primary' },
      { id: 'teacher:diary', name: 'Diary & Homework', icon: ClipboardList, color: 'from-primary/80 to-primary' },
      { id: 'teacher:timetable', name: 'My Timetable', icon: Calendar, color: 'from-primary/80 to-primary' },
      { id: 'teacher:announcements', name: 'Announcements', icon: Bell, color: 'from-primary/80 to-primary' },
      { id: 'teacher:complaint-portal', name: 'Complaint Portal', icon: AlertTriangle, color: 'from-primary/80 to-primary' },
      { id: 'teacher:sms', name: 'SMS Portal', icon: MessageSquare, color: 'from-primary/80 to-primary' },
    ]},
    // ── Student dropdown ──
    { group: 'Student', items: [
      { id: 'student:student-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'student:my-courses', name: 'My Courses', icon: BookOpen, color: 'from-primary to-primary/80' },
      { id: 'student:e-learning', name: 'E-Learning Hub', icon: Video, color: 'from-primary/80 to-primary' },
      { id: 'student:exam-portal', name: 'Exam Portal', icon: FileCheck, color: 'from-primary/80 to-primary' },
      { id: 'student:digital-id', name: 'Digital ID', icon: IdCard, color: 'from-primary/80 to-primary' },
      { id: 'student:campus-wallet', name: 'Campus Wallet', icon: Wallet, color: 'from-primary/80 to-primary' },
      { id: 'student:my-attendance', name: 'Attendance', icon: CalendarCheck, color: 'from-primary/80 to-primary' },
      { id: 'student:my-results', name: 'Results', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'student:my-report-card', name: 'Report Card', icon: Award, color: 'from-primary to-primary/80' },
      { id: 'student:my-invoices', name: 'Invoices', icon: CreditCard, color: 'from-primary/80 to-primary' },
      { id: 'student:my-timetable', name: 'Timetable', icon: Calendar, color: 'from-primary/80 to-primary' },
      { id: 'student:my-diary', name: 'Diary & Homework', icon: ClipboardList, color: 'from-primary/80 to-primary' },
      { id: 'student:my-announcements', name: 'Announcements', icon: Bell, color: 'from-primary/80 to-primary' },
      { id: 'student:complaint-portal', name: 'Complaint Portal', icon: AlertTriangle, color: 'from-primary/80 to-primary' },
    ]},
    // ── Parent dropdown ──
    { group: 'Parent', items: [
      { id: 'parent:student-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'parent:my-results', name: 'Results', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'parent:my-report-card', name: 'Report Card', icon: Award, color: 'from-primary to-primary/80' },
      { id: 'parent:my-attendance', name: 'Attendance', icon: CalendarCheck, color: 'from-primary/80 to-primary' },
      { id: 'parent:my-announcements', name: 'Announcements', icon: Bell, color: 'from-primary/80 to-primary' },
      { id: 'parent:my-timetable', name: 'Timetable', icon: Calendar, color: 'from-primary/80 to-primary' },
      { id: 'parent:complaint-portal', name: 'Complaint Portal', icon: AlertTriangle, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Reports & Events', items: [
      { id: 'admin-fees', name: 'Fee Management', icon: CreditCard, color: 'from-primary to-primary/80' },
      { id: 'admin-reports', name: 'Reports', icon: FileSpreadsheet, color: 'from-primary/80 to-primary' },
      { id: 'events', name: 'Events', icon: Trophy, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-primary/80 to-primary' },
    ]},
  ],
  // ─────────────────────────────────────────────────────────────
  // Admission Office — registers students + finalizes (locks) base fee
  // ─────────────────────────────────────────────────────────────
  'admissions': [
    { group: 'Enrollment', items: [
      { id: 'admissions-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'admissions-new', name: 'New Enrollment', icon: UserPlus, color: 'from-primary to-primary/80' },
      { id: 'admissions-students', name: 'Student Records', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'admissions-base-fee', name: 'Base Fee Finalization', icon: DollarSign, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-primary/80 to-primary' },
    ]},
  ],
  // ─────────────────────────────────────────────────────────────
  // Accountant — fee collection, challans, installments, misc charges
  // ─────────────────────────────────────────────────────────────
  'accountant': [
    { group: 'Finance', items: [
      { id: 'accountant-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'accountant-students', name: 'Students (Class-wise)', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'accountant-collect', name: 'Collect Payment', icon: CreditCard, color: 'from-primary to-primary/80' },
      { id: 'accountant-challans', name: 'Fee Challans', icon: Receipt, color: 'from-primary/80 to-primary' },
      { id: 'accountant-installments', name: 'Installments', icon: ClipboardList, color: 'from-primary/80 to-primary' },
      { id: 'accountant-misc', name: 'Miscellaneous Charges', icon: DollarSign, color: 'from-primary/80 to-primary' },
      { id: 'accountant-logins', name: 'Student Logins', icon: KeyRound, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-primary/80 to-primary' },
    ]},
  ],
  // ─────────────────────────────────────────────────────────────
  // Academic Office — teachers, timetables, date sheets, tests, results,
  // and creates teacher + student login credentials
  // ─────────────────────────────────────────────────────────────
  'academic': [
    { group: 'Overview', items: [
      { id: 'academic-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'academic-announcements', name: 'Announcements', icon: Megaphone, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Staff & Students', items: [
      { id: 'academic-teachers', name: 'Teachers', icon: Users, color: 'from-primary to-primary/80' },
      { id: 'academic-assign', name: 'Class / Subject Assign', icon: BookMarked, color: 'from-primary/80 to-primary' },
      { id: 'academic-students', name: 'Students', icon: GraduationCap, color: 'from-primary/80 to-primary' },
      { id: 'academic-logins', name: 'Create Logins', icon: KeyRound, color: 'from-primary to-primary/80' },
    ]},
    { group: 'Academics', items: [
      { id: 'timetable', name: 'Timetable', icon: Calendar, color: 'from-primary/80 to-primary' },
      { id: 'academic-datesheet', name: 'Date Sheets', icon: CalendarDays, color: 'from-primary/80 to-primary' },
      { id: 'academic-tests', name: 'Monthly Tests', icon: FileText, color: 'from-primary to-primary/80' },
      { id: 'results', name: 'Review Marks', icon: ClipboardList, color: 'from-primary/80 to-primary' },
      { id: 'report-cards', name: 'Result Cards', icon: Award, color: 'from-primary to-primary/80' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-primary/80 to-primary' },
    ]},
  ],
  'institute-admin': [
    { group: 'Institute', items: [
      { id: 'institute-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'branches', name: 'Branches', icon: Network, color: 'from-primary to-primary/80' },
      { id: 'institute-royalty', name: 'Royalty Management', icon: DollarSign, color: 'from-primary to-primary/80' },
      { id: 'institute-fees', name: 'Fee Management', icon: CreditCard, color: 'from-primary to-primary/80' },
      { id: 'institute-teachers', name: 'Teachers & Salaries', icon: Users, color: 'from-primary to-primary/80' },
      { id: 'institute-students', name: 'Students', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'institute-academics', name: 'Academics', icon: BookOpen, color: 'from-primary/80 to-primary' },
      { id: 'institute-reports', name: 'Reports', icon: TrendingUp, color: 'from-primary/80 to-primary' },
      { id: 'online-admissions', name: 'Online Admissions', icon: UserPlus, color: 'from-emerald-500 to-teal-600' },
      { id: 'complaint-portal', name: 'Complaint Portal', icon: AlertTriangle, color: 'from-rose-500 to-orange-600' },
      { id: 'institute-events', name: 'Events', icon: Trophy, color: 'from-primary/80 to-primary' },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-primary/80 to-primary' },
    ]},
  ],
  'branch-manager': [
    { group: 'Branch', items: [
      { id: 'branch-overview', name: 'Branch Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'teachers', name: 'Teachers', icon: Users, color: 'from-primary to-primary/80' },
      { id: 'branch-students', name: 'Students', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'class-courses', name: 'Classes & Courses', icon: BookOpen, color: 'from-primary/80 to-primary' },
      { id: 'online-admissions', name: 'Online Admissions', icon: UserPlus, color: 'from-emerald-500 to-teal-600' },
      { id: 'digital-id', name: 'Digital ID Center', icon: IdCard, color: 'from-rose-500 to-pink-600' },
      { id: 'health-records', name: 'Health Records', icon: HeartPulse, color: 'from-red-500 to-rose-600' },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Academics', items: [
      { id: 'attendance', name: 'Attendance', icon: CalendarCheck, color: 'from-primary/80 to-primary' },
      { id: 'results', name: 'Results', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'report-cards', name: 'Report Cards', icon: Award, color: 'from-primary to-primary/80' },
      { id: 'timetable', name: 'Timetable', icon: Calendar, color: 'from-primary/80 to-primary' },
      { id: 'exam-portal', name: 'Exam Portal', icon: FileCheck, color: 'from-[#FF8C42] to-[#F26522]' },
      { id: 'e-learning', name: 'E-Learning Hub', icon: Video, color: 'from-violet-500 to-fuchsia-600' },
    ]},
    { group: 'Operations', items: [
      { id: 'fees', name: 'Fees', icon: DollarSign, color: 'from-primary/80 to-primary' },
      { id: 'live-transport', name: 'Live Transport', icon: Navigation, color: 'from-emerald-500 to-teal-600' },
      { id: 'ptm-scheduling', name: 'PTM Scheduling', icon: Video, color: 'from-cyan-500 to-teal-600' },
      { id: 'complaint-portal', name: 'Complaint Portal', icon: AlertTriangle, color: 'from-rose-500 to-orange-600' },
      { id: 'events', name: 'Events', icon: Trophy, color: 'from-primary/80 to-primary' },
      { id: 'sms', name: 'SMS Portal', icon: MessageSquare, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-primary/80 to-primary' },
    ]},
  ],
  'teacher': [
    { group: 'Teaching', items: [
      { id: 'teacher-dashboard', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'teacher-overview', name: 'My Classes', icon: BookOpen, color: 'from-primary to-primary/80' },
      { id: 'e-learning', name: 'E-Learning Hub', icon: Video, color: 'from-violet-500 to-fuchsia-600' },
      { id: 'exam-portal', name: 'Exam Portal', icon: FileCheck, color: 'from-[#FF8C42] to-[#F26522]' },
      { id: 'diary', name: 'Diary & Homework', icon: ClipboardList, color: 'from-primary/80 to-primary' },
      { id: 'timetable', name: 'My Timetable', icon: Calendar, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Communication', items: [
      { id: 'announcements', name: 'Announcements', icon: Bell, color: 'from-primary/80 to-primary' },
      { id: 'complaint-portal', name: 'Complaint Portal', icon: AlertTriangle, color: 'from-rose-500 to-orange-600' },
      { id: 'sms', name: 'SMS Portal', icon: MessageSquare, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-primary/80 to-primary' },
    ]},
  ],
  'student': [
    { group: 'My Portal', items: [
      { id: 'student-overview', name: 'My Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'my-courses', name: 'My Courses', icon: BookOpen, color: 'from-primary to-primary/80' },
      { id: 'e-learning', name: 'E-Learning Hub', icon: Video, color: 'from-violet-500 to-fuchsia-600' },
      { id: 'exam-portal', name: 'Exam Portal', icon: FileCheck, color: 'from-[#FF8C42] to-[#F26522]' },
      { id: 'digital-id', name: 'Digital ID', icon: IdCard, color: 'from-rose-500 to-pink-600' },
      { id: 'campus-wallet', name: 'Campus Wallet', icon: Wallet, color: 'from-amber-500 to-yellow-600' },
      { id: 'my-attendance', name: 'My Attendance', icon: CalendarCheck, color: 'from-primary/80 to-primary' },
      { id: 'my-results', name: 'My Results', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'my-report-card', name: 'Report Card', icon: Award, color: 'from-primary to-primary/80' },
      { id: 'my-invoices', name: 'Invoices', icon: CreditCard, color: 'from-primary/80 to-primary' },
      { id: 'my-timetable', name: 'My Timetable', icon: Calendar, color: 'from-primary/80 to-primary' },
      { id: 'my-diary', name: 'Diary & Homework', icon: ClipboardList, color: 'from-primary/80 to-primary' },
      { id: 'my-announcements', name: 'Announcements', icon: Bell, color: 'from-primary/80 to-primary' },
      { id: 'complaint-portal', name: 'Complaint Portal', icon: AlertTriangle, color: 'from-rose-500 to-orange-600' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-primary/80 to-primary' },
    ]},
  ],
  'parent': [
    { group: 'My Portal', items: [
      { id: 'student-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'my-results', name: 'Results', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'my-report-card', name: 'Report Card', icon: Award, color: 'from-primary to-primary/80' },
      { id: 'my-attendance', name: 'Attendance', icon: CalendarCheck, color: 'from-primary/80 to-primary' },
      { id: 'my-announcements', name: 'Announcements', icon: Bell, color: 'from-primary/80 to-primary' },
      { id: 'my-timetable', name: 'Timetable', icon: Calendar, color: 'from-primary/80 to-primary' },
      { id: 'complaint-portal', name: 'Complaint Portal', icon: AlertTriangle, color: 'from-rose-500 to-orange-600' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-primary/80 to-primary' },
    ]},
  ],
};

export const roleAccent: Record<string, { from: string; to: string; text: string; bg: string }> = {
  'super-admin': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'admin': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'admissions': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'accountant': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'academic': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'institute-admin': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'branch-manager': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'teacher': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'student': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'parent': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
};
