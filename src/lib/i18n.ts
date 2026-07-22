// Bilingual UI strings (English + Urdu) for ESM web app.
// PGC competitor only ships English UI — Urdu toggle is a key differentiator.
//
// Usage:
//   import { t, useT } from '@/lib/i18n';
//   const tr = useT(); // inside a React component, returns the right dict based on store.language
//   <h1>{tr.modules.dashboard}</h1>

import { useApp } from './store';

export type Lang = 'en' | 'ur';

// ---- Module name translations (keyed by module id) ----
export const MODULE_NAMES: Record<string, { en: string; ur: string }> = {
  // Existing modules
  'platform-overview': { en: 'Dashboard', ur: 'ڈیش بورڈ' },
  'institutes': { en: 'Institutes', ur: 'ادارے' },
  'platform-analytics': { en: 'Analytics', ur: 'تجزیات' },
  'announcements': { en: 'Announcements', ur: 'اعلانات' },
  'config': { en: 'Platform Config', ur: 'پلیٹ فارم ترتیب' },
  'branding': { en: 'Branding', ur: 'برانڈنگ' },
  'settings': { en: 'Settings', ur: 'ترتیبات' },

  'institute-overview': { en: 'Dashboard', ur: 'ڈیش بورڈ' },
  'branches': { en: 'Branches', ur: 'شاخیں' },
  'institute-royalty': { en: 'Royalty Management', ur: 'رائلٹی مینجمنٹ' },
  'institute-fees': { en: 'Fee Management', ur: 'فیس مینجمنٹ' },
  'institute-teachers': { en: 'Teachers & Salaries', ur: 'اساتذہ و تنخواہیں' },
  'institute-students': { en: 'Students', ur: 'طلبہ' },
  'institute-academics': { en: 'Academics', ur: 'تعلیمی امور' },
  'institute-reports': { en: 'Reports', ur: 'رپورٹس' },
  'institute-complaints': { en: 'Complaints', ur: 'شکایات' },
  'institute-events': { en: 'Events', ur: 'تقریبات' },

  'branch-overview': { en: 'Branch Dashboard', ur: 'شاخ ڈیش بورڈ' },
  'teachers': { en: 'Teachers', ur: 'اساتذہ' },
  'branch-students': { en: 'Students', ur: 'طلبہ' },
  'class-courses': { en: 'Classes & Courses', ur: 'کلاسز و کورسز' },
  'attendance': { en: 'Attendance', ur: 'حاضری' },
  'results': { en: 'Results', ur: 'نتائج' },
  'report-cards': { en: 'Report Cards', ur: 'رپورٹ کارڈز' },
  'timetable': { en: 'Timetable', ur: 'ٹائم ٹیبل' },
  'fees': { en: 'Fees', ur: 'فیس' },
  'complaints': { en: 'Complaints', ur: 'شکایات' },
  'events': { en: 'Events', ur: 'تقریبات' },
  'sms': { en: 'SMS Portal', ur: 'ایس ایم ایس پورٹل' },

  'teacher-dashboard': { en: 'Dashboard', ur: 'ڈیش بورڈ' },
  'teacher-overview': { en: 'My Classes', ur: 'میری کلاسز' },
  'diary': { en: 'Diary & Homework', ur: 'ڈائری و ہوم ورک' },

  'student-overview': { en: 'My Dashboard', ur: 'میرا ڈیش بورڈ' },
  'my-courses': { en: 'My Courses', ur: 'میرے کورسز' },
  'my-attendance': { en: 'My Attendance', ur: 'میری حاضری' },
  'my-results': { en: 'My Results', ur: 'میرے نتائج' },
  'my-report-card': { en: 'Report Card', ur: 'رپورٹ کارڈ' },
  'my-invoices': { en: 'Invoices', ur: 'انوائسز' },
  'my-timetable': { en: 'My Timetable', ur: 'میرا ٹائم ٹیبل' },
  'my-diary': { en: 'Diary & Homework', ur: 'ڈائری و ہوم ورک' },
  'my-announcements': { en: 'Announcements', ur: 'اعلانات' },

  'parent-overview': { en: 'Ward Dashboard', ur: 'وارڈ ڈیش بورڈ' },
  'ward-attendance': { en: 'Attendance', ur: 'حاضری' },
  'ward-results': { en: 'Results', ur: 'نتائج' },
  'ward-fees': { en: 'Pay Fees', ur: 'فیس ادا کریں' },
  'ward-diary': { en: 'Diary', ur: 'ڈائری' },

  // New v1.5.0 modules
  'ai-tutor': { en: 'AI Tutor', ur: 'اے آئی ٹیوٹر' },
  'live-transport': { en: 'Live Transport', ur: 'لائیو ٹرانسپورٹ' },
  'digital-id': { en: 'Digital ID', ur: 'ڈیجیٹل آئی ڈی' },
  'campus-wallet': { en: 'Campus Wallet', ur: 'کیمپس والٹ' },
  'ptm-scheduling': { en: 'PTM Scheduling', ur: 'پی ٹی ایم شیڈولنگ' },
  'health-records': { en: 'Health Records', ur: 'ہیلتھ ریکارڈز' },
};

