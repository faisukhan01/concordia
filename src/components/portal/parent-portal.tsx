'use client';

// ============================================================================
// Concordia College — Parent Portal (spec §6.2)
//
// Mirrors the Student role 1:1 — 100% view-only.
//
// Modules (exactly 7):
//   1. parent-dashboard       — overview: stat cards + welcome banner (ward's name/class)
//   2. parent-results         — ward's test results, marks/grade/percentage bar
//   3. parent-report-card     — ward's published result card(s); empty state if none
//   4. parent-attendance      — ward's attendance summary + chronological list
//   5. parent-timetable       — ward's weekly timetable grid
//   6. parent-datesheet       — exam date sheets list
//   7. parent-announcements   — college announcements list
//
// Design language (matches academic / admissions / admin / accountant portals):
//   • Flat, restrained — grayscale + a single orange (#F26522) accent.
//   • No gradient welcome banners, no decorative blobs, no colored icon
//     tiles, no glassmorphism, no framer-motion.
//   • White cards on 1px gray borders, rounded-xl.
//   • Tables: uppercase muted headers, hover row tint, subtle status badges.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard,
  GraduationCap,
  Award,
  CalendarCheck,
  Calendar,
  CalendarDays,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Megaphone,
  FileText,
  ChevronRight,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

type Props = { activeModule: string; user: any };

// ───────────────────────── Shared helpers ─────────────────────────

function PageHeader({
  title,
  subtitle,
  meta,
}: {
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="h-1 w-8 bg-[#F26522] rounded-full mb-3" />
        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {meta && <div className="shrink-0">{meta}</div>}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</div>
          <div
            className={
              'mt-2 text-2xl font-bold tabular-nums truncate ' +
              (accent ? 'text-[#F26522]' : 'text-[#1A1A1A]')
            }
          >
            {value}
          </div>
          {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
        </div>
        <Icon className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
      </div>
    </div>
  );
}

function SectionHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
      {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
    </div>
  );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-md" />
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="grid place-items-center h-12 w-12 rounded-full bg-gray-100 mb-3">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-[#1A1A1A]">{title}</p>
      {desc && <p className="text-xs text-gray-500 mt-1 max-w-sm">{desc}</p>}
    </div>
  );
}

