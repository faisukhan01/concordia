'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeBuoy, X, Send, Bot, User, Sparkles } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// Concordia College — In-App Assistant ("Concordia Bot")
//
// A fully hardcoded, offline chatbot. NO API calls, NO AI/LLM, NO network.
// Every response is pre-written and matched by a keyword-scoring algorithm.
//
// Knowledge covers all 7 portals:
//   Admin · Admissions · Accountant · Academic · Teacher · Student · Parent
// Plus owner/creator identity questions.
// ═══════════════════════════════════════════════════════════════════════════

type KBEntry = {
  id: string;
  keywords: string[];          // lowercased tokens/phrases to match
  question: string;            // display label (for suggested chips)
  answer: string;              // the hardcoded response
  category: 'owner' | 'general' | 'admin' | 'admissions' | 'accountant' | 'academic' | 'teacher' | 'student' | 'parent';
};

// ─────────────────────────── Knowledge Base ────────────────────────────────
const KB: KBEntry[] = [
  // ─── OWNER / CREATOR (highest priority — always answered the same way) ───
  {
    id: 'owner-1',
    keywords: ['who built', 'who made', 'who created', 'who developed', 'who designed', 'who wrote', 'who coded'],
    question: 'Who built you?',
    answer:
      'Faisal Khan built me and he is my official owner. 🎓\n\nYou can find him on Instagram: @faisu._khan01\nhttps://www.instagram.com/faisu._khan01/',
    category: 'owner',
  },
  {
    id: 'owner-2',
    keywords: ['owner', 'your owner', 'my owner', 'who owns', 'whose owner', 'owner name'],
    question: 'Who is your owner?',
    answer:
      'Faisal Khan is my official owner. He built me for Concordia College.\n\nInstagram: @faisu._khan01\nhttps://www.instagram.com/faisu._khan01/',
    category: 'owner',
  },
  {
    id: 'owner-3',
    keywords: ['creator', 'your creator', 'my creator', 'who is the creator', 'developer', 'your developer', 'maker', 'your maker'],
    question: 'Who is your creator?',
    answer:
      'Faisal Khan is my creator and official owner.\n\nInstagram: @faisu._khan01\nhttps://www.instagram.com/faisu._khan01/',
    category: 'owner',
  },
  {
    id: 'owner-4',
    keywords: ['faisal', 'khan', 'faisu', 'faisukhan', 'instagram', 'insta', 'social', 'contact developer', 'contact owner'],
    question: 'How to contact the owner?',
    answer:
      'Faisal Khan — my official owner and builder.\n\nInstagram: @faisu._khan01\nhttps://www.instagram.com/faisu._khan01/',
    category: 'owner',
  },
  {
    id: 'owner-5',
    keywords: ['what are you', 'who are you', 'your name', 'introduce yourself', 'about you', 'about yourself', 'what is your name', 'what can you do'],
    question: 'Who are you?',
    answer:
      "I'm the Concordia Assistant — a built-in guide for the Concordia College portal. I can help you navigate any portal: Admin, Admissions, Accountant, Academic Office, Teacher, Student, and Parent. Just ask me how to do something and I'll point you to the right place.\n\nI was built by Faisal Khan (Instagram: @faisu._khan01).",
    category: 'owner',
  },

  // ─── GENERAL (login, password, navigation) ───────────────────────────────
  {
    id: 'gen-login',
    keywords: ['login', 'log in', 'sign in', 'signin', 'how to login', 'how to sign in', 'cant login', 'cannot login'],
    question: 'How do I log in?',
    answer:
      'On the sign-in page, enter your username (email address) and password, then click "Login".\n\n• Admin → admin@concordia.edu.pk\n• Admissions → admissions@concordia.edu.pk\n• Accountant → accountant@concordia.edu.pk\n• Academic Office → academics@concordia.edu.pk\n\nStudents sign in with their Roll Number and the password the accountant issued. Teachers sign in with their Teacher ID and the issued password.',
    category: 'general',
  },
  {
    id: 'gen-password',
    keywords: ['password', 'forgot password', 'reset password', 'change password', 'lost password', 'new password'],
    question: 'How do I change or reset my password?',
    answer:
      "After logging in, go to Settings (gear icon in the sidebar) to change your password.\n\nIf you forgot your password, ask your portal administrator:\n• Students/Teachers → ask the Accountant to reset it from Create Logins.\n• Accountant/Admissions/Academics → ask the Admin.\n• Admin → contact the institute super-admin.",
    category: 'general',
  },
  {
    id: 'gen-shortcut',
    keywords: ['shortcut', 'keyboard', 'command palette', 'cmd k', 'ctrl k', 'hotkey'],
    question: 'Are there keyboard shortcuts?',
    answer:
      'Yes! Press ⌘K (Mac) or Ctrl+K (Windows) to open the Command Palette — you can jump to any module from there. Press ? to open this assistant. Press Esc to close any open dialog.',
    category: 'general',
  },
  {
    id: 'gen-sidebar',
    keywords: ['sidebar', 'menu', 'navigation', 'where is', 'find page', 'find module', 'how to navigate', 'how to go to'],
    question: 'How do I navigate between pages?',
    answer:
      'Use the sidebar on the left. Sections are grouped under collapsible headings (e.g. "CLASSES & ACADEMICS", "FINANCE"). Click a group to expand it, then click the page you want. You can also press ⌘K / Ctrl+K to search and jump directly.',
    category: 'general',
  },

  // ─── ADMIN PORTAL ────────────────────────────────────────────────────────
  {
    id: 'admin-overview',
    keywords: ['admin dashboard', 'admin overview', 'admin portal', 'what does admin do', 'admin role', 'admin can do'],
    question: 'What does the Admin portal do?',
    answer:
      "The Admin portal is the master control centre. From the dashboard you see total students, teachers, staff, and fee collection stats. The sidebar has three delegated sections:\n\n• ADMISSION OFFICE → enroll students + finalize base fee\n• ACCOUNTANT → fees, installments, charges, create logins, salary slips\n• ACADEMIC OFFICE → classes, timetable, result cards, teachers\n\nEach section opens the full sub-portal inside the admin view.",
    category: 'admin',
  },
  {
    id: 'admin-delegate',
    keywords: ['admin access admissions', 'admin access accountant', 'admin access academic', 'admin manage everything', 'admin all portals', 'admin sub portal'],
    question: 'Can the Admin access all sub-portals?',
    answer:
      "Yes. The Admin sidebar includes ADMISSION OFFICE, ACCOUNTANT, and ACADEMIC OFFICE sections. Click any module there (e.g. 'Result Cards' under ACADEMIC OFFICE) and the admin sees the exact same interface as that sub-portal — no separate login needed.",
    category: 'admin',
  },
  {
    id: 'admin-staff',
    keywords: ['admin staff', 'create institute', 'create branch', 'manage staff', 'office staff', 'admin staff list'],
    question: 'How does the Admin manage staff?',
    answer:
      "The Admin dashboard shows all office staff (admissions, accounts, academics). To create a new branch or institute-level staff member, use the super-admin or institute-admin flows. Branch-level staff (teachers, students) are created by the Accountant.",
    category: 'admin',
  },

  // ─── ADMISSIONS PORTAL ───────────────────────────────────────────────────
  {
    id: 'adm-enroll',
    keywords: ['enroll student', 'admit student', 'new student', 'new enrollment', 'register student', 'addmission', 'admission form', 'enroll new'],
    question: 'How do I enroll a new student?',
    answer:
      "Go to the Admissions portal → 'Enroll Student'. It's a 3-step form:\n\n1. Personal Info — name, father/guardian, contact, CNIC, DOB, address, previous result, photo.\n2. Academic Placement — pick the Program, Class, and Section. A roll number is auto-suggested from the class.\n3. Fee Summary — review the base fee; 'Lock Base Fee' to finalize it so the accountant can generate invoices.\n\nAfter completing, you'll see a confirmation screen with Print Receipt and Download PDF buttons.",
    category: 'admissions',
  },
  {
    id: 'adm-receipt',
    keywords: ['print receipt', 'download receipt', 'enrollment receipt', 'admission receipt', 'receipt pdf', 'enrollment pdf'],
    question: 'How do I print or download the enrollment receipt?',
    answer:
      "After completing the 3-step enrollment form, the confirmation screen shows two buttons:\n\n• 'Download PDF' — saves a branded receipt (with college logo) to your device.\n• 'Print Receipt' — opens the print dialog so you can print or save as PDF.\n\nYou can also click 'Enroll Another' to register the next student.",
    category: 'admissions',
  },
  {
    id: 'adm-class',
    keywords: ['admission class', 'admission section', 'admission program', 'pick class', 'select class admission', 'roll number admission', 'auto roll'],
    question: 'How is the class and roll number assigned?',
    answer:
      "In Step 2 (Academic Placement) of the enrollment form, select the Program, then the Class from the dropdown, then the Section. The roll number is auto-suggested based on the class you pick — you can override it if needed. The base fee is shown based on the selected class.",
    category: 'admissions',
  },
  {
    id: 'adm-basefee',
    keywords: ['base fee', 'lock base fee', 'admission fee', 'fee lock', 'finalize fee', 'base fee locked'],
    question: "What does 'Lock Base Fee' do?",
    answer:
      "Locking the base fee in Step 3 finalizes the student's monthly fee amount. Once locked, the accountant can generate monthly invoices and installments against that amount. This prevents accidental changes after enrollment. If the fee needs to change later, the accountant can unlock + relock it from the Fee & Installments page.",
    category: 'admissions',
  },

  // ─── ACCOUNTANT PORTAL ───────────────────────────────────────────────────
  {
    id: 'acc-overview',
    keywords: ['accountant portal', 'accountant do', 'accountant role', 'accountant can do', 'what does accountant'],
    question: 'What does the Accountant portal do?',
    answer:
      "The Accountant manages all money + login creation:\n\n• Dashboard — fee collection stats\n• Students (Class-wise) — view students grouped by class\n• Fee & Installments — set installment plans with manual dates, mark paid, download challans\n• Miscellaneous Charges — add charges (search student by name, custom 'Other' type)\n• Create Logins — issue Student + Teacher credentials\n• Salary Slips — generate + download staff salary PDFs",
    category: 'accountant',
  },
  {
    id: 'acc-installment',
    keywords: ['installment', 'installment date', 'set installment', 'fee installment', 'add installment', 'manual date', 'due date'],
    question: 'How do I set installment dates?',
    answer:
      "Go to Fee & Installments → select a student → scroll to the installment plan. Click 'Add Row' for each installment, enter the amount, and pick the due date manually (each installment has its own date picker). You can also use 'Quick split' to auto-divide the total into equal parts, then edit each date afterwards. Students see these installments + dates in their portal.",
    category: 'accountant',
  },
  {
    id: 'acc-challan',
    keywords: ['challan', 'fee challan', 'download challan', 'challan pdf', 'print challan', 'fee invoice pdf'],
    question: 'How do I download a fee challan?',
    answer:
      "In Fee & Installments, select the student, find the installment or monthly challan, and click the Download (PDF) button next to it. A branded challan with the college logo is saved to your device. Students can also download their own challans from their 'My Fees' page.",
    category: 'accountant',
  },
  {
    id: 'acc-misc',
    keywords: ['misc', 'miscellaneous', 'extra charge', 'additional charge', 'fine', 'other charge', 'sports fee', 'library fine'],
    question: 'How do I add a miscellaneous charge?',
    answer:
      "Go to Miscellaneous Charges. Type a student's name, roll number, or class in the search box to find them (students don't all show at once — you must search). Select the student, pick a Charge Type (or choose 'Other' to write a custom name like 'Sports Fee' or 'Trip Fee'), enter the amount, and click 'Add Charge'.",
    category: 'accountant',
  },
  {
    id: 'acc-teacher-login',
    keywords: ['create teacher login', 'teacher login', 'teacher credentials', 'teacher account', 'teacher password', 'create teacher', 'add teacher login'],
    question: 'How do I create a teacher login?',
    answer:
      "Go to Create Logins → Teacher Logins tab. Fill in Full Name, Teacher ID (e.g. T001), Email (optional — auto-generated if blank), and Password (optional — auto-generated if blank). Click 'Generate Login'. The system shows the username + auto-password. The teacher can sign in and change their password later.\n\nNote: the accountant ONLY creates credentials. Subjects and classes are assigned later by the Academic Office.",
    category: 'accountant',
  },
  {
    id: 'acc-student-login',
    keywords: ['create student login', 'student login', 'student credentials', 'student account', 'student password', 'create student', 'issue student login'],
    question: 'How do I create a student login?',
    answer:
      "Go to Create Logins → Student Logins tab. Students are created via the Admissions portal first. Once admitted, find the student in the list (they'll show 'Without Login' status), click 'Edit', and set their password. The username is their Roll Number. Students sign in with Roll Number + the password you set.",
    category: 'accountant',
  },
  {
    id: 'acc-duplicate-id',
    keywords: ['duplicate teacher id', 'duplicate roll number', 'id already exists', 'roll number already', 'teacher id already', 'duplicate id', 'id taken'],
    question: "Why am I getting a 'duplicate ID' error?",
    answer:
      "When creating or editing a teacher/student, the system checks that the Teacher ID or Roll Number isn't already used by someone else in your branch. If you see 'Duplicate Teacher ID' or 'Roll Number already exists', pick a different ID. The error message tells you exactly who is already using that ID.",
    category: 'accountant',
  },
  {
    id: 'acc-salary',
    keywords: ['salary', 'salary slip', 'payroll', 'staff salary', 'salary pdf', 'generate salary'],
    question: 'How do I generate a salary slip?',
    answer:
      "Go to Salary Slips → select the staff member → enter the month, basic salary, allowances, and deductions → click 'Generate'. A branded salary slip PDF with the college logo is generated. You can download or print it.",
    category: 'accountant',
  },

  // ─── ACADEMIC PORTAL ─────────────────────────────────────────────────────
  {
    id: 'aca-overview',
    keywords: ['academic portal', 'academic office', 'academic do', 'academic role', 'academic can do', 'what does academic'],
    question: 'What does the Academic Office portal do?',
    answer:
      "The Academic Office manages all academics:\n\n• Announcements — post notices to classes/audiences\n• Classes — create classes, assign teachers to classes\n• Timetable — create class timetables (with clash detection)\n• Date Sheets — schedule exam date sheets (you must create an exam first on the Exams page)\n• Exams — create every assessment (Monthly Tests, Midterm, Final, Quiz, etc.). Click an exam card to build its date sheet.\n• Result Cards — view class-wise test results + download PDFs\n• Teachers — manage teacher profiles + subject/class assignments",
    category: 'academic',
  },
  {
    id: 'aca-class',
    keywords: ['create class', 'add class', 'new class', 'manage class', 'class section', 'assign teacher class', 'class teacher'],
    question: 'How do I create a class and assign a teacher?',
    answer:
      "Go to Classes → 'Add Class' (single or bulk with multiple sections). To assign a teacher: click a class card to open its detail sheet → use the 'Assign Teacher' dropdown to pick a teacher → confirm. The teacher is now linked to that class and can mark attendance + enter marks for it.",
    category: 'academic',
  },
  {
    id: 'aca-timetable',
    keywords: ['timetable', 'create timetable', 'add timetable entry', 'schedule class', 'time table', 'period', 'lecture slot'],
    question: 'How do I create a timetable?',
    answer:
      "Go to Timetable → select the class from the dropdown → click 'Add Entry'. Pick the Day, Period, Subject, Teacher (optional), Start/End time, and Room. Click 'Save Entry'. The entry appears in the class timetable grid. You can add multiple entries per day.",
    category: 'academic',
  },
  {
    id: 'aca-clash',
    keywords: ['clash', 'timetable clash', 'teacher clash', 'class clash', 'time overlap', 'already has a lecture', 'already booked', 'double booking'],
    question: "Why am I getting a 'timetable clash' error?",
    answer:
      "The system prevents double-booking. There are 3 clash checks:\n\n1. CLASS clash — the class already has a lecture at that Day + Period. Delete the existing entry first if you want to change it.\n2. TEACHER clash — the teacher already has a lecture in another class at that Day + Period. Pick a different teacher, day, or period.\n3. TIME OVERLAP — the teacher has a lecture on the same day with overlapping start/end times. Adjust the times.\n\nThe error message tells you exactly which teacher/class/subject is conflicting.",
    category: 'academic',
  },
  {
    id: 'aca-result-cards',
    keywords: ['result card', 'result cards', 'class result', 'test result', 'view results', 'student result', 'result table'],
    question: 'How do I view result cards?',
    answer:
      "Go to Result Cards. It's a 3-level drill-down:\n\n1. CLASS GRID — every class shows as a card with student + test counts.\n2. TEST GRID — click a class to see all tests (Monthly Test 1, 2, …) that have submitted marks, with class averages.\n3. STUDENT TABLE — click a test to see every student in a row with columns: Roll #, Name, Father/Guardian, Father Contact, one column per subject (marks/total), Total, %, Grade, and a per-row Download PDF button.\n\nThe PDF is a branded result card with the college logo.",
    category: 'academic',
  },
  {
    id: 'aca-result-pdf',
    keywords: ['result card pdf', 'download result card', 'print result card', 'result pdf', 'generate result card'],
    question: "How do I download a student's result card PDF?",
    answer:
      "In Result Cards → open the class → open the test → find the student's row → click the 'Download' button at the end of the row. A branded PDF saves to your device with: college logo, student details (name, roll, father name, father contact, class), subject-wise marks table, total/percentage/grade, and a PASSED/FAILED status. Print-ready.",
    category: 'academic',
  },
  {
    id: 'aca-review-marks',
    keywords: ['review marks', 'where is review marks', 'review marks gone', 'review marks removed', 'marks review'],
    question: "Where is the 'Review Marks' page?",
    answer:
      "The 'Review Marks' page has been removed. Marks review now happens inside 'Result Cards' — open a class, open a test, and you'll see every student's subject-wise marks in one table. Teachers enter + lock their subject marks from their Teacher portal; the Academic Office reviews them here.",
    category: 'academic',
  },
  {
    id: 'aca-test',
    keywords: [
      'monthly test', 'create test', 'new test', 'test session', 'add test', 'test name',
      'create exam', 'add exam', 'new exam', 'exam name', 'final exam', 'midterm', 'mid term', 'quiz',
      'create monthly test', 'exams page', 'academic exam', 'exam type',
      // Phrase variants accounting for articles (a/an/the) so "how do I create an exam" matches.
      'create an exam', 'add an exam', 'new exam', 'create a exam', 'create the exam',
      'make an exam', 'make a exam', 'make exam', 'schedule exam', 'schedule an exam',
      'how do i create exam', 'how to create exam', 'how do i create an exam', 'how to create an exam',
    ],
    question: 'How do I create an exam or monthly test?',
    answer:
      "Go to the Exams page (sidebar → Classes & Academics → Exams). Enter the exam name (e.g. 'Monthly Test 1', 'Midterm 2026', 'Final Exam'), pick a Type (Monthly Test, Midterm, Final, Quiz, Assignment, Oral Test, Class Test, or Other), and click 'Create Exam'.\n\n• The exam appears instantly as a card on the same page.\n• You can't create two exams with the same name in your branch — the system blocks duplicates.\n• Click 'Build Date Sheet' on any exam card to jump to the Date Sheets page with that exam's name pre-filled.\n• Teachers will see the exam name in their marks-entry dropdown.",
    category: 'academic',
  },
  {
    id: 'aca-exam-duplicate',
    keywords: ['duplicate exam', 'same exam name', 'exam already exists', 'cannot create exam', 'exam name taken', 'duplicate test name', 'same test name'],
    question: "Why won't it let me create an exam with the same name?",
    answer:
      "Each exam name must be unique within your branch (checked case-insensitively). If you try to create 'Monthly Test 1' and one already exists, you'll see a 'Duplicate exam name' message. Pick a different name like 'Monthly Test 1 — Retake' or 'Monthly Test 2'. This keeps teacher marks, date sheets, and result cards tied to one unambiguous exam.",
    category: 'academic',
  },
  {
    id: 'aca-datesheet-gate',
    keywords: ['date sheet without exam', 'no exam date sheet', "can't create date sheet", 'create exam first', 'date sheet blocked', 'no exams yet', 'date sheet requires exam', 'date sheet needs exam'],
    question: "Why can't I create a date sheet?",
    answer:
      "Date sheets require at least one exam to exist first. If the Date Sheets page shows an amber 'Create an exam first' banner (or the 'New Date Sheet' button is disabled), go to the Exams page, create your Monthly Test / Midterm / Final, then return. When you click 'Build Date Sheet' on an exam card, the Date Sheets form opens automatically with that exam's name pre-selected.",
    category: 'academic',
  },
  {
    id: 'aca-datesheet',
    keywords: ['date sheet', 'datesheet', 'exam schedule', 'exam date', 'create datesheet', 'add datesheet'],
    question: 'How do I create a date sheet?',
    answer:
      "Easiest way: go to Exams → click 'Build Date Sheet' on an exam card. You'll land on the Date Sheets page with the exam name already filled in. Then add rows (Subject + Date + Time), enter the class, and click 'Publish Date Sheet'.\n\nYou can also open Date Sheets directly and click 'New Date Sheet' — but you must pick an existing exam from the dropdown. If no exams exist yet, the page shows an amber 'Create an exam first' banner. The published date sheet is visible to students in their portal.",
    category: 'academic',
  },
  {
    id: 'aca-teacher-assign',
    keywords: ['assign subject', 'assign teacher subject', 'teacher subject', 'teacher course', 'subject assignment', 'course assignment'],
    question: 'How do I assign subjects to a teacher?',
    answer:
      "Go to Teachers → find the teacher → click Edit → add subjects (comma-separated) and classes. Or open a class from the Classes page → use 'Assign Teacher' to link a teacher to that class. The accountant does NOT assign subjects — only the Academic Office does.",
    category: 'academic',
  },

  // ─── TEACHER PORTAL ──────────────────────────────────────────────────────
  {
    id: 'tea-overview',
    keywords: ['teacher portal', 'teacher do', 'teacher role', 'teacher can do', 'what does teacher'],
    question: 'What does the Teacher portal do?',
    answer:
      "Teachers can:\n\n• Dashboard — overview of classes + pending tasks\n• My Classes — see assigned classes + students\n• Course Materials — upload notes/links for students\n• Attendance — mark daily attendance per class\n• Test Results — enter + lock subject-wise marks per test\n• Diary — post diary notes for students/parents",
    category: 'teacher',
  },
  {
    id: 'tea-marks',
    keywords: ['enter marks', 'add marks', 'submit marks', 'lock marks', 'test results teacher', 'marks entry', 'grade student', 'mark student'],
    question: 'How do I enter and lock marks?',
    answer:
      "Go to Test Results → pick the Test name, your Class, and the Subject → enter each student's obtained marks in the table → click 'Submit to Academic Office'. Marks must be between 0 and the total. Once submitted, they're locked and appear in the Academic Office's Result Cards view. You can't edit after submitting — contact the Academic Office if you need a correction.",
    category: 'teacher',
  },
  {
    id: 'tea-attendance',
    keywords: ['attendance', 'mark attendance', 'take attendance', 'present absent', 'daily attendance'],
    question: 'How do I mark attendance?',
    answer:
      "Go to Attendance → select your class → today's date is shown by default → mark each student Present/Absent → click 'Save Attendance'. You can navigate to past dates to view or edit previous attendance.",
    category: 'teacher',
  },
  {
    id: 'tea-materials',
    keywords: ['course material', 'upload notes', 'study material', 'upload pdf', 'share notes', 'materials'],
    question: 'How do I upload course materials?',
    answer:
      "Go to Course Materials → 'Add Material' → pick the class + subject → choose a file (PDF, image, etc.) or paste a link (YouTube, Google Drive) → add a title → click 'Upload'. Students in that class can see and download/view the material from their portal.",
    category: 'teacher',
  },
  {
    id: 'tea-diary',
    keywords: ['diary', 'diary note', 'post diary', 'student diary', 'homework note', 'parent note'],
    question: 'How do I post a diary note?',
    answer:
      "Go to Diary → 'New Entry' → select the class (and optionally a specific student) → write the note (homework, reminder, message) → click 'Post'. Students + parents see diary notes in their portal.",
    category: 'teacher',
  },

  // ─── STUDENT PORTAL ──────────────────────────────────────────────────────
  {
    id: 'stu-overview',
    keywords: ['student portal', 'student do', 'student role', 'student can do', 'what does student'],
    question: 'What does the Student portal do?',
    answer:
      "Students can:\n\n• Dashboard — overview of attendance, fees, results\n• My Fees — view installments + due dates, download challan PDFs\n• My Results — view test results + report cards\n• My Attendance — attendance history\n• Course Materials — download notes/materials\n• Diary — view teacher diary notes",
    category: 'student',
  },
  {
    id: 'stu-fees',
    keywords: ['my fees', 'student fees', 'view fees', 'installment student', 'student challan', 'download challan student'],
    question: 'How do I view my fees and download a challan?',
    answer:
      "Go to 'My Fees' in the sidebar. You'll see a KPI strip (Total Payable / Paid / Outstanding) and a table of installments with their due dates. Click the 'Download PDF' button next to any installment to get a branded fee challan with the college logo. If your fee isn't showing, your base fee may not be locked yet — ask the Admissions Office or Accountant.",
    category: 'student',
  },
  {
    id: 'stu-results',
    keywords: ['my results', 'student result', 'view results student', 'my marks', 'my grades', 'report card student'],
    question: 'How do I view my results?',
    answer:
      "Go to 'My Results' in the sidebar. You'll see your test results once your teachers have submitted + locked marks and the Academic Office has generated result cards. If results aren't showing, your teachers may not have submitted marks yet — check back later or ask your teacher.",
    category: 'student',
  },
  {
    id: 'stu-login',
    keywords: ['student login', 'student sign in', 'student password', 'how to login student', 'student credentials', 'forgot student password'],
    question: 'How do I sign in as a student?',
    answer:
      "Your username is your Roll Number (e.g. STU-2026-001). Your password is set by the Accountant when they create your login. If you don't know your password, ask the Accountant to reset it from Create Logins → Student Logins. You can change your password anytime from Settings after logging in.",
    category: 'student',
  },

  // ─── PARENT PORTAL ───────────────────────────────────────────────────────
  {
    id: 'par-overview',
    keywords: ['parent portal', 'parent do', 'parent role', 'parent can do', 'what does parent', 'ward', 'child'],
    question: 'What does the Parent portal do?',
    answer:
      "Parents can monitor their ward (child):\n\n• Dashboard — ward's attendance + fee summary\n• My Fees — ward's installments + challan downloads\n• My Results — ward's test results\n• Diary — teacher diary notes\n\nParents see the same information as the student, labelled 'Your child's …'.",
    category: 'parent',
  },
];

