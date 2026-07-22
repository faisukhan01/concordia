'use client';

// ============================================================================
// Concordia College — Student Portal (spec §6.1)
//
// The Student role has VIEW-ONLY access to their own academic data. They
// receive notifications of: results, announcements, attendance, date sheets.
//
// Modules (exactly 7):
//   1. student-dashboard       — overview: stat cards + welcome banner
//   2. student-results         — list of all test results (subject, marks, grade, %)
//   3. student-report-card     — published term result cards (view-only)
//   4. student-attendance      — summary + chronological log
//   5. student-timetable       — weekly grid (Mon–Sat × periods)
//   6. student-datesheet       — exam date sheets (parsed from announcements)
//   7. student-announcements   — notices targeted at students
//
// Design language (matches admin / academic / admissions portals):
//   • Flat, restrained, grayscale + a single orange (#F26522) accent.
//   • No gradient welcome banners, no decorative blobs, no colored icon
//     tiles, no glassmorphism, no framer-motion.
//   • White cards on 1px gray borders, rounded-xl.
//   • Tables: uppercase muted headers, hover row tint, subtle status badges.
//   • Orange ONLY for primary actions and active states.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import {
  CalendarCheck,
  GraduationCap,
  Award,
  Bell,
  CalendarDays,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Megaphone,
  FileText,
} from 'lucide-react';

type Props = { activeModule: string; user: any };

// ───────────────────────── Shared helpers ─────────────────────────

/** Clean page header: thin orange accent line, h1, muted subtitle. */
function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="h-0.5 w-8 bg-[#F26522] mb-3" />
        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 flex gap-2 flex-wrap">{action}</div>}
    </div>
  );
}

/** Flat KPI card: white bg, 1px gray border, rounded-xl, small inline icon
 *  in top-right (muted gray). No colored icon tiles. No gradients. */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {label}
          </div>
          <div className="text-2xl font-bold text-[#1A1A1A] mt-1.5 truncate">{value}</div>
          {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
        </div>
        <Icon className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
      </div>
    </div>
  );
}

/** Clean section header: text-sm font-semibold + optional muted desc. */
function SectionHeader({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

/** Simple loading skeleton — muted gray pulse, no decorations. */
function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-gray-100', className)} />;
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  );
}

function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}

function SkeletonStatGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Restrained empty state: small muted icon + title + optional subtitle. */
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
      <Icon className="h-6 w-6 text-gray-300 mb-3" />
      <div className="text-sm font-medium text-[#1A1A1A]">{title}</div>
      {desc && <div className="text-xs text-gray-500 mt-1 max-w-sm">{desc}</div>}
    </div>
  );
}

function ErrorRow({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-6 w-6 text-rose-400 mb-3" />
      <div className="text-sm font-medium text-[#1A1A1A]">
        {message || 'Something went wrong'}
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 h-8 border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          Try again
        </Button>
      )}
    </div>
  );
}

// ───────────────────────── Formatters & misc ─────────────────────────

