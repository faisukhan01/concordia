# MOBILE-BRANCH — mobile branch parity

## Scope owned
Only `mobile/lib/screens/branch_portal/` was edited. No other portals touched.

## Files modified
1. `branch_home.dart` — added 5 imports; added `onNavigate` param to `_BranchDashboard`; wired it from `_BranchHomeState.build()`; fixed the 4 broken quick-action stubs (Teachers→tab 2, Students→tab 3, Fees→tab 5, Reports→repurposed as Results tile that pushes `BranchResults`); added 4 new quick-action tiles (Attendance, Exam Portal, E-Learning, Events); removed the now-unused `_toast()` helper.

## Files created
1. `branch_attendance.dart` (593 lines) — Attendance Review. `GET /api/attendance` (client-filtered by branchId, since server ignores the param) + `GET /api/branch/classes?branchId=` for class-name resolution. Expandable session cards with Present/Absent/Late/Total count chips + per-student status rows.
2. `branch_results.dart` (552 lines) — Results. `GET /api/results` (client-filtered by branchId) + branch/classes for names. Expandable result cards with avg-% badge, total-marks/students/avg chips, per-student marks+grade rows.
3. `branch_exam_portal.dart` (579 lines) — Exam Portal. Two stacked sections: Upcoming Exams (`GET /api/exam-portal/upcoming` — graceful empty since endpoint doesn't exist yet) + Recent Results (`GET /api/results` top 5 client-filtered by branchId). Independent loading flags.
4. `branch_e_learning.dart` (392 lines) — E-Learning Hub. 3-tab hub (Videos · Past Papers · MCQs). Hits `/api/e-learning/{videos,papers,mcq-sets}?branchId=`. Same content-browsing pattern as student_e_learning.dart (each tab keeps itself alive via AutomaticKeepAliveClientMixin).
5. `branch_events.dart` (415 lines) — Events. `GET /api/events?branchId=` (server honours branchId natively). Event cards with type-specific icon + color mapping (exam/holiday/meeting/sport/trip/deadline/default).

## Brace check
All 7 files in branch_portal/ → braces OK, parens OK.

## Notes for next agent
- The backend `GET /api/attendance` and `GET /api/results` handlers do NOT honour a `branchId` query param (only classId/courseId/studentId). The mobile client filters by `rec['branchId'] == user.branchId` to compensate. If a server-side fix is added later, the client-side filter is harmless.
- The `GET /api/exam-portal/upcoming` and `GET /api/e-learning/*` endpoints do NOT exist in handler.ts yet. The mobile screens degrade gracefully to empty states. When the backend ships these endpoints, the screens will light up automatically.
- The pre-existing `import '../calendar_screen.dart';` in branch_home.dart is unused but was there before my edits — left untouched to keep the diff focused on the task scope (it produces a Dart analyzer warning, not an error, and does not affect compilation).
- The "Reports" quick-action tile was repurposed as "Results" (label + icon changed) rather than removed, so users still have a balanced 10-tile 2×5 grid.
- The BottomNavigationBar tab indices are: 0=Dashboard, 1=Classes, 2=Teachers, 3=Students, 4=Timetable, 5=Fees. If future agents add a 7th tab, they will need to shift the Fees index (currently 5).
