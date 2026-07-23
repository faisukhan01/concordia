# 4-student-portal — full-stack-developer

## Task
Completely rewrite `/home/z/my-project/src/components/portal/student-portal.tsx` with a clean, aesthetic, polished UI matching the design system used by the teacher portal (just rebuilt in task 3-teacher-portal). Also serves the Parent role (parent logs in with student creds → reuses this exact portal with ward-aware labels).

## Files modified
1. `/home/z/my-project/src/components/portal/student-portal.tsx` — full rewrite (~1940 lines, was 1483)

## Module list (exactly these 7 + `settings`)
| Module ID                | Component              | Notes |
|--------------------------|------------------------|-------|
| `student-dashboard`      | `StudentDashboard`     | Welcome banner (ward-aware) + 4 StatCards + 2-col body (recent announcements + latest results) + 6 quick-link cards |
| `student-results`        | `StudentResults`       | 3-card stats strip (Highest/Avg/Lowest) + full results table (subject/exam/date/marks/grade/percentage bar) |
| `student-report-card`    | `StudentReportCard`    | Accordion of published cards; each expands to show Obtained/Percentage/Grade + remarks |
| `student-attendance`     | `StudentAttendance`    | Big rate + Present/Absent/Late tiles + distribution bar (green/amber/red) + chronological log table |
| `student-timetable`      | `StudentTimetable`     | Weekly grid Mon–Sat × periods; today's column header + cells highlighted orange; room name shown |
| `student-datesheet`      | `StudentDateSheets`    | Parsed from announcements where title starts with "Date Sheet:"; cards with subject/date/time/status table |
| `student-announcements`  | `StudentAnnouncements` | Filtered (student role + class scope, excluding date sheets); cards with scope badge + sender + relative time |
| `settings`               | (router returns null)  | Handled by parent `RolePortal` |