const formatDate = (iso?: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const relativeTime = (iso?: string) => {
  if (!iso) return '';
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.round((now - then) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return formatDate(iso);
  } catch {
    return iso;
  }
};

/** Derive a readable subject label from a result row.
 *  Backend returns `courseId` (e.g. "CR-DEMO-MATH") — strip prefixes and
 *  prettify. Falls back to 'General' when nothing is available. */
const subjectLabel = (r: any): string => {
  if (r.subject) return r.subject;
  const cid = (r.courseId || '').trim();
  if (!cid) return 'General';
  // Strip common ID prefixes: "CR-DEMO-", "CR-", "C-", etc.
  const cleaned = cid.replace(/^[A-Z]{1,3}-([A-Z]+-)?/, '');
  if (!cleaned) return cid;
  return cleaned
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/** Compute percentage defensively. Backend demo seed stores `obtained`
 *  but the GET handler returns `marks` — accept either. */
const computePercentage = (r: any): number => {
  const marks = Number(r.marks ?? r.obtained ?? 0);
  const total = Number(r.totalMarks || 100);
  if (!total || isNaN(marks)) return 0;
  return Math.max(0, Math.min(100, Math.round((marks / total) * 100)));
};

const gradeTone = (grade?: string) => {
  const g = (grade || '').toUpperCase().trim();
  if (!g) return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
  if (g.startsWith('A')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' };
  if (g.startsWith('B')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' };
  if (g.startsWith('C')) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' };
  if (g.startsWith('D') || g.startsWith('F')) return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' };
  return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
};

const barTone = (pct: number) => {
  if (pct >= 75) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
};

// ───────────────────────── Small shared components ─────────────────────────

function GradeBadge({ grade, large }: { grade?: string; large?: boolean }) {
  const tone = gradeTone(grade);
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md border font-semibold',
        tone.bg,
        tone.text,
        tone.border,
        large ? 'h-10 px-3 text-base' : 'h-6 px-2 text-[11px]',
      )}
    >
      {grade || '—'}
    </span>
  );
}

function PercentageBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden min-w-[60px]">
        <div
          className={cn('h-full rounded-full transition-all', barTone(v))}
          style={{ width: `${v}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 tabular-nums w-9 text-right">{v}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  const cls =
    s === 'present' || s === 'upcoming' || s === 'active' || s === 'completed' || s === 'published'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : s === 'absent' || s === 'overdue' || s === 'past' || s === 'missed'
        ? 'bg-rose-50 text-rose-700 border-rose-100'
        : s === 'late' || s === 'pending' || s === 'scheduled'
          ? 'bg-amber-50 text-amber-700 border-amber-100'
          : 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize',
        cls,
      )}
    >
      {status || '—'}
    </span>
  );
}

// ───────────────────────── Router ─────────────────────────

export function StudentPortal({ activeModule, user }: Props) {
  switch (activeModule) {
    case 'student-dashboard':
      return <StudentDashboard user={user} />;
    case 'student-results':
      return <StudentResults user={user} />;
    case 'student-report-card':
      return <StudentReportCard user={user} />;
    case 'student-attendance':
      return <StudentAttendance user={user} />;
    case 'student-timetable':
      return <StudentTimetable user={user} />;
    case 'student-datesheet':
      return <StudentDateSheets user={user} />;
    case 'student-announcements':
      return <StudentAnnouncements user={user} />;
    default:
      return <ComingSoon />;
  }
}

// ───────────────────────── 1. Dashboard ─────────────────────────

function StudentDashboard({ user }: { user: any }) {
  const { setActiveModule } = useApp();
  const [loading, setLoading] = useState(true);
  const [att, setAtt] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  const studentId = user?.id;
  const classId = user?.classId;

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      studentId ? api.getAttendance({ studentId }) : Promise.reject(new Error('no id')),
      studentId ? api.getResults({ studentId }) : Promise.reject(new Error('no id')),
      studentId ? api.getReportCards({ studentId }) : Promise.reject(new Error('no id')),
      api.getAnnouncements(),
    ]).then(([a, r, rc, an]) => {
      if (cancelled) return;
      if (a.status === 'fulfilled') setAtt(a.value);
      if (r.status === 'fulfilled') {
        const d = r.value;
        setResults(Array.isArray(d) ? d : d?.entries || []);
      }
      if (rc.status === 'fulfilled') setReportCards(Array.isArray(rc.value) ? rc.value : []);
      if (an.status === 'fulfilled') {
        const all = Array.isArray(an.value) ? an.value : [];
        const scoped = all
          .filter((x: any) => {
            const role = (x.targetRole || '').toLowerCase();
            const scope = (x.targetScope || 'all').toLowerCase();
            if (role && role !== 'student' && role !== 'all') return false;
            if (scope === 'class' && x.classId && classId && x.classId !== classId) return false;
            return true;
          })
          .sort((x: any, y: any) => new Date(y.createdAt || 0).getTime() - new Date(x.createdAt || 0).getTime());
        setAnnouncements(scoped);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [studentId, classId, retryCount]);

  const attRate = useMemo(() => {
    if (!att) return null;
    const present = Number(att.present || 0);
    const total = Number(att.total || att.entries?.length || 0);
    if (!total) return null;
    return Math.round((present / total) * 100);
  }, [att]);

  const avgScore = useMemo(() => {
    if (!results.length) return null;
    const sum = results.reduce((s, r) => s + computePercentage(r), 0);
    return Math.round(sum / results.length);
  }, [results]);

  const pendingResults = reportCards.length;
  const announcementCount = announcements.length;
  const recent = announcements.slice(0, 3);
  const firstName = (user?.name || 'Student').split(' ')[0];

  const retry = () => {
    setLoading(true);
    setRetryCount((c) => c + 1);
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Welcome banner — flat, no gradient */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="h-0.5 w-8 bg-[#F26522] mb-3" />
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              {user?.class ? `${user.class}` : 'Student'}
              {user?.section ? ` · Section ${user.section}` : ''}
              {user?.rollNo ? ` · Roll No ${user.rollNo}` : ''}
            </p>
          </div>
          <div className="text-xs text-gray-400 shrink-0">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <SkeletonStatGrid />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={CalendarCheck}
            label="Attendance Rate"
            value={attRate !== null ? `${attRate}%` : '—'}
            sub={att ? `${att.present || 0} of ${att.total || 0} sessions present` : 'No attendance recorded'}
          />
          <StatCard
            icon={GraduationCap}
            label="Average Score"
            value={avgScore !== null ? `${avgScore}%` : '—'}
            sub={`${results.length} ${results.length === 1 ? 'result' : 'results'} recorded`}
          />
          <StatCard
            icon={Award}
            label="Report Cards"
            value={pendingResults}
            sub={pendingResults ? 'Published' : 'None published yet'}
          />
          <StatCard
            icon={Bell}
            label="Announcements"
            value={announcementCount}
            sub={announcementCount ? `${announcementCount} notice${announcementCount === 1 ? '' : 's'}` : 'No notices'}
          />
        </div>
      )}

      {/* Recent announcements panel */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="p-5 pb-0">
          <SectionHeader
            title="Recent Announcements"
            desc="Latest notices from your college."
            action={
              announcementCount > 0 ? (
                <button
                  onClick={() => setActiveModule('student-announcements')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#F26522] transition-colors"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </button>
              ) : undefined
            }
          />
        </div>
        {loading ? (
          <div className="p-5 pt-0">
            <SkeletonCards count={3} />
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No announcements yet"
            desc="College-wide notices will appear here once published."
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {recent.map((a) => (
              <button
                key={a.id}
                onClick={() => setActiveModule('student-announcements')}
                className="w-full text-left p-5 hover:bg-gray-50/60 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-50 border border-gray-100 grid place-items-center shrink-0">
                    <Megaphone className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                        {a.senderRole || 'College'}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-[11px] text-gray-400">{relativeTime(a.createdAt)}</span>
                    </div>
                    <div className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#F26522] transition-colors truncate">
                      {a.title}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{a.message}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-[#F26522] transition-colors shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── 2. My Results ─────────────────────────

function StudentResults({ user }: { user: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const studentId = user?.id;

  useEffect(() => {
    let cancelled = false;
    api
      .getResults({ studentId })
      .then((d: any) => {
        if (cancelled) return;
        const arr = Array.isArray(d) ? d : d?.entries || [];
        arr.sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setItems(arr);
        setError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        toast({ title: 'Failed to load results', variant: 'destructive' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, retryCount]);

  const avg = useMemo(() => {
    if (!items.length) return null;
    return Math.round(items.reduce((s, r) => s + computePercentage(r), 0) / items.length);
  }, [items]);

  const retry = () => {
    setLoading(true);
    setError(false);
    setRetryCount((c) => c + 1);
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      <PageHeader
        title="My Results"
        subtitle="Your test scores across all examinations."
        action={
          avg !== null ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 h-9">
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Average</span>
              <span className="text-sm font-semibold text-[#1A1A1A]">{avg}%</span>
            </div>
          ) : undefined
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <SkeletonTable rows={4} />
        ) : error ? (
          <ErrorRow message="Couldn't load your results." onRetry={retry} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No results published yet"
            desc="Your test scores will appear here once teachers post them."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-gray-100">
                  <TableHead className="uppercase text-[11px] tracking-wider text-gray-400 font-semibold pl-5">
                    Subject
                  </TableHead>
                  <TableHead className="uppercase text-[11px] tracking-wider text-gray-400 font-semibold">
                    Exam
                  </TableHead>
                  <TableHead className="uppercase text-[11px] tracking-wider text-gray-400 font-semibold">
                    Date
                  </TableHead>
                  <TableHead className="uppercase text-[11px] tracking-wider text-gray-400 font-semibold">
                    Marks
                  </TableHead>
                  <TableHead className="uppercase text-[11px] tracking-wider text-gray-400 font-semibold">
                    Grade
                  </TableHead>
                  <TableHead className="uppercase text-[11px] tracking-wider text-gray-400 font-semibold w-48 pr-5">
                    Percentage
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r, i) => {
                  const pct = computePercentage(r);
                  const marks = r.marks ?? r.obtained;
                  return (
                    <TableRow
                      key={r.id || i}
                      className="border-gray-100 hover:bg-gray-50/60 transition-colors"
                    >
                      <TableCell className="font-medium text-[#1A1A1A] pl-5">
                        {subjectLabel(r)}
                      </TableCell>
                      <TableCell className="text-gray-600">{r.exam || '—'}</TableCell>
                      <TableCell className="text-gray-500 tabular-nums">
                        {formatDate(r.date) || '—'}
                      </TableCell>
                      <TableCell className="text-gray-700 tabular-nums">
                        {marks !== undefined && marks !== null ? (
                          <>
                            <span className="font-medium text-[#1A1A1A]">{marks}</span>
                            <span className="text-gray-400"> / {r.totalMarks || 100}</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <GradeBadge grade={r.grade} />
                      </TableCell>
                      <TableCell className="pr-5">
                        <PercentageBar value={pct} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── 3. Report Card ─────────────────────────

function StudentReportCard({ user }: { user: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const studentId = user?.id;

  useEffect(() => {
    let cancelled = false;
    api
      .getReportCards({ studentId })
      .then((d: any) => {
        if (cancelled) return;
        const arr = Array.isArray(d) ? d : [];
        arr.sort((a: any, b: any) => {
          const ta = new Date(a.generatedAt || a.createdAt || 0).getTime();
          const tb = new Date(b.generatedAt || b.createdAt || 0).getTime();
          return tb - ta;
        });
        setItems(arr);
        setError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        toast({ title: 'Failed to load report cards', variant: 'destructive' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, retryCount]);

  const retry = () => {
    setLoading(true);
    setError(false);
    setRetryCount((c) => c + 1);
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      <PageHeader title="Report Card" subtitle="Your published term result cards." />

      {loading ? (
        <div className="space-y-4">
          <SkeletonCards count={2} />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-gray-200 bg-white">
          <ErrorRow message="Couldn't load your report cards." onRetry={retry} />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white">
          <EmptyState
            icon={Award}
            title="No report card published yet"
            desc="Your term result card will appear here once the academic office publishes it."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((rc) => (
            <ReportCardItem key={rc.id} rc={rc} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCardItem({ rc }: { rc: any }) {
  const pct = Math.round(Number(rc.percentage || 0));
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {rc.term && (
              <span className="inline-flex items-center rounded-md border border-[#F26522]/20 bg-[#FFF0E8] px-2 py-0.5 text-[11px] font-medium text-[#F26522]">
                {rc.term}
              </span>
            )}
            <span className="text-[11px] text-gray-400">
              {formatDate(rc.generatedAt || rc.createdAt) || 'Recently'}
            </span>
          </div>
          <h3 className="text-base font-semibold text-[#1A1A1A] mt-2">
            {rc.examName || rc.term || 'Result Card'}
          </h3>
          {(rc.class || rc.section) && (
            <p className="text-xs text-gray-500 mt-0.5">
              {rc.class || '—'}
              {rc.section ? ` · Section ${rc.section}` : ''}
            </p>
          )}
        </div>
        <GradeBadge grade={rc.grade} large />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-gray-100">
        <div className="p-4 sm:p-5">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
            Obtained
          </div>
          <div className="text-lg font-bold text-[#1A1A1A] mt-1.5 tabular-nums">
            {rc.obtainedMarks ?? '—'}
            <span className="text-sm text-gray-400 font-normal"> / {rc.totalMarks ?? '—'}</span>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
            Percentage
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-lg font-bold text-[#1A1A1A] tabular-nums">{pct}%</span>
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden min-w-[40px]">
              <div
                className={cn('h-full rounded-full', barTone(pct))}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
            Grade
          </div>
          <div className="text-lg font-bold text-[#1A1A1A] mt-1.5">{rc.grade || '—'}</div>
        </div>
      </div>

      {/* Remarks */}
      {rc.remarks && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/40">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
            Remarks
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{rc.remarks}</p>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── 4. My Attendance ─────────────────────────

function StudentAttendance({ user }: { user: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const studentId = user?.id;

  useEffect(() => {
    let cancelled = false;
    api
      .getAttendance({ studentId })
      .then((d: any) => {
        if (cancelled) return;
        setData(d);
        setError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        toast({ title: 'Failed to load attendance', variant: 'destructive' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, retryCount]);

  const present = Number(data?.present || 0);
  const absent = Number(data?.absent || 0);
  const late = Number(data?.late || 0);
  const total = Number(data?.total || data?.entries?.length || 0);
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;
  const entries: any[] = data?.entries || [];

  const retry = () => {
    setLoading(true);
    setError(false);
    setRetryCount((c) => c + 1);
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      <PageHeader title="My Attendance" subtitle="Your attendance record across all sessions." />

      {/* Summary card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {/* Rate — emphasised */}
            <div className="col-span-2 sm:col-span-1">
              <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                Attendance Rate
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold text-[#1A1A1A] tabular-nums">{rate}</span>
                <span className="text-lg font-semibold text-gray-400">%</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{total} sessions total</div>
            </div>

            {/* Present */}
            <SummaryStat
              icon={CheckCircle2}
              label="Present"
              value={present}
              tone="text-emerald-600"
            />
            {/* Absent */}
            <SummaryStat icon={XCircle} label="Absent" value={absent} tone="text-rose-600" />
            {/* Late */}
            <SummaryStat icon={Clock} label="Late" value={late} tone="text-amber-600" />
          </div>
        )}
      </div>

      {/* Log */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="p-5 pb-0">
          <SectionHeader
            title="Attendance Log"
            desc={
              entries.length
                ? `${entries.length} ${entries.length === 1 ? 'session' : 'sessions'} recorded.`
                : undefined
            }
          />
        </div>
        {loading ? (
          <SkeletonTable rows={5} />
        ) : error ? (
          <ErrorRow message="Couldn't load your attendance." onRetry={retry} />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No attendance recorded yet"
            desc="Your attendance entries will appear here once teachers start marking."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-gray-100">
                  <TableHead className="uppercase text-[11px] tracking-wider text-gray-400 font-semibold pl-5">
                    Date
                  </TableHead>
                  <TableHead className="uppercase text-[11px] tracking-wider text-gray-400 font-semibold">
                    Day
                  </TableHead>
                  <TableHead className="uppercase text-[11px] tracking-wider text-gray-400 font-semibold pr-5">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e, i) => {
                  const d = e.date ? new Date(e.date) : null;
                  return (
                    <TableRow
                      key={e.id || i}
                      className="border-gray-100 hover:bg-gray-50/60 transition-colors"
                    >
                      <TableCell className="font-medium text-[#1A1A1A] pl-5 tabular-nums">
                        {formatDate(e.date) || '—'}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {d ? d.toLocaleDateString('en-US', { weekday: 'long' }) : '—'}
                      </TableCell>
                      <TableCell className="pr-5">
                        <StatusBadge status={e.status || 'Unknown'} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Icon className={cn('h-3.5 w-3.5', tone)} />
        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-[#1A1A1A] mt-1.5 tabular-nums">{value}</div>
    </div>
  );
}

// ───────────────────────── 5. Timetable ─────────────────────────

const TIMETABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function StudentTimetable({ user }: { user: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const classId = user?.classId;

  useEffect(() => {
    let cancelled = false;
    // If classId is missing, resolve with [] so loading completes gracefully.
    const promise = classId
      ? api.getTimetable({ classId })
      : Promise.resolve([]);
    promise
      .then((d: any) => {
        if (cancelled) return;
        setItems(Array.isArray(d) ? d : []);
        setError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        toast({ title: 'Failed to load timetable', variant: 'destructive' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId, retryCount]);

  const byDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    TIMETABLE_DAYS.forEach((d) => (map[d] = []));
    items.forEach((e) => {
      const day = e.day;
      if (map[day]) map[day].push(e);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => (Number(a.period) || 0) - (Number(b.period) || 0)),
    );
    return map;
  }, [items]);

  const maxPeriods = useMemo(
    () => Math.max(1, ...items.map((e) => Number(e.period) || 0)),
    [items],
  );

  const retry = () => {
    setLoading(true);
    setError(false);
    setRetryCount((c) => c + 1);
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      <PageHeader title="Timetable" subtitle="Your weekly class schedule." />

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        {loading ? (
          <SkeletonTable rows={5} />
        ) : error ? (
          <ErrorRow message="Couldn't load your timetable." onRetry={retry} />
        ) : !classId ? (
          <EmptyState
            icon={Calendar}
            title="Class not assigned"
            desc="Your timetable will appear here once your class is set up."
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Timetable not published yet"
            desc="Your weekly schedule will appear here once the academic office publishes it."
          />
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full border-collapse min-w-[760px]">
              <thead>
                <tr>
                  <th className="w-14 text-left text-[11px] uppercase tracking-wider text-gray-400 font-semibold pb-3 pr-2">
                    Period
                  </th>
                  {TIMETABLE_DAYS.map((d) => (
                    <th
                      key={d}
                      className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-semibold pb-3 px-2"
                    >
                      {d.slice(0, 3)}
                      <span className="hidden sm:inline"> {d.slice(3)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxPeriods }).map((_, periodIdx) => {
                  const period = periodIdx + 1;
                  return (
                    <tr key={period}>
                      <td className="align-top pr-2 pb-2">
                        <div className="h-9 w-9 rounded-lg bg-gray-50 border border-gray-100 grid place-items-center text-xs font-semibold text-gray-500 tabular-nums">
                          {period}
                        </div>
                      </td>
                      {TIMETABLE_DAYS.map((day) => {
                        const entry = byDay[day].find((e) => Number(e.period) === period);
                        return (
                          <td key={day} className="align-top px-1 pb-2">
                            {entry ? (
                              <TimetableCell entry={entry} />
                            ) : (
                              <div className="h-[60px] rounded-lg border border-dashed border-gray-100 grid place-items-center">
                                <span className="text-gray-300 text-xs">—</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TimetableCell({ entry }: { entry: any }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2.5 hover:border-[#F26522]/40 hover:shadow-sm transition-all min-h-[60px]">
      <div className="text-xs font-semibold text-[#1A1A1A] truncate leading-tight">
        {entry.subject || 'Subject'}
      </div>
      {entry.teacherName && (
        <div className="text-[10px] text-gray-500 truncate mt-0.5">{entry.teacherName}</div>
      )}
      {(entry.startTime || entry.endTime) && (
        <div className="text-[10px] text-gray-400 tabular-nums mt-0.5">
          {entry.startTime || ''}
          {entry.startTime && entry.endTime ? '–' : ''}
          {entry.endTime || ''}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── 6. Date Sheets ─────────────────────────

function StudentDateSheets({ user }: { user: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const classId = user?.classId;

  useEffect(() => {
    let cancelled = false;
    api
      .getAnnouncements()
      .then((d: any) => {
        if (cancelled) return;
        const all = Array.isArray(d) ? d : [];
        const scoped = all
          .filter((a: any) => {
            if (!a.title?.startsWith('Date Sheet:')) return false;
            const role = (a.targetRole || '').toLowerCase();
            if (role && role !== 'student' && role !== 'all') return false;
            const scope = (a.targetScope || 'all').toLowerCase();
            if (scope === 'class' && a.classId && classId && a.classId !== classId) return false;
            return true;
          })
          .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setItems(scoped);
        setError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        toast({ title: 'Failed to load date sheets', variant: 'destructive' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId, retryCount]);

  const retry = () => {
    setLoading(true);
    setError(false);
    setRetryCount((c) => c + 1);
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      <PageHeader title="Date Sheets" subtitle="Upcoming and past examination schedules." />

      {loading ? (
        <SkeletonCards count={2} />
      ) : error ? (
        <div className="rounded-xl border border-gray-200 bg-white">
          <ErrorRow message="Couldn't load date sheets." onRetry={retry} />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white">
          <EmptyState
            icon={CalendarDays}
            title="No date sheets published yet"
            desc="Exam schedules will appear here once the academic office publishes them."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((ds) => (
            <DateSheetCard key={ds.id} ds={ds} />
          ))}
        </div>
      )}
    </div>
  );
}

function DateSheetCard({ ds }: { ds: any }) {
  // Title format: "Date Sheet: {examName} — {class}"
  const titleStr = (ds.title || '').replace(/^Date Sheet:\s*/, '');
  const titleParts = titleStr.split('—').map((s: string) => s.trim());
  const examName = titleParts[0] || 'Exam';
  const className = titleParts[1] || '';

  // Message format: lines of "Subject — Date at Time"
  const rows = useMemo(() => {
    const lines = (ds.message || '').split('\n').filter((l: string) => l.trim());
    return lines.map((line: string) => {
      const m = line.match(/^(.+?)\s+—\s+(.+?)(?:\s+at\s+(.+))?$/);
      if (!m) return { subject: line.trim(), date: '', time: '', past: false };
      const subject = m[1].trim();
      const date = m[2].trim();
      const time = (m[3] || '').trim();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let past = false;
      try {
        past = date ? new Date(date) < today : false;
      } catch {
        past = false;
      }
      return { subject, date, time, past };
    });
  }, [ds.message]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          {className && (
            <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {className}
            </span>
          )}
          <span className="text-[11px] text-gray-400">
            Published {relativeTime(ds.createdAt)}
          </span>
        </div>
        <h3 className="text-base font-semibold text-[#1A1A1A] mt-2">{examName}</h3>
      </div>

      {/* Schedule */}
      {rows.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No subjects scheduled" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-gray-100">
                <TableHead className="uppercase text-[11px] tracking-wider text-gray-400 font-semibold pl-5">
                  Subject
                </TableHead>
                <TableHead className="uppercase text-[11px] tracking-wider text-gray-400 font-semibold">
                  Date
                </TableHead>
                <TableHead className="uppercase text-[11px] tracking-wider text-gray-400 font-semibold">
                  Time
                </TableHead>
                <TableHead className="uppercase text-[11px] tracking-wider text-gray-400 font-semibold pr-5">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow
                  key={i}
                  className="border-gray-100 hover:bg-gray-50/60 transition-colors"
                >
                  <TableCell className="font-medium text-[#1A1A1A] pl-5">{r.subject}</TableCell>
                  <TableCell className="text-gray-700 tabular-nums">
                    {r.date ? formatDate(r.date) : '—'}
                  </TableCell>
                  <TableCell className="text-gray-500 tabular-nums">{r.time || '—'}</TableCell>
                  <TableCell className="pr-5">
                    <StatusBadge status={r.past ? 'Past' : 'Upcoming'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── 7. Announcements ─────────────────────────

function StudentAnnouncements({ user }: { user: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const classId = user?.classId;

  useEffect(() => {
    let cancelled = false;
    api
      .getAnnouncements()
      .then((d: any) => {
        if (cancelled) return;
        const all = Array.isArray(d) ? d : [];
        const scoped = all
          .filter((a: any) => {
            // Exclude date-sheet announcements (they have their own page).
            if (a.title?.startsWith('Date Sheet:')) return false;
            const role = (a.targetRole || '').toLowerCase();
            if (role && role !== 'student' && role !== 'all') return false;
            const scope = (a.targetScope || 'all').toLowerCase();
            if (scope === 'class' && a.classId && classId && a.classId !== classId) return false;
            return true;
          })
          .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setItems(scoped);
        setError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        toast({ title: 'Failed to load announcements', variant: 'destructive' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId, retryCount]);

  const retry = () => {
    setLoading(true);
    setError(false);
    setRetryCount((c) => c + 1);
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      <PageHeader title="Announcements" subtitle="Notices and updates from your college." />

      {loading ? (
        <SkeletonCards count={3} />
      ) : error ? (
        <div className="rounded-xl border border-gray-200 bg-white">
          <ErrorRow message="Couldn't load announcements." onRetry={retry} />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white">
          <EmptyState
            icon={Bell}
            title="No announcements yet"
            desc="College-wide notices will appear here once published."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <AnnouncementCard key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ a }: { a: any }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-gray-50 border border-gray-100 grid place-items-center shrink-0">
          <Megaphone className="h-4 w-4 text-gray-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
              {a.senderRole || 'College'}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-[11px] text-gray-400">{relativeTime(a.createdAt)}</span>
          </div>
          <h3 className="text-sm font-semibold text-[#1A1A1A]">{a.title}</h3>
          {a.message && (
            <p className="text-sm text-gray-600 mt-1.5 whitespace-pre-wrap leading-relaxed">
              {a.message}
            </p>
          )}
          <div className="text-[11px] text-gray-400 mt-2.5">
            {formatDateTime(a.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Coming Soon (unknown module) ─────────────────────────

function ComingSoon() {
  return (
    <div className="animate-in fade-in-0 duration-200">
      <div className="rounded-xl border border-gray-200 bg-white">
        <EmptyState
          icon={FileText}
          title="Coming soon"
          desc="This module is not available yet."
        />
      </div>
    </div>
  );
}
