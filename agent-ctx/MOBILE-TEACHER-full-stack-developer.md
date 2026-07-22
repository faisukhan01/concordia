# MOBILE-TEACHER — mobile teacher parity

## Scope owned
Only `mobile/lib/screens/teacher_portal/` was edited. No other portals touched.

## Files modified
1. `teacher_home.dart` — timetable query `branchId` → `teacherId`; passes `onNavigate` to TeacherDashboard.
2. `teacher_dashboard.dart` — added `onNavigate` param; wired 4 stubbed quick actions to real tab switches; added E-Learning Hub + Exam Portal tiles; removed unused `_showSnack` + `calendar_screen` import.

## Files created
1. `teacher_e_learning.dart` (523 lines) — 4-tab hub: Videos / Past Papers / MCQ Practice / My Progress. Hits `/api/e-learning/{videos,papers,mcq-sets,progress}`.
2. `teacher_exam_portal.dart` (595 lines) — 2 sections: Upcoming Exams (`/api/exam-portal/upcoming` — graceful empty) + Posted Results (`/api/results?teacherId=` client-filtered by `rec.teacherId === user.id`).

## Brace check
All 6 files in teacher_portal/ → braces OK, parens OK.

## Notes for next agent
- The web-side timetable SQL day-literal bug at handler.ts:1948 is a separate task (RESEARCH-WEB). It is OUT OF SCOPE for MOBILE-TEACHER and was NOT touched. The mobile timetable fix here only changes the query param from `branchId` to `teacherId` — the underlying SQL bug will still return HTTP 500 until the web fix lands. Once the web fix lands, the teacher's timetable tab will populate automatically (no mobile-side change needed).
- The `GET /api/results` server handler does NOT honour the `teacherId` query param (only `courseId` / `studentId`). The mobile client filters by `rec['teacherId'] === user.id` to compensate. If a server-side fix is added later, the client-side filter is harmless (just runs on an already-filtered list).