## File structure
1. Header comment block (spec §6.1 + §6.2 + design language)
2. Imports (React + api + cn + store + shadcn/ui Table + Accordion + lucide-react)
3. `Props` type
4. Shared constants: `TIMETABLE_DAYS`, `SCROLLBAR_CLS`
5. Ward-aware helpers: `possessive(user, studentPhrase, parentPhrase)` — used everywhere headings need to swap "My" → "Ward's"
6. Shared helpers: `PageHeader` (with `h-0.5 w-8 bg-[#F26522] rounded-full mb-3` accent), `StatCard`, `SectionHeader`, `Skeleton`, `SkeletonTable`, `SkeletonCards`, `SkeletonStatGrid`, `EmptyState`, `ErrorRow`
7. Formatters & misc: `formatDate`, `formatDateTime`, `relativeTime`, `subjectLabel`, `computePercentage`, `computeGrade`, `gradeTone`, `barTone`
8. Small shared components: `GradeBadge` (with subtle muted tones — emerald for A+/A, slate for B/C, amber for D, rose for F), `PercentageBar` (orange fill), `StatusBadge`, `ScopeBadge` (Class/Branch/College-wide)
9. `useStudentClassId(user)` hook — resolves `classId` from `user.class` + `user.section` + `user.branchId` via `api.getClasses()` (user profile doesn't ship classId)
10. `StudentPortal` router export — strips `student:` namespace (admin hub access) + returns `null` for `settings`
11. Seven module components, each with a `// ═══` section banner
12. `ComingSoon` fallback

## Design system adherence
- Orange `#F26522` used ONLY for: the `h-0.5 w-8` section accent line, today's timetable column (header text + dot + cell border tint), the percentage bar fill, the "Class" scope badge, term pill on report cards, hover states on quick-link cards + recent announcement rows + timetable cells.
- No gradients. No glassmorphism. No colored icon tiles. No framer-motion.
- White cards on `border-gray-200 rounded-xl` with `hover:shadow-sm` on interactive cards.
- Tables: `text-[11px] uppercase tracking-wider text-gray-400 font-semibold` headers + `hover:bg-gray-50/60` row tint.
- Consistent `p-5`/`p-6` card padding, `gap-4` inside grids, `space-y-6` between sections.
- Long horizontal scroll areas use `SCROLLBAR_CLS` for a thin gray scrollbar.
- Responsive: mobile-first with `sm:` / `lg:` breakpoints. Tables use `min-w-[760px]` inside `overflow-x-auto` wrappers.

## Ward-aware labels (parent role)
- `possessive(user, student, parent)` returns the right phrase based on `user.role === 'parent'`.
- Dashboard welcome: "Welcome back, {firstName}" → "Welcome to your ward's portal"
- Section titles: "My Results" → "Ward's Results", "My Attendance" → "Ward's Attendance", "Report Card" → "Ward's Report Card"
- Subtitles: "Your test scores..." → "Your child's test scores..."
- The user object IS the student's user object (parent logs in with student creds), so all `studentId`-keyed API queries work unchanged.

## classId resolution
- The user profile returned by `buildUserProfile()` in `auth.ts` ships: `id, name, email, rollNo, role, roleLabel, title, status, mustChangePassword, blocked, instituteId, instituteName, instituteShort, branchId, branchName, class (name), section, guardian, ward, wardId, subjects, classes, baseFee, baseFeeLocked, campus` — but NO `classId`.
- `useStudentClassId(user)` calls `api.getClasses(user.branchId)` once and matches on `name === user.class` (+ optional `section === user.section`). If a match is found, `classId` is set; otherwise it stays `undefined` and the Timetable/DateSheets/Announcements views gracefully degrade.
- The announcements handler already does its own server-side class lookup (handler.ts:844-851 for `user.role === 'student'`), so the client-side filter is mostly belt-and-suspenders for the scope='class' case where `a.classId` is set.

## View-only posture
- ZERO edit/create/delete buttons anywhere. No forms. No sticky submit bars. No mutations.
- Every action button is purely navigational (e.g. "View all" → `setActiveModule`).
- This matches spec §6.1 (Student) and §6.2 (Parent) — both 100% view-only.

## API gaps discovered (notes for next agent)
1. **`user.classId` is NOT in the user profile.** Resolved client-side via `api.getClasses(branchId)` lookup. This adds one round-trip per portal mount (cached by the api client's `cachedGet` for 30s). If `buildUserProfile()` were extended to ship `classId` (looked up server-side in the auth handler), this extra call would disappear.
2. **`api.getReportCards({ studentId })` works correctly** — handler at 1993-2004 filters server-side by `studentId`. No client filter needed.
3. **`api.getAttendance({ studentId })` works correctly** — handler at 1495-1524 returns `{ entries, total, present, absent, late }` when `studentId` is passed. The portal handles both the object shape and the raw-array fallback.
4. **`api.getResults({ studentId })` works correctly** — handler at 1540-1558 returns flat array of `{ id, exam, courseId, totalMarks, marks, grade, date }` when `studentId` is passed. The portal handles both array and `{ entries: [...] }` shapes.
5. **`api.getTimetable({ classId })` works correctly** — handler at 1944-1956 filters by classId. Today's-column highlighting is purely client-side (compares day name to `new Date().toLocaleDateString('en-US', { weekday: 'long' })`).
6. **Date sheets are parsed from announcements** where `title.startsWith('Date Sheet:')`. The academic-portal writes them in this format. Message format is `Subject — Date at Time` per line. No dedicated `/api/datesheets` endpoint exists.
7. **`api.getNotifications()`** is called on the dashboard for the unread-count chip on the Announcements stat card. Returns `{ items: any[], unread: number }`. The portal only uses `unread`.

## Lint
- `bun run lint` passes clean (0 errors, 0 warnings).
- No `react-hooks/set-state-in-effect` warnings (no synchronous `setLoading(true)` inside `useEffect` — initial state of `true` covers the first render, and on dependency change we use stale-while-revalidate).

## Dev server
- Compiles cleanly. Latest `dev.log` shows `✓ Compiled in 151ms` / `162ms` / `147ms` and `GET / 200 in 267ms` after the rewrite. No runtime errors.
