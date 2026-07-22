// Role-scoped module catalogs — each role sees a different sidebar
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Building2, Network, Users, DollarSign, TrendingUp, Settings, ShieldCheck,
  CalendarCheck, GraduationCap, BookOpen, MessageSquare, Library, Bus, Trophy, Landmark,
  ClipboardList, FileText, Bell, CreditCard, Calendar, MessageCircleWarning, Award, Crown,
  Navigation, IdCard, Wallet, Video, HeartPulse, FileCheck, AlertTriangle, UserPlus,
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

// Navy blue professional palette — clean, minimal, UCP/Odoo-inspired.
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
      { id: 'exam-portal', name: 'Exam Portal', icon: FileCheck, color: 'from-indigo-500 to-blue-600' },
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
      { id: 'exam-portal', name: 'Exam Portal', icon: FileCheck, color: 'from-indigo-500 to-blue-600' },
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
      { id: 'exam-portal', name: 'Exam Portal', icon: FileCheck, color: 'from-indigo-500 to-blue-600' },
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
};

export const roleAccent: Record<string, { from: string; to: string; text: string; bg: string }> = {
  'super-admin': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'institute-admin': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'branch-manager': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'teacher': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'student': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
};