// ---- Sidebar group name translations (keyed by English group name) ----
export const GROUP_NAMES: Record<string, { en: string; ur: string }> = {
  'Platform': { en: 'Platform', ur: 'پلیٹ فارم' },
  'System': { en: 'System', ur: 'سسٹم' },
  'Account': { en: 'Account', ur: 'اکاؤنٹ' },
  'Institute': { en: 'Institute', ur: 'ادارہ' },
  'Branch': { en: 'Branch', ur: 'شاخ' },
  'Academics': { en: 'Academics', ur: 'تعلیمی امور' },
  'Operations': { en: 'Operations', ur: 'آپریشنز' },
  'Teaching': { en: 'Teaching', ur: 'تدریس' },
  'Communication': { en: 'Communication', ur: 'مواصلات' },
  'My Portal': { en: 'My Portal', ur: 'میرا پورٹل' },
  'My Ward': { en: 'My Ward', ur: 'میرا وارڈ' },
};

// ---- Generic UI strings ----
export const STRINGS = {
  // Header
  search: { en: 'Search…', ur: 'تلاش کریں…' },
  openCommandPalette: { en: 'Open command palette', ur: 'کمانڈ پیلیٹ کھولیں' },
  toggleTheme: { en: 'Toggle theme', ur: 'تھیم بدلیں' },
  toggleLanguage: { en: 'Toggle language', ur: 'زبان بدلیں' },
  notifications: { en: 'Notifications', ur: 'اطلاعات' },
  noNotifications: { en: 'No notifications', ur: 'کوئی اطلاع نہیں' },
  allCaughtUp: { en: "You're all caught up.", ur: 'آپ سب مکمل کر چکے ہیں۔' },
  closeNotifications: { en: 'Close notifications', ur: 'اطلاعات بند کریں' },

  // Sidebar groups
  // Sidebar groups — translated via GROUP_NAMES lookup, not STRINGS
  // (kept here for reference only — see GROUP_NAMES above)

  // Onboarding tips
  tipSidebar: { en: 'Click any module in the sidebar to jump straight to that feature.', ur: 'کسی بھی فیچر پر جانے کے لیے سائیڈبار میں موجود ماڈیول پر کلک کریں۔' },
  tipCmdk: { en: 'Use Cmd+K (or Ctrl+K) to open the command palette and search anything.', ur: 'کمانڈ پیلیٹ کھولنے اور کچھ بھی تلاش کرنے کے لیے Cmd+K (یا Ctrl+K) استعمال کریں۔' },
  tipHelp: { en: 'Hover over any field label to see help text.', ur: 'ہیلپ ٹیکسٹ دیکھنے کے لیے کسی بھی فیلڈ لیبل پر ماؤس لے جائیں۔' },
  tipLanguage: { en: 'Tap the EN/UR button in the header to switch between English and Urdu.', ur: 'انگریزی اور اردو کے درمیان تبدیل کرنے کے لیے ہیڈر میں EN/UR بٹن دبائیں۔' },

  // Common
  quickTip: { en: 'Quick Tip', ur: 'فوری مشورہ' },
  nextTip: { en: 'Next tip', ur: 'اگلا مشورہ' },
  gotIt: { en: 'Got it', ur: 'سمجھ گیا' },
  dismissTip: { en: 'Dismiss tip', ur: 'مشورہ مسترد کریں' },

  // Help widget
  helpSupport: { en: 'Help & Support', ur: 'مدد و معاونت' },
  helpQuickLinks: { en: 'Quick Links', ur: 'فوری روابط' },
  helpContactSupport: { en: 'Contact Support', ur: 'معاونت سے رابطہ' },
  helpDocumentation: { en: 'Documentation', ur: 'دستاویزات' },
  helpVideoTutorials: { en: 'Video Tutorials', ur: 'ویڈیو ٹیوٹوریلز' },
  helpReportIssue: { en: 'Report an Issue', ur: 'مسئلہ رپورٹ کریں' },
  helpKeyboardShortcuts: { en: 'Keyboard Shortcuts', ur: 'کی بورڈ شارٹ کٹس' },
  helpSearch: { en: 'Search help articles…', ur: 'مدد مضامین تلاش کریں…' },
} as const;

export type StringKey = keyof typeof STRINGS;

// Get module name in current language
export function moduleName(id: string, lang: Lang): string {
  const entry = MODULE_NAMES[id];
  if (!entry) return id;
  return entry[lang];
}

// Get group name in current language
export function groupName(name: string, lang: Lang): string {
  const entry = GROUP_NAMES[name];
  if (!entry) return name;
  return entry[lang];
}

// Get UI string in current language
export function str(key: StringKey, lang: Lang): string {
  return STRINGS[key][lang];
}

// React hook: returns current lang + bound helpers
export function useT() {
  const language = useApp((s) => s.language);
  return {
    lang: language,
    isUrdu: language === 'ur',
    isEnglish: language === 'en',
    mod: (id: string) => moduleName(id, language),
    group: (name: string) => groupName(name, language),
    s: (key: StringKey) => str(key, language),
  };
}