// ─────────────────────────── Matching Engine ───────────────────────────────
// Pure keyword scoring. NO AI, NO API, NO network. Returns the best KB entry
// for a given user message, or null if nothing matches (score 0).

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Stopwords stripped from BOTH the message and multi-word keywords so that
// "how do I create an exam" matches the keyword "create exam". This makes the
// bot forgiving of natural phrasing without needing every variant hardcoded.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'do', 'does', 'did', 'i', 'you', 'we', 'they', 'he', 'she',
  'how', 'to', 'can', 'could', 'would', 'should', 'is', 'are', 'am', 'was',
  'were', 'be', 'been', 'my', 'your', 'our', 'their', 'me', 'him', 'her',
  'please', 'in', 'on', 'at', 'for', 'of', 'with', 'and', 'or', 'as', 'by',
  'this', 'that', 'these', 'those', 'it', 'its',
]);

function stripStopwords(s: string): string {
  return s.split(' ').filter(w => !STOPWORDS.has(w)).join(' ');
}

function scoreEntry(entry: KBEntry, msgWords: Set<string>, msgText: string, msgTextNoStop: string): number {
  let score = 0;
  for (const kw of entry.keywords) {
    if (kw.includes(' ')) {
      // Multi-word keyword → substring match on the full normalized message,
      // AND a second pass with stopwords stripped from both sides so
      // "create exam" matches "create an exam".
      if (msgText.includes(kw)) {
        score += 3; // phrase match = strong signal
      } else if (msgTextNoStop.includes(stripStopwords(kw))) {
        score += 2; // stopword-stripped phrase match = medium signal
      }
    } else {
      // Single-word keyword → exact token match.
      if (msgWords.has(kw)) score += 1;
    }
  }
  return score;
}

