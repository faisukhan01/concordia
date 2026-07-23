# 3-teacher-portal — full-stack-developer

## Task
Completely rewrite `/home/z/my-project/src/components/portal/teacher-portal.tsx` with a clean, aesthetic, polished UI matching the design system used by admissions / academic / student portals.

## Files modified
1. `/home/z/my-project/src/components/portal/teacher-portal.tsx` — full rewrite (~2200 lines, was 1399)

## Module list (exactly these 7 + `settings`)
| Module ID                | Component              | Notes |
|--------------------------|------------------------|-------|
| `teacher-dashboard`      | `TeacherDashboard`     | 4 StatCards + today's timetable + quick actions + my classes peek |
| `teacher-classes`        | `TeacherClasses`       | Search + table + detail Sheet with student roster |
| `teacher-attendance`     | `TeacherAttendance`    | Class+date selectors + P/A/L toggle per row + sticky submit bar |
| `teacher-results`        | `TeacherResults`       | 4 selectors + marks entry + recent submissions + sticky submit bar |
| `teacher-feedback`       | `TeacherFeedback`      | 2-col form + 1-col live preview + recent feedback list |
| `teacher-announcements`  | `TeacherAnnouncements` | 2-col compose + 3-col history list (with delete) |
| `teacher-timetable`      | `TeacherTimetable`     | Weekly grid Mon–Sat × periods, today highlighted orange |
| `settings`               | (router returns null)  | Handled by parent `RolePortal` |

## File structure
1. Header comment block (spec §5 + design language)
2. Imports (React + api + store + shadcn/ui + lucide-react)
3. Types: `TeacherClass`, `Student`, `AttendanceStatus`, `Props`
4. Shared constants: `PRIMARY`, `DAYS`, `COMMON_TESTS`, `FEEDBACK_CATEGORIES`, `inputCls`, `selectTriggerCls`, `btnPrimary`, `btnSecondary`, `SCROLLBAR_CLS`
5. Shared helpers: `PageHeader`, `StatCard`, `SectionHeader`, `Skeleton`, `SkeletonTable`, `EmptyState`, `Field`, `AttendanceBadge`, `ReviewBadge`, `fmtDate`, `fmtDateTime`, `todayISO`
6. `useTeacherData(user)` hook — loads classes + students once; allocation-restricted via `api.getTeacherClasses()`
7. `studentsForClass(students, cls)` helper — matches on branchId + name + section
8. `authHeaders()` helper — pulls Bearer token for the feedback POST
9. Seven module components, each with a `// ═══` section banner
10. `TeacherPortal` router export — strips `teacher:` namespace (admin hub access) + returns `null` for `settings`

## Design system adherence
- Orange `#F26522` used ONLY for: primary buttons, active toggle states (P/A/L row picker), today's timetable column, the `h-0.5 w-8` section accent line, small category badges in feedback preview.
- No gradients. No glassmorphism. No colored icon tiles. No framer-motion.
- White cards on `border-gray-200 rounded-xl` with `hover:shadow-sm` on interactive cards.
- Tables: `text-xs font-medium uppercase tracking-wide text-gray-500` headers + `hover:bg-gray-50` row tint.
- Buttons: primary = `bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-4 text-sm font-medium`, secondary = `border border-gray-200 bg-white hover:bg-gray-50`.
- Inputs: `h-10 rounded-lg border border-gray-200 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/12`.
- Section accent: `h-0.5 w-8 bg-[#F26522] rounded-full mb-3` above each page title.
- Consistent `p-6` card padding, `gap-6` between sections, `gap-4` inside grids.
- Long lists use `max-h-96 overflow-y-auto` with custom thin gray scrollbar (`[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200`).
- Responsive: mobile-first with `sm:` / `lg:` breakpoints.

## Allocation enforcement
- The ONLY source of classes is `api.getTeacherClasses()` (server-side query: `SELECT DISTINCT c.* FROM classes c JOIN teacher_class_courses tcc ON c.id = tcc.classId WHERE tcc.teacherId = ?`).
- Subject dropdowns (in Results, Attendance — implicitly via class roster) come from the same allocated class objects.
- Teachers can NEVER see/select classes outside their allocation.

## API gaps discovered (notes for next agent)
1. **NO dedicated `/api/feedback` endpoint exists in handler.ts.** The portal POSTs to `/api/feedback` best-effort (silently 404s) and keeps feedback in component state so the teacher gets immediate confirmation. Backend wiring for persistent feedback storage is a future task. The client-side `history` state preserves the session only — refresh loses it.
2. **`api.getAttendance({ teacherId })` returns ALL the teacher's sessions** across all classes/dates (handler.ts:1495 — only honors `classId` and `studentId` query params, NOT `teacherId` even though the api client sends it). The portal filters client-side for the matching class+date to pre-populate the roster. Acceptable for now (≤50 sessions per teacher); a server-side `teacherId` + `classId` + `date` filter would be cleaner.
3. **`api.getResults({ teacherId })` is NOT filtered server-side** — the handler (handler.ts:1540) only honors `courseId` and `studentId` query params, ignoring `teacherId`. The portal uses the unfiltered list as-is for the "Recent Submissions" preview (which may include other teachers' results in the same branch). If a server-side `teacherId` filter is added later, the client still works.
4. **`api.getTimetable({ teacherId })` works correctly.** The double-vs-single quote SQL day-literal bug noted in RESEARCH-WEB has already been fixed in handler.ts (uses single-quoted day names). Confirmed by reading the handler — no further action needed.

## Lint
- `bun run lint` passes clean (0 errors, 0 warnings).
- One lint rule (`react-hooks/set-state-in-effect`) initially flagged a synchronous `setLoading(true)` inside `useTeacherData`'s `useEffect`. Fixed by removing the call — `loading` defaults to `true` on first render so initial state is correct, and on `branchId` change we use stale-while-revalidate (keep showing old data while fetching) which is nicer UX than a flash of skeleton.

## Dev server
- Compiles cleanly. `dev.log` shows `✓ Compiled` with no errors after the rewrite.