const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const fmtDateTime = (iso?: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

// Subtle grade badge — emerald for top grades, amber for mid, rose for fail.
function GradeBadge({ grade }: { grade?: string }) {
  const g = String(grade || '').toUpperCase();
  let cls = 'text-muted-foreground bg-muted border-transparent';
  if (g === 'A+' || g === 'A') cls = 'text-emerald-700 bg-emerald-50 border-transparent';
  else if (g === 'B') cls = 'text-emerald-700 bg-emerald-50/60 border-transparent';
  else if (g === 'C') cls = 'text-amber-700 bg-amber-50 border-transparent';
  else if (g === 'D') cls = 'text-gray-600 bg-gray-100 border-transparent';
  else if (g === 'F') cls = 'text-rose-700 bg-rose-50 border-transparent';
  return (
    <Badge variant="outline" className={'font-semibold ' + cls}>
      {grade || '—'}
    </Badge>
  );
}

// Attendance status badge — emerald / amber / rose.
function AttendanceBadge({ status }: { status?: string }) {
  const s = String(status || '').toLowerCase();
  let cls = 'text-muted-foreground bg-muted border-transparent';
  if (s === 'present') cls = 'text-emerald-700 bg-emerald-50 border-transparent';
  else if (s === 'absent') cls = 'text-rose-700 bg-rose-50 border-transparent';
  else if (s === 'late') cls = 'text-amber-700 bg-amber-50 border-transparent';
  return (
    <Badge variant="outline" className={'font-medium ' + cls}>
      {status || '—'}
    </Badge>
  );
}

// ───────────────────────── Ward data hook ─────────────────────────
//
// Fetches the ward (linked student) record + the data every module reuses
// (attendance + results). Other modules fetch their own data on mount so we
// don't pay the cost up-front.

function useWard(user: any) {
  // Lazy-init: if there's no wardId on mount, we never enter the loading state.
  const [ward, setWard] = useState<any | null>(null);
  const [wardLoading, setWardLoading] = useState(() => Boolean(user?.wardId));
  const [attendance, setAttendance] = useState<any | null>(null);
  const [results, setResults] = useState<any | null>(null);

  useEffect(() => {
    if (!user?.wardId) return;
    let cancelled = false;
    api
      .platformUsers()
      .then((all: any[]) => {
        if (cancelled) return;
        const w = (Array.isArray(all) ? all : []).find((u) => u.id === user.wardId) || null;
        setWard(w);
        setWardLoading(false);
        if (w) {
          Promise.all([
            api.getAttendance({ studentId: w.id }).catch(() => null),
            api.getResults({ studentId: w.id }).catch(() => null),
          ]).then(([att, res]) => {
            if (cancelled) return;
            setAttendance(att);
            setResults(res);
          });
        }
      })
      .catch(() => {
        if (!cancelled) setWardLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.wardId]);

  return { ward, wardLoading, attendance, results };
}

// Resolve the ward's classId. The users table only stores `class` (name) +
// `section` — `buildUserProfile` doesn't expose `classId` — so we look it up
// against the branch's classes table once and memoize. The hook returns a
// `{ done, classId }` object: `done: false` while the lookup is pending,
// `done: true` once we know the answer (classId may still be undefined if no
// matching class was found — in that case callers fall back to branchId +
// client-side filtering).
function useWardClassId(ward: any) {
  const [state, setState] = useState<{ done: boolean; classId?: string }>(
    () => (ward?.classId ? { done: true, classId: ward.classId } : { done: false }),
  );

  useEffect(() => {
    if (!ward?.id) return;
    // If the ward already carries a classId, no lookup is needed.
    if (ward.classId) return;
    let cancelled = false;
    api
      .getClasses(ward.branchId)
      .then((rows: any[]) => {
        if (cancelled) return;
        const match = (Array.isArray(rows) ? rows : []).find(
          (c) => c.name === ward.class && c.section === ward.section,
        );
        setState({ done: true, classId: match?.id });
      })
      .catch(() => {
        if (!cancelled) setState({ done: true });
      });
    return () => {
      cancelled = true;
    };
  }, [ward?.id, ward?.classId, ward?.branchId, ward?.class, ward?.section]);

  return state;
}

// ───────────────────────── Router ─────────────────────────

export function ParentPortal({ activeModule, user }: Props) {
  const { ward, wardLoading, attendance, results } = useWard(user);

  // Subtle entrance fade — CSS only, no framer-motion.
  return (
    <div className="animate-in fade-in-0 duration-200 space-y-6">
      {activeModule === 'parent-dashboard' && (
        <ParentDashboard
          user={user}
          ward={ward}
          wardLoading={wardLoading}
          attendance={attendance}
          results={results}
        />
      )}
      {activeModule === 'parent-results' && (
        <ParentResults ward={ward} wardLoading={wardLoading} results={results} />
      )}
      {activeModule === 'parent-report-card' && <ParentReportCard ward={ward} wardLoading={wardLoading} />}
      {activeModule === 'parent-attendance' && (
        <ParentAttendance ward={ward} wardLoading={wardLoading} attendance={attendance} />
      )}
      {activeModule === 'parent-timetable' && <ParentTimetable ward={ward} wardLoading={wardLoading} />}
      {activeModule === 'parent-datesheet' && <ParentDateSheets />}
      {activeModule === 'parent-announcements' && <ParentAnnouncements />}
      {/* Unknown / upcoming module — clean "Coming soon" empty state */}
      {![
        'parent-dashboard',
        'parent-results',
        'parent-report-card',
        'parent-attendance',
        'parent-timetable',
        'parent-datesheet',
        'parent-announcements',
      ].includes(activeModule) && <ComingSoon />}
    </div>
  );
}

// ───────────────────────── Ward not-linked state ─────────────────────────

function WardNotLinked() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <EmptyState
        icon={ClipboardList}
        title="Ward not linked yet"
        desc="Your account isn't linked to a student yet. Please contact the school's Academic Office to link your ward."
      />
    </div>
  );
}

// ───────────────────────── Dashboard ─────────────────────────

function ParentDashboard({
  user,
  ward,
  wardLoading,
  attendance,
  results,
}: {
  user: any;
  ward: any;
  wardLoading: boolean;
  attendance: any;
  results: any;
}) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [annLoading, setAnnLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getAnnouncements()
      .then((d: any[]) => {
        if (cancelled) return;
        setAnnouncements(Array.isArray(d) ? d : []);
        setAnnLoading(false);
      })
      .catch(() => {
        if (!cancelled) setAnnLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const attRate = attendance?.rate != null ? `${attendance.rate}%` : '—';
  const avgPct = results?.avgPercentage != null ? `${results.avgPercentage}%` : '—';
  const resultsCount = results?.total ?? 0;
  const recentAnnouncements = announcements.slice(0, 3);

  // Donut rendering for the attendance rate using conic-gradient (no chart lib).
  const attRateNum = typeof attendance?.rate === 'number' ? attendance.rate : 0;
  const attColor =
    attRateNum >= 75 ? '#10B981' : attRateNum >= 50 ? '#F59E0B' : '#F43F5E';

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0] || 'Parent'}`}
        subtitle={
          ward
            ? `Tracking progress for ${ward.name}${ward.class ? ` · ${ward.class}${ward.section ? ` — ${ward.section}` : ''}` : ''}${ward.rollNo ? ` · Roll #${ward.rollNo}` : ''}`
            : 'A view-only window into your ward\u2019s academic progress.'
        }
        meta={
          ward ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
              <div className="grid place-items-center h-8 w-8 rounded-full bg-gray-100">
                <GraduationCap className="h-4 w-4 text-gray-500" />
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-[#1A1A1A]">{ward.name}</div>
                <div className="text-[11px] text-gray-500">
                  {ward.class || '—'}
                  {ward.section ? ` · ${ward.section}` : ''}
                  {ward.rollNo ? ` · #${ward.rollNo}` : ''}
                </div>
              </div>
            </div>
          ) : null
        }
      />

      {wardLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : !ward ? (
        <WardNotLinked />
      ) : (
        <>
          {/* Stat cards — flat, no colored icon tiles, single accent on attendance */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={CalendarCheck}
              label="Attendance Rate"
              value={attRate}
              sub={
                attendance?.total
                  ? `${attendance.present} of ${attendance.total} days`
                  : 'No records yet'
              }
              accent
            />
            <StatCard
              icon={GraduationCap}
              label="Average Score"
              value={avgPct}
              sub={resultsCount ? `${resultsCount} results posted` : 'No results yet'}
            />
            <StatCard
              icon={Award}
              label="Results"
              value={resultsCount}
              sub={resultsCount ? 'Across all subjects' : 'Awaiting first result'}
            />
            <StatCard
              icon={Bell}
              label="Announcements"
              value={announcements.length}
              sub={annLoading ? 'Loading…' : 'College-wide notices'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Attendance summary — visual ring */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <SectionHeader title="Attendance Summary" desc="Cumulative across all marked days" />
              {!attendance || !attendance.total ? (
                <EmptyState
                  icon={CalendarCheck}
                  title="No attendance records yet"
                  desc="Your ward\u2019s teachers haven\u2019t marked any attendance yet."
                />
              ) : (
                <div className="flex items-center gap-5">
                  <AttendanceRing rate={attRateNum} color={attColor} />
                  <div className="flex-1 space-y-2.5">
                    <SummaryRow
                      icon={CheckCircle2}
                      iconCls="text-emerald-600"
                      label="Present"
                      value={attendance.present}
                    />
                    <SummaryRow
                      icon={XCircle}
                      iconCls="text-rose-600"
                      label="Absent"
                      value={attendance.absent}
                    />
                    <SummaryRow
                      icon={Clock}
                      iconCls="text-amber-600"
                      label="Late"
                      value={attendance.late}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Recent results — compact list with progress bars */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
              <SectionHeader title="Recent Results" desc="Latest posted exam results" />
              {!results || !results.total ? (
                <EmptyState
                  icon={GraduationCap}
                  title="No results posted yet"
                  desc="Your ward\u2019s teachers haven\u2019t posted any results yet."
                />
              ) : (
                <div className="space-y-2.5">
                  {results.entries.slice(0, 5).map((r: any, i: number) => (
                    <ResultRow key={r.id || i} r={r} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent announcements */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <SectionHeader title="Recent Announcements" desc="Latest college-wide notices" />
            {annLoading ? (
              <SkeletonTable rows={3} />
            ) : recentAnnouncements.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="No announcements yet"
                desc="College-wide announcements will appear here once published."
              />
            ) : (
              <div className="divide-y divide-gray-100">
                {recentAnnouncements.map((a, i) => (
                  <AnnouncementRow key={a.id || i} a={a} compact />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

// Tiny circular gauge for the attendance rate.
function AttendanceRing({ rate, color }: { rate: number; color: string }) {
  const safeRate = Math.max(0, Math.min(100, rate));
  return (
    <div
      className="relative h-24 w-24 shrink-0 rounded-full"
      style={{
        background: `conic-gradient(${color} ${safeRate * 3.6}deg, #F3F4F6 0deg)`,
      }}
    >
      <div className="absolute inset-[6px] rounded-full bg-white grid place-items-center">
        <div className="text-center">
          <div className="text-xl font-bold tabular-nums text-[#1A1A1A]">{Math.round(safeRate)}%</div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400">Rate</div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  iconCls,
  label,
  value,
}: {
  icon: any;
  iconCls: string;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-gray-600">
        <Icon className={'h-4 w-4 ' + iconCls} />
        <span>{label}</span>
      </div>
      <span className="font-semibold tabular-nums text-[#1A1A1A]">{value}</span>
    </div>
  );
}

function ResultRow({ r }: { r: any }) {
  const pct = typeof r.percentage === 'number' ? r.percentage : 0;
  const barColor =
    pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50">
      <div className="grid place-items-center h-9 w-9 rounded-lg bg-gray-100 shrink-0">
        <BookOpen className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="min-w-0">
            <div className="text-sm font-medium text-[#1A1A1A] truncate">{r.subject}</div>
            <div className="text-[11px] text-gray-500">
              {r.exam}
              {r.date ? ` · ${fmtDate(r.date)}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold tabular-nums text-[#1A1A1A]">
              {r.marks}
              <span className="text-gray-400">/{r.totalMarks}</span>
            </span>
            <GradeBadge grade={r.grade} />
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={'h-full rounded-full ' + barColor}
            style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function AnnouncementRow({ a, compact }: { a: any; compact?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <div className="grid place-items-center h-8 w-8 rounded-lg bg-gray-100 shrink-0 mt-0.5">
        <Megaphone className="h-4 w-4 text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[#1A1A1A]">{a.title}</span>
          {a.targetRole && (
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 capitalize">
              → {a.targetRole}
            </span>
          )}
        </div>
        <p
          className={
            'text-xs text-gray-500 mt-0.5 ' + (compact ? 'line-clamp-2' : 'whitespace-pre-wrap')
          }
        >
          {a.message}
        </p>
      </div>
      <div className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">
        {fmtDate(a.createdAt)}
      </div>
    </div>
  );
}

// ───────────────────────── Results ─────────────────────────

function ParentResults({
  ward,
  wardLoading,
  results,
}: {
  ward: any;
  wardLoading: boolean;
  results: any;
}) {
  const entries = results?.entries || [];

  return (
    <>
      <PageHeader
        title="Results"
        subtitle={
          ward
            ? `${ward.name}${ward.class ? ` · ${ward.class}${ward.section ? ` — ${ward.section}` : ''}` : ''}`
            : 'Your ward\u2019s exam results'
        }
        meta={
          results?.total != null ? (
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-gray-400">Average Score</div>
              <div className="text-xl font-bold tabular-nums text-[#F26522]">
                {results.avgPercentage != null ? `${results.avgPercentage}%` : '—'}
              </div>
            </div>
          ) : null
        }
      />

      {wardLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SkeletonTable rows={5} />
        </div>
      ) : !ward ? (
        <WardNotLinked />
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <EmptyState
            icon={GraduationCap}
            title="No results posted yet"
            desc="Your ward\u2019s teachers haven\u2019t posted any results yet. Check back after the next exam."
          />
        </div>
      ) : (
        <>
          {/* Subject cards with progress bars — visually scannable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map((r: any, i: number) => (
              <ResultCard key={r.id || i} r={r} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function ResultCard({ r }: { r: any }) {
  const pct = typeof r.percentage === 'number' ? r.percentage : 0;
  const barColor =
    pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#1A1A1A] truncate">{r.subject}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            {r.exam}
            {r.date ? ` · ${fmtDate(r.date)}` : ''}
          </div>
        </div>
        <GradeBadge grade={r.grade} />
      </div>
      <div className="flex items-end justify-between mb-2">
        <div>
          <span className="text-2xl font-bold tabular-nums text-[#1A1A1A]">{r.marks}</span>
          <span className="text-sm text-gray-400">/{r.totalMarks}</span>
        </div>
        <span className="text-sm font-semibold tabular-nums text-gray-600">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={'h-full rounded-full ' + barColor}
          style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

// ───────────────────────── Report Card ─────────────────────────

function ParentReportCard({ ward, wardLoading }: { ward: any; wardLoading: boolean }) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!ward?.id) return;
    let cancelled = false;
    api
      .getReportCards({ studentId: ward.id })
      .then((rows: any[]) => {
        if (cancelled) return;
        const list = Array.isArray(rows) ? rows : [];
        setCards(list);
        setSelected((cur) => cur || (list[0]?.id ?? null));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ward?.id]);

  const active = cards.find((c) => c.id === selected) || cards[0] || null;

  return (
    <>
      <PageHeader
        title="Report Card"
        subtitle={
          ward
            ? `${ward.name}${ward.class ? ` · ${ward.class}${ward.section ? ` — ${ward.section}` : ''}` : ''}`
            : 'Your ward\u2019s published result card'
        }
      />

      {wardLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SkeletonTable rows={4} />
        </div>
      ) : !ward ? (
        <WardNotLinked />
      ) : loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SkeletonTable rows={4} />
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <EmptyState
            icon={Award}
            title="No report card published yet"
            desc="Your ward\u2019s result card will appear here once the Academic Office publishes it."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
          {/* Sidebar list of published report cards */}
          <div className="rounded-xl border border-gray-200 bg-white p-2">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Published Cards
            </div>
            <div className="space-y-1">
              {cards.map((c) => {
                const isActive = (selected || cards[0]?.id) === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className={
                      'w-full text-left rounded-lg px-3 py-2.5 transition-colors ' +
                      (isActive ? 'bg-[#F26522]/5' : 'hover:bg-gray-50')
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={
                          'text-sm font-medium truncate ' +
                          (isActive ? 'text-[#F26522]' : 'text-[#1A1A1A]')
                        }
                      >
                        {c.term || 'Report Card'}
                      </span>
                      {isActive && <ChevronRight className="h-4 w-4 text-[#F26522] shrink-0" />}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {c.examName || 'All Exams'}
                      {c.generatedAt ? ` · ${fmtDate(c.generatedAt)}` : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active report card detail */}
          {active && <ReportCardDetail card={active} ward={ward} />}
        </div>
      )}
    </>
  );
}

function ReportCardDetail({ card, ward }: { card: any; ward: any }) {
  const pct = typeof card.percentage === 'number' ? Math.round(card.percentage) : 0;
  const barColor =
    pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header band — flat white with orange accent stripe */}
      <div className="relative p-6 border-b border-gray-100">
        <div className="absolute top-0 left-0 h-1 w-full bg-[#F26522]" />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Report Card
            </div>
            <div className="text-lg font-bold text-[#1A1A1A] mt-1">{card.term || 'Current Term'}</div>
            {card.examName && (
              <div className="text-xs text-gray-500 mt-0.5">{card.examName}</div>
            )}
          </div>
          <GradeBadge grade={card.grade} />
        </div>
      </div>

      {/* Student info grid */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-100">
        <InfoCell label="Student" value={card.studentName || ward?.name || '—'} />
        <InfoCell
          label="Class"
          value={card.class || ward?.class ? `${ward.class}${ward.section ? ` — ${ward.section}` : ''}` : '—'}
        />
        <InfoCell label="Roll #" value={ward?.rollNo || '—'} />
        <InfoCell label="Issued" value={fmtDate(card.generatedAt)} />
      </div>

      {/* Score summary — large numbers */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-100">
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-400">Obtained Marks</div>
          <div className="mt-1.5 text-2xl font-bold tabular-nums text-[#1A1A1A]">
            {card.obtainedMarks}
            <span className="text-sm text-gray-400"> / {card.totalMarks}</span>
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-400">Percentage</div>
          <div className="mt-1.5 text-2xl font-bold tabular-nums text-[#F26522]">{pct}%</div>
          <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className={'h-full rounded-full ' + barColor}
              style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
            />
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-400">Overall Grade</div>
          <div className="mt-1.5">
            <GradeBadge grade={card.grade} />
          </div>
        </div>
      </div>

      {/* Remarks */}
      {card.remarks && (
        <div className="p-6 border-b border-gray-100">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Remarks
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{card.remarks}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <FileText className="h-3 w-3" />
          Issued by the Academic Office · Concordia College
        </div>
        <div className="text-[11px] text-gray-400">
          Card ID: <span className="font-mono">{card.id}</span>
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-gray-400">{label}</div>
      <div className="text-sm font-medium text-[#1A1A1A] mt-1 truncate">{value}</div>
    </div>
  );
}

// ───────────────────────── Attendance ─────────────────────────

function ParentAttendance({
  ward,
  wardLoading,
  attendance,
}: {
  ward: any;
  wardLoading: boolean;
  attendance: any;
}) {
  const entries = attendance?.entries || [];
  // Newest first — entries come back chronological from the API.
  const chronological = useMemo(
    () => [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [entries],
  );

  const rate = typeof attendance?.rate === 'number' ? attendance.rate : 0;
  const ringColor = rate >= 75 ? '#10B981' : rate >= 50 ? '#F59E0B' : '#F43F5E';

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle={
          ward
            ? `${ward.name}${ward.class ? ` · ${ward.class}${ward.section ? ` — ${ward.section}` : ''}` : ''}`
            : 'Your ward\u2019s day-by-day attendance'
        }
        meta={
          attendance?.total ? (
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-gray-400">Records</div>
              <div className="text-xl font-bold tabular-nums text-[#1A1A1A]">{attendance.total}</div>
            </div>
          ) : null
        }
      />

      {wardLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl lg:col-span-2" />
        </div>
      ) : !ward ? (
        <WardNotLinked />
      ) : !attendance || !attendance.total ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <EmptyState
            icon={CalendarCheck}
            title="No attendance records yet"
            desc="Your ward\u2019s teachers haven\u2019t marked any attendance yet."
          />
        </div>
      ) : (
        <>
          {/* Summary — ring + breakdown cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center gap-5">
              <AttendanceRing rate={rate} color={ringColor} />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Overall Rate
                </div>
                <div className="text-2xl font-bold tabular-nums text-[#1A1A1A] mt-1">{rate}%</div>
                <div className="text-xs text-gray-500 mt-1">
                  {attendance.present} present · {attendance.total} total days
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 grid grid-cols-3 gap-3 lg:col-span-2">
              <SummaryStat
                icon={CheckCircle2}
                iconCls="text-emerald-600"
                label="Present"
                value={attendance.present}
              />
              <SummaryStat
                icon={XCircle}
                iconCls="text-rose-600"
                label="Absent"
                value={attendance.absent}
              />
              <SummaryStat
                icon={Clock}
                iconCls="text-amber-600"
                label="Late"
                value={attendance.late}
              />
            </div>
          </div>

          {/* Chronological list */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Attendance Log</h3>
              <p className="text-xs text-gray-500 mt-0.5">Chronological · newest first</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-gray-100">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Date
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Day
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 text-right">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chronological.map((e: any, i: number) => (
                  <TableRow key={e.id || i} className="border-gray-100 hover:bg-gray-50">
                    <TableCell className="text-sm text-[#1A1A1A]">{fmtDate(e.date)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {(() => {
                        try {
                          return new Date(e.date).toLocaleDateString('en-US', { weekday: 'long' });
                        } catch {
                          return '—';
                        }
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <AttendanceBadge status={e.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}

function SummaryStat({
  icon: Icon,
  iconCls,
  label,
  value,
}: {
  icon: any;
  iconCls: string;
  label: string;
  value: number | string;
}) {
  return (
    <div className="text-center py-2">
      <Icon className={'h-5 w-5 mx-auto mb-1.5 ' + iconCls} />
      <div className="text-2xl font-bold tabular-nums text-[#1A1A1A]">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

// ───────────────────────── Timetable ─────────────────────────

function ParentTimetable({ ward, wardLoading }: { ward: any; wardLoading: boolean }) {
  const { done, classId } = useWardClassId(ward);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait until the ward is loaded AND the classId lookup has resolved.
    if (!ward?.id || !done) return;
    let cancelled = false;
    const params = classId ? { classId } : { branchId: ward.branchId };
    api
      .getTimetable(params)
      .then((rows: any[]) => {
        if (cancelled) return;
        let list = Array.isArray(rows) ? rows : [];
        // If we fetched by branchId, filter to the ward's class+section client-side.
        if (!classId && ward.class) {
          list = list.filter(
            (e) => e.className === ward.class && (!ward.section || e.section === ward.section),
          );
        }
        setEntries(list);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setEntries([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ward?.id, ward?.branchId, ward?.class, ward?.section, classId, done]);

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const byDay = (day: string) =>
    entries.filter((e) => e.day === day).sort((a, b) => (a.period || 0) - (b.period || 0));

  return (
    <>
      <PageHeader
        title="Timetable"
        subtitle={
          ward
            ? `${ward.name}${ward.class ? ` · ${ward.class}${ward.section ? ` — ${ward.section}` : ''}` : ''}`
            : 'Your ward\u2019s weekly class schedule'
        }
        meta={
          entries.length > 0 ? (
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-gray-400">Classes / Week</div>
              <div className="text-xl font-bold tabular-nums text-[#1A1A1A]">{entries.length}</div>
            </div>
          ) : null
        }
      />

      {wardLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SkeletonTable rows={4} />
        </div>
      ) : !ward ? (
        <WardNotLinked />
      ) : loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SkeletonTable rows={4} />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <EmptyState
            icon={Calendar}
            title="No timetable published yet"
            desc="Your ward\u2019s class schedule will appear here once the Academic Office sets it up."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.map((day) => {
            const dayEntries = byDay(day);
            if (dayEntries.length === 0) return null;
            return (
              <div key={day} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#1A1A1A]">{day}</h3>
                  <span className="text-[11px] uppercase tracking-wider text-gray-400">
                    {dayEntries.length} {dayEntries.length === 1 ? 'period' : 'periods'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {dayEntries.map((e, i) => (
                    <TimetableCell key={i} e={e} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function TimetableCell({ e }: { e: any }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3.5 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Period {e.period}
        </span>
        {e.startTime && (
          <span className="text-[10px] font-medium text-gray-500 tabular-nums">
            {e.startTime}
            {e.endTime ? `–${e.endTime}` : ''}
          </span>
        )}
      </div>
      <div className="text-sm font-semibold text-[#1A1A1A]">{e.subject || '—'}</div>
      {e.teacherName && <div className="text-xs text-gray-500 mt-0.5">{e.teacherName}</div>}
      {e.roomName && (
        <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
          <span className="inline-block h-1 w-1 rounded-full bg-gray-300" />
          {e.roomName}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Date Sheets ─────────────────────────
//
// Date sheets are stored as announcements with the title prefix `Date Sheet:`.
// We fetch all announcements and filter — this matches the Academic Office's
// `DateSheetView` publishing convention so parents see exactly what was posted.

function ParentDateSheets() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getAnnouncements()
      .then((d: any[]) => {
        if (cancelled) return;
        const list = (Array.isArray(d) ? d : []).filter((a: any) =>
          String(a.title || '').startsWith('Date Sheet:'),
        );
        setItems(list);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Date Sheets"
        subtitle="Exam schedules published by the Academic Office"
        meta={
          items.length > 0 ? (
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-gray-400">Published</div>
              <div className="text-xl font-bold tabular-nums text-[#1A1A1A]">{items.length}</div>
            </div>
          ) : null
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        {loading ? (
          <SkeletonTable rows={3} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No date sheets published yet"
            desc="Exam date sheets will appear here once the Academic Office publishes them."
          />
        ) : (
          <div className="space-y-3">
            {items.map((a, i) => (
              <DateSheetCard key={a.id || i} a={a} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function DateSheetCard({ a }: { a: any }) {
  // Parse the message body — each line is `Subject — Date at Time`.
  const lines = String(a.message || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#1A1A1A]">{a.title}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            Published {fmtDate(a.createdAt)}
            {a.targetRole ? ` · for ${a.targetRole}s` : ''}
          </div>
        </div>
        <CalendarDays className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
      </div>
      {lines.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-gray-100">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Subject
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Date
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 text-right">
                Time
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, i) => {
              const m = line.match(/^(.+?)\s*[—–-]\s*(.+?)(?:\s+at\s+(.+))?$/);
              const subject = m ? m[1].trim() : line;
              const date = m ? m[2].trim() : '—';
              const time = m && m[3] ? m[3].trim() : 'TBD';
              return (
                <TableRow key={i} className="border-gray-100 hover:bg-gray-50">
                  <TableCell className="text-sm font-medium text-[#1A1A1A]">{subject}</TableCell>
                  <TableCell className="text-sm text-gray-600">{date}</TableCell>
                  <TableCell className="text-sm text-gray-500 text-right tabular-nums">{time}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-gray-500">{a.message || 'No details available.'}</p>
      )}
    </div>
  );
}

// ───────────────────────── Announcements ─────────────────────────

function ParentAnnouncements() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .getAnnouncements()
      .then((d: any[]) => {
        if (cancelled) return;
        setItems(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const needle = q.trim().toLowerCase();
    return items.filter(
      (a) =>
        String(a.title || '').toLowerCase().includes(needle) ||
        String(a.message || '').toLowerCase().includes(needle),
    );
  }, [items, q]);

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="College-wide notices from the Academic Office"
        meta={
          items.length > 0 ? (
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-gray-400">Total</div>
              <div className="text-xl font-bold tabular-nums text-[#1A1A1A]">{items.length}</div>
            </div>
          ) : null
        }
      />

      {/* Search */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 flex items-center gap-2">
        <svg
          className="h-4 w-4 text-gray-400 shrink-0 ml-1"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search announcements…"
          className="flex-1 h-9 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
        />
        {q && (
          <button
            onClick={() => setQ('')}
            className="text-[11px] text-gray-400 hover:text-gray-700 px-2 h-9"
          >
            Clear
          </button>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        {loading ? (
          <SkeletonTable rows={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={q ? 'No matching announcements' : 'No announcements yet'}
            desc={
              q
                ? 'Try a different search term.'
                : 'College-wide announcements will appear here once published.'
            }
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((a, i) => (
              <AnnouncementRow key={a.id || i} a={a} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ───────────────────────── Coming Soon ─────────────────────────

function ComingSoon() {
  return (
    <div className="space-y-6">
      <PageHeader title="Coming Soon" subtitle="This module is under development." />
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <EmptyState
          icon={Sparkles}
          title="Module in development"
          desc="This section will be available soon. Please check back later."
        />
      </div>
    </div>
  );
}