function findBest(userMessage: string): { entry: KBEntry | null; score: number } {
  const norm = normalize(userMessage);
  if (!norm) return { entry: null, score: 0 };
  const msgWords = new Set(norm.split(' '));
  const msgTextNoStop = stripStopwords(norm);
  let best: KBEntry | null = null;
  let bestScore = 0;
  for (const entry of KB) {
    const s = scoreEntry(entry, msgWords, norm, msgTextNoStop);
    if (s > bestScore) { bestScore = s; best = entry; }
  }
  return { entry: best, score: bestScore };
}

// ─────────────────────────── Small Talk Engine ─────────────────────────────
// Handles greetings (hi/hello/hey), thanks, bye, and common pleasantries so
// the bot feels like a real assistant instead of going straight to the
// "I'm not sure I caught that" fallback. Runs BEFORE the knowledge base.
type SmallTalk = {
  id: string;
  // Tokens that trigger this reply (matched as whole words in the normalized
  // message). Order matters only for readability.
  triggers: string[];
  // Single reply OR a pick-list (rotates for variety so the bot doesn't
  // feel robotic when greeted multiple times).
  replies: string[];
  // If true, we still ALSO scan the KB afterwards (e.g. "hi" alone → stop,
  // but "hi how do I enroll" → greeting + answer). For pure pleasantries we
  // stop, since the user isn't asking a portal question.
  continueToKB?: boolean;
};

