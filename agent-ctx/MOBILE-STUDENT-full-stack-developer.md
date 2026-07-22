# MOBILE-STUDENT — full-stack-developer (mobile student parity)

Task: Fix student timetable + add report-card & diary screens in the Flutter ESM mobile app.

## Scope

Own the Student mobile portal only. Files I touched (all under `mobile/lib/screens/student_portal/`):
- `student_timetable.dart` (MODIFIED — bug fix)
- `student_report_card.dart` (CREATED — new screen)
- `student_diary.dart` (CREATED — new screen)
- `student_dashboard.dart` (MODIFIED — added 2 imports + 2 QuickActionTile entries)

Did NOT touch: `dashboard_screen.dart` (no routing change needed), any teacher/institute/branch files.

## What was done

### A. student_timetable.dart bug fix
Rewrote `_load()` to query `GET /api/timetable?branchId={branchId}` (which the backend honors), then client-side filter entries where `entry['className'] == user['class']` (case-insensitive). Skips the filter if the student has no class set so they still see *something*. UI grid rendering untouched.

### B. student_report_card.dart (new, 525 lines)
- Endpoint: `GET /api/report-cards?studentId={userId}`
- States: skeleton / error+retry / empty ("No report cards published yet") / list
- Navy gradient hero card showing cumulative average % across all cards
- Each card: term chip, examName, 44×44 grade badge (A green / B info-cyan / C amber / D-F red), marks split, %, progress bar, optional remarks block (italic w/ quote icon), published-date footer
- Style mirrors `student_results.dart`

### C. student_diary.dart (new, 472 lines)
- Endpoint: `GET /api/diary?branchId={branchId}`
- States: skeleton / error+retry / empty / list
- Each card: subject chip (stable hash palette, no indigo), due date (red if overdue — date-only comparison), title, 3-line description snippet, "View details" link (red if overdue)
- Tap → modal bottom sheet w/ full description + Share (share_plus) + Close
- Style mirrors `student_announcements.dart`

### D. student_dashboard.dart navigation wiring
- `student_home.dart` only has a 5-slot BottomNavigationBar (already at Material Design max). Adding more would overflow/clip.
- So I added the new entries to the existing Quick Actions grid in `student_dashboard.dart` (where Timetable, ID Card, Notices, E-Learning, Exam Portal, Wallet, Live Transport, Complaint Portal already live).
- 2 new `QuickActionTile`s:
  - Report Card → `Icons.assignment_rounded`, color `AppTheme.gold`, pushes `StudentReportCard`
  - Diary → `Icons.menu_book_rounded`, color `AppTheme.success`, pushes `StudentDiary`
- Placement: Report Card right after "My Results"; Diary right after "Timetable". Grid now has 13 tiles (was 11) — still lays out cleanly in 7×2.

### E. Brace-balance check (mandatory, all OK)
```
student_timetable.dart    braces 42/42 OK  parens 258/258 OK
student_report_card.dart  braces 37/37 OK  parens 227/227 OK
student_diary.dart        braces 30/30 OK  parens 230/230 OK
student_home.dart         braces 5/5  OK  parens 32/32  OK   (untouched, sanity)
student_dashboard.dart    braces 50/50 OK  parens 395/395 OK
```

## Style notes
- AppTheme.primary (#0B1F3A navy) is the primary chrome color throughout — no indigo, no off-palette blue.
- The only "blue" is `AppTheme.info` (#0EA5E9 cyan) used on B-grades — this matches the existing `student_results.dart._gradeColor` and `student_dashboard.dart._ResultsBarChart._colorForGrade` conventions exactly.
- Inter typography via google_fonts throughout.
- Consistent 12–16px padding (analogous to p-3/p-4 in web).
- Every new screen has: loading skeleton, error view with retry button, empty state, pull-to-refresh, real API calls only (no fake/dummy data).

## Notes for downstream agents
- The bottom nav in `student_home.dart` is at capacity (5/5 slots). Any future student screen should also go into the Quick Actions grid in `student_dashboard.dart`, not the bottom nav.
- The `share_plus` package is already in pubspec.yaml (used by `student_announcements.dart`); `student_diary.dart` reuses it.
- The backend `GET /api/timetable` still has the SQL bug documented in RESEARCH-WEB's worklog entry (double-quoted day literals in the ORDER BY CASE clause → 500 on Turso/libsql). My mobile fix works around this on the client side by querying `branchId` instead of `studentId`, but if the backend SQL is also fixed (single-quoted day literals), the same client code will continue to work without changes.
