// eSM module catalog — used by landing page and dashboard sidebar
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, PhoneCall, UserPlus, CalendarCheck, GraduationCap, BookOpen,
  DollarSign, Landmark, MessageSquare, MessageCircleWarning, Trophy, Library, Bus,
  Building2, Users, Boxes, Network, Settings, ShieldCheck, Palette, Compass,
  Navigation, IdCard, Wallet, Video, HeartPulse, FileCheck, AlertTriangle,
} from 'lucide-react';

export type ModuleDef = {
  id: string;
  name: string;
  short: string;
  icon: LucideIcon;
  group: string;
  color: string; // tailwind gradient classes
  tagline: string;
  features: string[];
};

export const MODULES: ModuleDef[] = [
  { id: 'dashboard', name: 'Central Dashboard', short: 'Dashboard', icon: LayoutDashboard, group: 'Overview', color: 'from-primary to-primary/80', tagline: 'One screen, every signal that matters', features: ['Live KPIs', 'Enrollment trends', 'Revenue & attendance', 'Quick actions'] },
  { id: 'inquiry', name: 'Inquiry Management', short: 'Inquiry', icon: PhoneCall, group: 'Admissions', color: 'from-amber-500 to-orange-600', tagline: 'Turn curiosity into enrollments', features: ['Inquiry database', 'Follow-up tracking', 'Mature/immature reports', 'Admission test status', 'SMS follow-ups'] },
  { id: 'admission', name: 'Admission Management', short: 'Admission', icon: UserPlus, group: 'Admissions', color: 'from-primary to-primary/80', tagline: 'Onboard students in minutes', features: ['Online admission form', 'Sibling records', 'Student ID cards', 'Area & class comparison', 'Certificate issuance'] },
  { id: 'attendance', name: 'Attendance Management', short: 'Attendance', icon: CalendarCheck, group: 'Academics', color: 'from-primary/80 to-primary', tagline: 'Track presence, smartly', features: ['Thumb impression', 'RFID & barcode', 'Latecomers report', 'Daily summary', 'Auto absent SMS'] },
  { id: 'results', name: 'Results Management', short: 'Results', icon: GraduationCap, group: 'Academics', color: 'from-primary to-primary/70', tagline: 'Insights that lift performance', features: ['Weekly/monthly tests', 'Pre-board & send-up', 'Subject-wise reports', 'Progress comparison', 'Digital result cards'] },
  { id: 'academics', name: 'Academics', short: 'Academics', icon: BookOpen, group: 'Academics', color: 'from-primary/80 to-primary', tagline: 'The full academic lifecycle', features: ['Dossier settings', 'Promote / transfer / pass-out', 'Lesson & course plans', 'Diary & homework', 'Teacher timetable'] },
  { id: 'fee', name: 'Fee Management', short: 'Fees', icon: DollarSign, group: 'Finance', color: 'from-amber-500 to-yellow-600', tagline: 'Streamline finances, elevate excellence', features: ['Voucher system', 'Online fee payment', 'Defaulter list', 'Class-wise analysis', 'Cashier-wise collection'] },
  { id: 'finance', name: 'Finance Management', short: 'Finance', icon: Landmark, group: 'Finance', color: 'from-yellow-600 to-amber-700', tagline: 'Financial clarity, school success', features: ['JV / CRV / CPV / BRV / BPV', 'Chart of accounts', 'Trial balance', 'P&L & balance sheet', 'Day book'] },
  { id: 'sms', name: 'SMS Portal', short: 'SMS', icon: MessageSquare, group: 'Communication', color: 'from-primary/80 to-primary', tagline: 'Branded alerts that reach everyone', features: ['Masked branded SMS', 'Auto event alerts', 'Fee & absent SMS', 'Bulk staff & student send', 'Delivery reports'] },
  { id: 'complaints', name: 'Complaint Management', short: 'Complaints', icon: MessageCircleWarning, group: 'Communication', color: 'from-primary to-primary/80', tagline: 'Two-way trust, resolved fast', features: ['Student & staff tracking', 'Two-way chat box', 'Priority routing', 'Status timeline', 'Resolution analytics'] },
  { id: 'events', name: 'Event Management', short: 'Events', icon: Trophy, group: 'Campus', color: 'from-amber-500 to-rose-600', tagline: 'Elevate every event with precision', features: ['Event types & activities', 'Assign students', 'Result & rankings', 'Prizes & positions', 'Calendar sync'] },
  { id: 'library', name: 'Library Management', short: 'Library', icon: Library, group: 'Campus', color: 'from-primary to-primary/80', tagline: 'Every book, accounted for', features: ['Vendor & cost records', 'Book barcodes', 'Issue / return', 'Lost book log', 'Purchase history'] },
  { id: 'transport', name: 'Transport Management', short: 'Transport', icon: Bus, group: 'Campus', color: 'from-primary/80 to-primary', tagline: 'Safe routes, on time', features: ['Vehicle details', 'Route mapping', 'Driver records', 'Payment tracking', 'Route-wise reports'] },
  { id: 'hostel', name: 'Hostel Management', short: 'Hostel', icon: Building2, group: 'Campus', color: 'from-primary/70 to-primary', tagline: 'Boarding, beautifully managed', features: ['Floor & room plans', 'Student documents', 'Bank details', 'Expense & revenue', 'Resident directory'] },
  { id: 'hr', name: 'HR Management', short: 'HR', icon: Users, group: 'Administration', color: 'from-primary to-primary/80', tagline: 'Elevate HR excellence', features: ['Departments & designations', 'Salary slips', 'Leave types', 'Fingerprint attendance', 'Birthday & joining reports'] },
  { id: 'assets', name: 'Fixed Assets', short: 'Assets', icon: Boxes, group: 'Administration', color: 'from-amber-600 to-yellow-700', tagline: 'Your asset excellence solution', features: ['Stock tracking', 'Consumable & non-consumable', 'Issue to departments', 'Date-wise reports', 'Inventory valuation'] },
  { id: 'franchise', name: 'Franchise Management', short: 'Franchise', icon: Network, group: 'Administration', color: 'from-primary to-primary/80', tagline: 'Scale your network confidently', features: ['Royalty management', 'Invoice creation', 'Collection reports', 'Per-student / fixed / %'] },
  { id: 'config', name: 'Configuration', short: 'Config', icon: Settings, group: 'Administration', color: 'from-primary/70 to-primary', tagline: 'Bespoke solutions with Concordia', features: ['Bank accounts', 'Campus settings', 'Session control', 'Class & section toggle', 'City / region setup'] },
  { id: 'users', name: 'User & Privileges', short: 'Users', icon: ShieldCheck, group: 'Administration', color: 'from-primary to-primary/70', tagline: 'Granular control, by design', features: ['Role creation', 'Login management', 'Activation toggle', 'Login audit trail', 'Permission matrix'] },
  { id: 'branding', name: 'Institute Branding', short: 'Branding', icon: Palette, group: 'Administration', color: 'from-primary to-primary/80', tagline: 'Empower, engage, excel', features: ['Branding types', 'Detail management', 'Mobile app sync', 'Campaign assets'] },
  { id: 'consultancy', name: 'Student Consultancy', short: 'Consultancy', icon: Compass, group: 'Administration', color: 'from-primary/80 to-primary', tagline: 'Transforming education, together', features: ['University details', 'Program catalog', 'Fee & admission info', 'Program duration'] },
  // --- v1.5.0 unique high-impact modules ---
  { id: 'live-transport', name: 'Live Transport Tracking', short: 'Live Transport', icon: Navigation, group: 'Campus', color: 'from-emerald-500 to-teal-600', tagline: 'Real-time bus tracking for students & staff', features: ['Live GPS map', 'ETA push notifications', 'Route deviation alerts', 'Pickup/drop status', 'Driver contact', 'Historical routes'] },
  { id: 'digital-id', name: 'Digital ID Center', short: 'Digital ID', icon: IdCard, group: 'Campus', color: 'from-rose-500 to-pink-600', tagline: 'Wallet-style digital student IDs', features: ['QR code check-in', 'Library card integration', 'Cafeteria wallet link', 'Exam hall verification', 'Lost card lock', 'Bulk ID generation'] },
  { id: 'campus-wallet', name: 'Campus Wallet', short: 'Wallet', icon: Wallet, group: 'Finance', color: 'from-amber-500 to-yellow-600', tagline: 'Cashless campus payments', features: ['Prepaid top-ups', 'Cafeteria & printing', 'Bookshop purchases', 'Auto-reload threshold', 'Spending insights', 'Transaction history'] },
  { id: 'ptm-scheduling', name: 'PTM Scheduling', short: 'PTM', icon: Video, group: 'Communication', color: 'from-cyan-500 to-teal-600', tagline: 'Schedule meeting slots with guardians', features: ['Meeting slot booking', 'Calendar invites', 'Auto reminders', 'Agenda notes', 'Multi-teacher slots', 'Recording archive'] },
  { id: 'health-records', name: 'Health Records', short: 'Health', icon: HeartPulse, group: 'Campus', color: 'from-red-500 to-rose-600', tagline: 'Student health & wellness', features: ['Medical history', 'Allergy alerts', 'Vaccination records', 'Infirmary visits log', 'Emergency contacts', 'BMI tracking'] },
  { id: 'online-admissions', name: 'Online Admissions', short: 'Online Admissions', icon: UserPlus, group: 'Admissions', color: 'from-emerald-500 to-teal-600', tagline: 'Full online admission portal — PGC parity', features: ['Admission stats dashboard', 'Application pipeline', 'Kanban workflow', 'Form builder', 'Admission calendar', 'Online payment integration'] },
  // --- PGC parity: E-Learning Hub ---
  { id: 'e-learning', name: 'E-Learning Hub', short: 'E-Learning', icon: Video, group: 'Academics', color: 'from-violet-500 to-fuchsia-600', tagline: '4,000+ video lectures, past papers & MCQ practice', features: ['Video lecture library', 'Past paper database', 'MCQ practice engine', 'Progress tracking', 'Performance analytics', 'Subject-wise filters'] },
  // --- PGC parity: Exam Portal ---
  { id: 'exam-portal', name: 'Exam Portal', short: 'Exams', icon: FileCheck, group: 'Academics', color: 'from-[#FF8C42] to-[#F26522]', tagline: 'Practice tests, upcoming exams & performance analytics', features: ['Upcoming exam schedule', 'Create practice tests', 'Past results & trends', 'Performance analytics', 'Answer key review', 'Countdown timer'] },
  // --- PGC parity: Complaint Portal ---
  { id: 'complaint-portal', name: 'Complaint Portal', short: 'Complaints', icon: AlertTriangle, group: 'Communication', color: 'from-rose-500 to-orange-600', tagline: 'Bilingual complaint tracking with two-way chat', features: ['Submit complaints', 'Two-way chat', 'Priority routing', 'Resolution timeline', 'Star rating feedback', 'Anonymous option'] },
];

export const MODULE_GROUPS = ['Overview', 'Admissions', 'Academics', 'Finance', 'Communication', 'Campus', 'Administration'];