const SMALL_TALK: SmallTalk[] = [
  {
    id: 'greet',
    triggers: ['hi', 'hello', 'hey', 'salam', 'assalam', 'aoa', 'assalamualaikum', 'salaam', 'hola', 'yo', 'hiya', 'heyy', 'hii', 'hiii'],
    replies: [
      "Hi there! 👋 I'm the Concordia Assistant. How can I help you with the portal today?",
      "Hello! 😊 What would you like to do — enroll a student, check fees, enter marks, or something else?",
      "Hey! I can guide you through any portal (Admin, Admissions, Accountant, Academic, Teacher, Student, Parent). What do you need?",
      "Salam! Welcome to Concordia. Tell me what you're trying to do and I'll point you to the right page.",
    ],
  },
  {
    id: 'good-morning',
    triggers: ['good morning', 'gm', 'morning'],
    replies: [
      "Good morning! ☀️ What can I help you with today?",
      "Morning! Ready to get started? Ask me anything about the portal.",
    ],
  },
  {
    id: 'good-afternoon',
    triggers: ['good afternoon', 'afternoon'],
    replies: ["Good afternoon! How can I assist you with the portal?"],
  },
  {
    id: 'good-evening',
    triggers: ['good evening', 'evening'],
    replies: ["Good evening! What would you like help with?"],
  },
  {
    id: 'how-are-you',
    triggers: ['how are you', 'how r u', 'how are u', 'hows it going', 'how is it going', "how's it going", 'whats up', "what's up", 'wassup', 'sup'],
    replies: [
      "I'm doing great, thanks for asking! 😄 I'm always ready to help you navigate the portal. What do you need?",
      "All good here! I'm a built-in guide, so I'm always on duty. How can I help you today?",
    ],
  },
  {
    id: 'thanks',
    triggers: ['thanks', 'thank you', 'thx', 'ty', 'thanku', 'thanku so much', 'appreciate', 'appreciate it', 'grateful', 'cheers'],
    replies: [
      "You're welcome! 😊 Anything else I can help with?",
      "Happy to help! Let me know if you need anything else.",
      "Anytime! I'm here whenever you need guidance.",
    ],
  },
  {
    id: 'welcome',
    triggers: ["you're welcome", 'your welcome', 'no problem', 'np'],
    replies: ["😊 What else can I help you with?"],
  },
  {
    id: 'bye',
    triggers: ['bye', 'goodbye', 'see you', 'see ya', 'cya', 'good night', 'goodnight', 'later', 'farewell'],
    replies: [
      "Goodbye! 👋 Come back anytime you need help with the portal.",
      "See you later! Have a great day. 😊",
      "Bye for now! I'll be right here when you need me.",
    ],
  },
  {
    id: 'ok',
    triggers: ['ok', 'okay', 'okk', 'kk', 'got it', 'understood', 'sounds good', 'great', 'nice', 'cool'],
    replies: [
      "Great! Let me know if you need help with anything else.",
      "👍 Anything else I can help with?",
    ],
  },
  {
    id: 'yes',
    triggers: ['yes', 'yeah', 'yep', 'yup', 'sure', 'of course'],
    replies: ["Great — tell me what you'd like to do and I'll guide you."],
  },
  {
    id: 'no',
    triggers: ['no', 'nope', 'nah', 'not really'],
    replies: ["No problem! I'm here if you need anything else. 😊"],
  },
  {
    id: 'help',
    triggers: ['help', 'help me', 'i need help', 'can you help', 'can u help', 'assist', 'assistance', 'support', 'stuck', 'confused', 'lost', 'dont know', "don't know", 'not sure'],
    replies: [
      "Of course! I can help with anything in the portal — Admissions, Accountant, Academic, Teacher, Student, or Parent. Tell me what you're trying to do, or tap a suggestion below.",
      "I'm here to help! 😊 What are you trying to do? You can ask me things like 'How do I enroll a student?' or 'How do I view result cards?'.",
    ],
  },
];

// Rotating index for each small-talk id so the same greeting doesn't repeat.
const smallTalkRotation: Record<string, number> = {};

function matchSmallTalk(userMessage: string): string | null {
  const norm = normalize(userMessage);
  if (!norm) return null;
  const words = new Set(norm.split(' '));

  for (const st of SMALL_TALK) {
    let hit = false;
    for (const trig of st.triggers) {
      if (trig.includes(' ')) {
        // Multi-word trigger → substring match.
        if (norm.includes(trig)) { hit = true; break; }
      } else {
        if (words.has(trig)) { hit = true; break; }
      }
    }
    if (hit) {
      const i = smallTalkRotation[st.id] || 0;
      const reply = st.replies[i % st.replies.length];
      smallTalkRotation[st.id] = (i + 1) % st.replies.length;
      return reply;
    }
  }
  return null;
}

// ─────────────────────────── Suggested Questions ───────────────────────────
// Shown as chips below the welcome message. Intentionally does NOT include
// "Who built you?" — owner questions are answered when asked directly, but
// we don't proactively suggest them. The focus is portal help.
const SUGGESTIONS = [
  'How do I enroll a student?',
  'How do I create an exam?',
  'How do I view result cards?',
  'How do I create a teacher login?',
  'How do I set installment dates?',
  'How do I enter marks as a teacher?',
  'How do I view my fees?',
  'Why am I getting a clash error?',
];

// ─────────────────────────── Chat Types ────────────────────────────────────
type Msg = { role: 'bot' | 'user'; text: string; ts: number };

const WELCOME: Msg = {
  role: 'bot',
  text:
    "Hi! I'm the Concordia Assistant 👋\n\nI can guide you through any portal — Admin, Admissions, Accountant, Academic, Teacher, Student, or Parent. Ask me how to do something, or tap a suggestion below.",
  ts: Date.now(),
};

const FALLBACK =
  "Hmm, I'm not sure about that one — but I can help with almost anything in the portal. Try asking me how to:\n\n• enroll a new student\n• create an exam or monthly test\n• view result cards\n• set fee installments\n• create a teacher login\n• enter marks (as a teacher)\n• view your fees or results\n• fix a timetable clash\n\nOr just tell me what you're trying to do in your own words.";

// ─────────────────────────── Component ─────────────────────────────────────
export function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: ? opens, Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key === '?' && !open) { e.preventDefault(); setOpen(true); }
      else if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Auto-scroll to bottom on new message / typing change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Msg = { role: 'user', text: trimmed, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    // Simulate a brief "thinking" delay for a natural feel (still 100% local).
    setTimeout(() => {
      // 1) Small talk (greetings, thanks, bye, help, etc.) — checked FIRST so
      //    "Hi" doesn't fall to the generic fallback. Pure pleasantries stop
      //    here; "help" continues to be conversational.
      const small = matchSmallTalk(trimmed);
      // 2) Knowledge base — how-to questions about the portals.
      const { entry } = findBest(trimmed);

      let replyText: string;
      if (small && !entry) {
        // Pure small talk — no KB match. Just be conversational.
        replyText = small;
      } else if (entry && small) {
        // e.g. "hi, how do I enroll" → greeting + answer.
        replyText = small + '\n\n' + entry.answer;
      } else if (entry) {
        replyText = entry.answer;
      } else if (small) {
        // Small talk matched and was the only hit — but it may have been a
        // 'help'/'stuck' trigger; append a pointer to suggestions.
        replyText = small;
      } else {
        replyText = FALLBACK;
      }

      const reply: Msg = { role: 'bot', text: replyText, ts: Date.now() };
      setTyping(false);
      setMessages((m) => [...m, reply]);
    }, 450);
  }, []);

  const handleSuggestion = (q: string) => send(q);

  return (
    <>
      {/* ─── Floating Action Button ─── */}
      <motion.button
        onClick={() => setOpen(true)}
        aria-label="Concordia Assistant"
        className="fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full bg-gradient-to-br from-[#F26522] to-[#D4541E] shadow-lg hover:shadow-xl grid place-items-center text-white transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <LifeBuoy className="h-6 w-6" />
        <span className="absolute inset-0 rounded-full bg-[#F26522] animate-ping opacity-20" />
        {/* Unread-style dot to draw the eye */}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
        )}
      </motion.button>

      {/* ─── Chat Panel ─── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-5 right-5 z-50 w-[min(92vw,420px)] h-[min(80vh,600px)] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#F26522] to-[#D4541E]">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-white/15 grid place-items-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm flex items-center gap-1.5">
                      Concordia Assistant
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/90 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" /> ONLINE
                      </span>
                    </div>
                    <div className="text-white/70 text-[11px]">Concordia College · Built by Faisal Khan</div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="h-8 w-8 grid place-items-center rounded-md text-white/80 hover:bg-white/10 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 scroll-fancy">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`h-7 w-7 rounded-full grid place-items-center shrink-0 ${m.role === 'bot' ? 'bg-[#F26522]/10 text-[#F26522]' : 'bg-gray-200 text-gray-500'}`}>
                      {m.role === 'bot' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div
                      className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                        m.role === 'bot'
                          ? 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                          : 'bg-[#F26522] text-white rounded-br-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {typing && (
                  <div className="flex items-end gap-2">
                    <div className="h-7 w-7 rounded-full grid place-items-center shrink-0 bg-[#F26522]/10 text-[#F26522]">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Suggestion chips — only show when there are ≤ 2 messages (welcome + maybe 1) */}
                {messages.length <= 2 && !typing && (
                  <div className="pt-1">
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                      <Sparkles className="h-3 w-3 text-[#F26522]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Try asking</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleSuggestion(q)}
                          className="px-2.5 py-1.5 rounded-full border border-gray-200 bg-white text-xs text-gray-600 hover:border-[#F26522]/40 hover:text-[#F26522] transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 p-3 bg-white">
                <form
                  onSubmit={(e) => { e.preventDefault(); send(input); }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about the portal…"
                    className="flex-1 h-10 rounded-full border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/12 outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    aria-label="Send message"
                    className="h-10 w-10 rounded-full bg-[#F26522] hover:bg-[#D4541E] text-white grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                <div className="text-center mt-2">
                  <span className="text-[10px] text-gray-400">
                    100% offline · no AI · built by{' '}
                    <a
                      href="https://www.instagram.com/faisu._khan01/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#F26522] hover:underline font-medium"
                    >
                      Faisal Khan
                    </a>
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default HelpWidget;
