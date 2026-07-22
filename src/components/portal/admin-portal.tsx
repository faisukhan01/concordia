'use client';

// ============================================================================
// Concordia College — Admin Portal (spec §1.1)
//
// The Admin role sits at the top of the college and oversees every other
// role: admissions, accountant, academic, teachers, students and parents.
// This portal is intentionally READ-ONLY oversight — it surfaces people,
// money, academics and announcements across the whole institute. The
// Accountant / Academic Office / Admissions portals do the actual writes.
//
// Design language (matches admissions-portal — Task 5b standard):
//   • Flat, restrained, grayscale + a single orange (#F26522) accent.
//   • No gradient welcome banners, no decorative blobs, no colored icon
//     tiles, no glassmorphism, no framer-motion.
//   • White cards on 1px gray borders, rounded-xl.
//   • Tables: uppercase muted headers, hover row tint, subtle status
//     badges (bg tint + matching text — never saturated fills).
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Users,
  GraduationCap,
  DollarSign,
  Building2,
  TrendingUp,
  Megaphone,
  Calendar,
  Award,
  ClipboardList,
  BookOpen,
  Trophy,
  UserCog,
  Loader2,
  Search,
  Bell,
  FileText,
  CalendarDays,
  AlertCircle,
  ArrowRight,
  Inbox,
} from 'lucide-react';

// Sub-portal components — the admin can access every role's full portal.
// When the admin clicks a namespaced module (e.g. `admissions:admissions-new`)
// we delegate rendering to the dedicated portal component, passing the
// de-namespaced module ID. This gives the admin the EXACT same UI as the
// dedicated role portal, with zero code duplication.
import { AdmissionsPortal } from './admissions-portal';
import { AccountantPortal } from './accountant-portal';
import { AcademicPortal } from './academic-portal';
import { TeacherPortal } from './teacher-portal';
import { StudentPortal } from './student-portal';
import { ParentPortal } from './parent-portal';

type Props = { activeModule: string; user: any };

// ───────────────────────── Shared helpers ─────────────────────────

/** Clean page header: thin orange accent line, h1, muted subtitle.
 *  No gradients, no blobs, no decorative circles. */
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
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
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
          <div className="text-2xl font-bold text-gray-900 mt-1.5 truncate">{value}</div>
          {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
        </div>
        <Icon className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
      </div>
    </div>
  );
}

/** Clean section header: text-sm font-semibold + optional muted desc.
 *  NO orange vertical bar accent before the header. */
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
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
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

/** Restrained empty state: small muted icon + title + optional subtitle.
 *  NO big colored circles. */
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
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-5 w-5 text-gray-300 mb-2.5" />
      <div className="text-sm text-gray-500">{title}</div>
      {desc && <div className="text-xs text-gray-400 mt-1 max-w-sm">{desc}</div>}
    </div>
  );
}

/** Subtle status badge — bg tint + matching text, never saturated fills. */
function StatusBadge({ status }: { status?: string }) {
  const s = (status || 'Active').toLowerCase();
  const cls =
    s === 'paid' || s === 'active' || s === 'completed'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : s === 'pending' || s === 'partial' || s === 'unpaid'
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : s === 'blocked' || s === 'inactive' || s === 'overdue'
          ? 'bg-rose-50 text-rose-700 border-rose-100'
          : 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize',
        cls,
      )}
    >
      {status || 'Active'}
    </span>
  );
}

// ───────────────────────── Constants ─────────────────────────

const STAFF_ROLES = ['admin', 'admissions', 'accountant', 'academic'];
const STAFF_ROLE_LABEL: Record<string, string> = {
  admin: 'Administrator',
  admissions: 'Admissions Office',
  accountant: 'Accountant',
  academic: 'Academic Office',
};

const fmtMoney = (n: number) => `Rs ${(n || 0).toLocaleString()}`;

const safeJsonArray = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
};

const formatDate = (iso?: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

// ───────────────────────── Dashboard (admin-overview) ─────────────────────────

function AdminOverview({ user }: { user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = (user?.name || 'Admin').split(' ')[0];

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.scopedStats(user?.instituteId, user?.branchId).catch(() => null),
      api.platformUsers({}).catch(() => []),
      api.getAnnouncements().catch(() => []),
    ]).then(([s, u, a]) => {
      if (cancelled) return;
      setStats(s);
      setUsers(Array.isArray(u) ? u : []);
      setAnnouncements(Array.isArray(a) ? a.slice(0, 5) : []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.instituteId, user?.branchId]);

  const students = useMemo(() => users.filter((u) => u.role === 'student'), [users]);
  const teachers = useMemo(() => users.filter((u) => u.role === 'teacher'), [users]);
  const staff = useMemo(() => users.filter((u) => STAFF_ROLES.includes(u.role)), [users]);
  const feeCollected = stats?.totalRevenue ?? 0;

  const recentStudents = useMemo(
    () =>
      [...students]
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 6),
    [students],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Here's the college-wide overview for today."
      />

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={GraduationCap}
            label="Total Students"
            value={stats?.totalStudents ?? students.length}
            sub="Enrolled across all classes"
          />
          <StatCard
            icon={Users}
            label="Teachers"
            value={stats?.totalTeachers ?? teachers.length}
            sub="Active faculty members"
          />
          <StatCard
            icon={UserCog}
            label="Office Staff"
            value={staff.length}
            sub="Admissions · accounts · academics"
          />
          <StatCard
            icon={DollarSign}
            label="Fee Collected"
            value={fmtMoney(feeCollected)}
            sub="Collected this period"
          />
        </div>
      )}

      {/* Two-column main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent announcements */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader
            title="Recent Announcements"
            desc="Latest college-wide notices"
            action={<span className="text-[11px] text-gray-400">Last 5</span>}
          />
          {loading ? (
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              desc="Posts will appear here once published."
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {announcements.map((a, i) => (
                <li
                  key={a.id || i}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Megaphone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {a.title}
                      </span>
                      {a.targetRole && (
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                          {a.targetRole}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{a.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* At a glance */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="At a Glance" />
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (
            <ul className="space-y-1">
              {[
                { label: 'Total Branches', value: stats?.totalBranches ?? 1, icon: Building2 },
                { label: 'Active Classes', value: stats?.totalClasses ?? 0, icon: BookOpen },
                { label: 'Events This Month', value: stats?.totalEvents ?? 0, icon: Trophy },
                { label: 'Report Cards', value: stats?.totalReportCards ?? 0, icon: Award },
              ].map((s) => (
                <li
                  key={s.label}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <s.icon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{s.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{s.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent students table */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <SectionHeader
          title="Recent Students"
          desc="Latest enrolled students across the college"
          action={
            <span className="text-[11px] text-gray-400">{students.length} total</span>
          }
        />
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : recentStudents.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No students enrolled yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Roll No
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Name
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Class
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Guardian
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentStudents.map((u) => (
                <TableRow key={u.id} className="border-gray-100 hover:bg-gray-50">
                  <TableCell className="py-3 px-3 text-sm text-gray-500 font-mono">
                    {u.rollNo || '—'}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-sm font-medium text-gray-900">
                    {u.name}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-sm text-gray-700">
                    {u.class || '—'}
                    {u.section ? `-${u.section}` : ''}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-sm text-gray-500">
                    {u.fatherName || u.guardian || '—'}
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <StatusBadge status={u.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Analytics (admin-analytics) ─────────────────────────

function AnalyticsView() {
  // Sample trend data — muted colors, orange as the single accent series.
  // Replaced with live data once the analytics API is wired up.
  const enrollment = [
    { c: 'Grade 10', n: 48, p: 85 },
    { c: 'Grade 9', n: 36, p: 64 },
    { c: 'Grade 8', n: 28, p: 50 },
    { c: 'ICS', n: 22, p: 39 },
    { c: 'Grade 7', n: 18, p: 32 },
  ];
  const revenue = [65, 72, 58, 80, 92, 75, 88, 95, 70, 82, 90, 100];
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const maxRev = Math.max(...revenue);
  const attendance = [
    { c: 'Mon', v: 94 },
    { c: 'Tue', v: 91 },
    { c: 'Wed', v: 96 },
    { c: 'Thu', v: 89 },
    { c: 'Fri', v: 92 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="College performance insights across enrollment, revenue and attendance."
      />

      {/* Top KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          label="Total Enrollment"
          value={152}
          sub="+12 this month"
        />
        <StatCard icon={DollarSign} label="Revenue (YTD)" value="Rs 4.8M" sub="Across all branches" />
        <StatCard icon={Calendar} label="Avg Attendance" value="92.4%" sub="Last 30 days" />
        <StatCard icon={Award} label="Avg Score" value="78.6" sub="Latest term" />
      </div>

      {/* Chart row — clean CSS bars, orange as accent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue trend (orange accent) */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="Monthly Revenue Trend" desc="Last 12 months · Rs in thousands" />
          <div className="flex items-end gap-2 h-44 pt-2">
            {revenue.map((h, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
              >
                <div
                  className={cn(
                    'w-full rounded-t-sm transition-all',
                    i === revenue.length - 1 ? 'bg-[#F26522]' : 'bg-gray-200',
                  )}
                  style={{ height: `${(h / maxRev) * 100}%` }}
                  title={`Rs ${h}k`}
                />
                <span className="text-[10px] text-gray-400">{months[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[#F26522]" /> Current month
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-gray-200" /> Prior months
            </span>
          </div>
        </div>

        {/* Attendance by weekday */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="Attendance by Weekday" desc="Average rate · last 4 weeks" />
          <div className="flex items-end gap-3 h-44 pt-2">
            {attendance.map((a) => (
              <div
                key={a.c}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
              >
                <span className="text-[11px] font-semibold text-gray-700">{a.v}%</span>
                <div className="w-full rounded-t-sm bg-gray-800" style={{ height: `${a.v}%` }} />
                <span className="text-[10px] text-gray-400">{a.c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enrollment by class */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <SectionHeader title="Enrollment by Class" desc="Current academic year" />
        <div className="space-y-3">
          {enrollment.map((r) => (
            <div key={r.c}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-gray-700">{r.c}</span>
                <span className="text-gray-500">{r.n} students</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#F26522]"
                  style={{ width: `${r.p}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Announcements ─────────────────────────

function AnnouncementsView({ user }: { user: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const [target, setTarget] = useState('all');
  const [saving, setSaving] = useState(false);

  // Initial load — NO synchronous setState in the effect body.
  useEffect(() => {
    let cancelled = false;
    api
      .getAnnouncements()
      .then((d) => {
        if (cancelled) return;
        setItems(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Manual refresh (button / post-publish) — synchronous setState is fine here.
  const refresh = () => {
    setLoading(true);
    api
      .getAnnouncements()
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const submit = async () => {
    if (!title.trim() || !msg.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please add both a title and a message.',
      });
      return;
    }
    setSaving(true);
    try {
      await api.createAnnouncement({
        title,
        message: msg,
        targetRole: target === 'all' ? null : target,
        targetScope: 'all',
        instituteId: user?.instituteId,
        branchId: user?.branchId,
        senderId: user?.id,
        senderRole: user?.role,
      });
      setTitle('');
      setMsg('');
      setTarget('all');
      setShowForm(false);
      toast({ title: 'Announcement published' });
      refresh();
    } catch (e: any) {
      toast({ title: 'Could not publish', description: e?.message || 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.deleteAnnouncement(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
      toast({ title: 'Announcement deleted' });
    } catch (e: any) {
      toast({ title: 'Could not delete', description: e?.message || 'Please try again.' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        subtitle="College-wide notices visible to all roles."
        action={
          <Button
            onClick={() => setShowForm((v) => !v)}
            className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-4 text-sm font-medium"
          >
            <Megaphone className="h-4 w-4 mr-1.5" />
            {showForm ? 'Cancel' : 'New Announcement'}
          </Button>
        }
      />

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="New Announcement" desc="Visible to the selected audience" />
          <div className="space-y-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="h-9"
            />
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Write your message…"
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F26522]/20 focus:border-[#F26522] resize-none"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="h-9 w-[180px] text-sm">
                  <SelectValue placeholder="Audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="teacher">Teachers</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="parent">Parents</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={submit}
                disabled={saving}
                className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-4 text-sm font-medium ml-auto"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Megaphone className="h-4 w-4 mr-1.5" />
                )}
                Publish
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <SectionHeader title="Published Announcements" desc={`${items.length} total`} />
        {loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No announcements published yet"
            desc="Use the New Announcement button above to post your first notice."
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((a, i) => (
              <li
                key={a.id || i}
                className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0"
              >
                <Megaphone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{a.title}</span>
                    {a.targetRole && (
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                        → {a.targetRole}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.message}</p>
                  {a.createdAt && (
                    <p className="text-[11px] text-gray-400 mt-1">{formatDate(a.createdAt)}</p>
                  )}
                </div>
                <button
                  onClick={() => a.id && remove(a.id)}
                  className="text-[11px] text-gray-400 hover:text-rose-600 transition-colors shrink-0"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Students (admin-students) ─────────────────────────

function StudentsView() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    api
      .platformUsers({ role: 'student' })
      .then((d) => {
        if (cancelled) return;
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const classes = useMemo(() => {
    const set = new Set<string>();
    data.forEach((u) => {
      if (u.class) set.add(u.class);
    });
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.filter((u) => {
      if (classFilter !== 'all' && (u.class || '') !== classFilter) return false;
      if (!needle) return true;
      return [u.name, u.email, u.rollNo, u.class, u.fatherName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [data, q, classFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Students" subtitle="Read-only oversight of all enrolled students." />

      <div className="rounded-xl border border-gray-200 bg-white">
        {/* Toolbar */}
        <div className="p-5 pb-3 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, roll #, guardian…"
              className="pl-9 h-9"
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="h-9 w-full sm:w-[180px] text-sm">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-gray-400 sm:ml-auto">{filtered.length} record(s)</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-5 space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No students found"
            desc="Try adjusting your search or filter."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-5">
                  Roll No
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Name
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Class
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Guardian
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} className="border-gray-100 hover:bg-gray-50">
                  <TableCell className="py-3 px-5 text-sm text-gray-500 font-mono">
                    {u.rollNo || '—'}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-sm">
                    <div className="font-medium text-gray-900">{u.name}</div>
                    {u.email && <div className="text-[11px] text-gray-400">{u.email}</div>}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-sm text-gray-700">
                    {u.class || '—'}
                    {u.section ? `-${u.section}` : ''}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-sm text-gray-500">
                    {u.fatherName || u.guardian || '—'}
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <StatusBadge status={u.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Teachers (admin-teachers) ─────────────────────────

function TeachersView() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .platformUsers({ role: 'teacher' })
      .then((d) => {
        if (cancelled) return;
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((u) =>
      [u.name, u.email, u.id, u.subjects]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [data, q]);

  return (
    <div className="space-y-6">
      <PageHeader title="Teachers" subtitle="Read-only oversight of all faculty members." />

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="p-5 pb-3 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, ID, subject…"
              className="pl-9 h-9"
            />
          </div>
          <span className="text-xs text-gray-400 sm:ml-auto">{filtered.length} record(s)</span>
        </div>

        {loading ? (
          <div className="p-5 space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No teachers found" desc="Try adjusting your search." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-5">
                  ID
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Name
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Subjects
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Classes
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const subjects = safeJsonArray(u.subjects);
                const classesArr = safeJsonArray(u.classes).length
                  ? safeJsonArray(u.classes)
                  : u.class
                    ? [u.class]
                    : [];
                return (
                  <TableRow key={u.id} className="border-gray-100 hover:bg-gray-50">
                    <TableCell className="py-3 px-5 text-xs text-gray-500 font-mono">
                      {u.id?.slice(0, 10) || '—'}
                    </TableCell>
                    <TableCell className="py-3 px-3 text-sm">
                      <div className="font-medium text-gray-900">{u.name}</div>
                      {u.email && <div className="text-[11px] text-gray-400">{u.email}</div>}
                    </TableCell>
                    <TableCell className="py-3 px-3 text-sm">
                      {subjects.length ? (
                        <div className="flex flex-wrap gap-1">
                          {subjects.slice(0, 3).map((s, i) => (
                            <span
                              key={i}
                              className="text-[11px] text-gray-600 bg-gray-100 rounded px-1.5 py-0.5"
                            >
                              {s}
                            </span>
                          ))}
                          {subjects.length > 3 && (
                            <span className="text-[11px] text-gray-400">
                              +{subjects.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-3 text-sm text-gray-500">
                      {classesArr.length ? classesArr.join(', ') : '—'}
                    </TableCell>
                    <TableCell className="py-3 px-3">
                      <StatusBadge status={u.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Office Staff (admin-staff) ─────────────────────────

function StaffView() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .platformUsers({})
      .then((d) => {
        if (cancelled) return;
        const staff = (Array.isArray(d) ? d : []).filter((u) => STAFF_ROLES.includes(u.role));
        setData(staff);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((u) =>
      [u.name, u.email, u.role].filter(Boolean).join(' ').toLowerCase().includes(needle),
    );
  }, [data, q]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Office Staff"
        subtitle="College administrative team — admissions, accounts and academics."
      />

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="p-5 pb-3 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, role…"
              className="pl-9 h-9"
            />
          </div>
          <span className="text-xs text-gray-400 sm:ml-auto">{filtered.length} member(s)</span>
        </div>

        {loading ? (
          <div className="p-5 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="No staff found"
            desc="Office staff will appear here once added."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-5">
                  Name
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Role
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Email
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} className="border-gray-100 hover:bg-gray-50">
                  <TableCell className="py-3 px-5 text-sm">
                    <div className="font-medium text-gray-900">{u.name}</div>
                    {u.title && <div className="text-[11px] text-gray-400">{u.title}</div>}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-sm">
                    <span className="text-[11px] text-gray-600 bg-gray-100 rounded px-1.5 py-0.5">
                      {STAFF_ROLE_LABEL[u.role] || u.role}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-sm text-gray-500">
                    {u.email || '—'}
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <StatusBadge status={u.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Fee Management (admin-fees) ─────────────────────────

function FeesView() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getBranchInvoices()
      .then((d) => {
        if (cancelled) return;
        setInvoices(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    const total = invoices.reduce((s, i) => s + (i.amount || 0), 0);
    const paid = invoices
      .filter((i) => (i.status || '').toLowerCase() === 'paid')
      .reduce((s, i) => s + (i.paidAmount || i.amount || 0), 0);
    const pending = total - paid;
    const defaulters = invoices.filter((i) => (i.status || '').toLowerCase() !== 'paid').length;
    return { total, paid, pending, defaulters };
  }, [invoices]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Management"
        subtitle="Oversight of college fee collection and outstanding balances."
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label="Total Billed"
            value={fmtMoney(totals.total)}
            sub={`${invoices.length} invoices`}
          />
          <StatCard
            icon={TrendingUp}
            label="Collected"
            value={fmtMoney(totals.paid)}
            sub="Paid in full"
          />
          <StatCard
            icon={ClipboardList}
            label="Pending"
            value={fmtMoney(totals.pending)}
            sub="Outstanding balance"
          />
          <StatCard
            icon={AlertCircle}
            label="Defaulters"
            value={totals.defaulters}
            sub="Unpaid invoices"
          />
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="p-5 pb-3">
          <SectionHeader title="Recent Invoices" desc="Latest fee records" />
        </div>
        {loading ? (
          <div className="p-5 pt-0 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No invoices yet"
            desc="Fee invoices will appear here once generated."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-5">
                  Student
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Month
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Amount
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 py-2.5 px-3">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.slice(0, 25).map((i) => (
                <TableRow key={i.id} className="border-gray-100 hover:bg-gray-50">
                  <TableCell className="py-3 px-5 text-sm font-medium text-gray-900">
                    {i.studentName || '—'}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-sm text-gray-500">
                    {i.month || '—'} {i.year || ''}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-sm font-semibold text-gray-900">
                    {fmtMoney(i.amount || 0)}
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <StatusBadge status={i.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Academics (admin-academics) ─────────────────────────

function AcademicsView({ user }: { user: any }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.getClasses(user?.branchId).catch(() => []),
      api.getTimetable({ branchId: user?.branchId }).catch(() => []),
    ]).then(([c, t]) => {
      if (cancelled) return;
      setClasses(Array.isArray(c) ? c : []);
      setTimetable(Array.isArray(t) ? t : []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.branchId]);

  // Today's snapshot from the timetable entries.
  const todaySchedule = useMemo(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return timetable
      .filter((e) => (e.day || '').toLowerCase() === today.toLowerCase())
      .sort((a, b) => (a.period || 0) - (b.period || 0))
      .slice(0, 6);
  }, [timetable]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academics"
        subtitle="Overview of classes and the current day's timetable."
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={BookOpen}
            label="Active Classes"
            value={classes.length}
            sub="Across all grades"
          />
          <StatCard
            icon={Calendar}
            label="Timetable Entries"
            value={timetable.length}
            sub="Total scheduled periods"
          />
          <StatCard
            icon={CalendarDays}
            label="Today's Periods"
            value={todaySchedule.length}
            sub={new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes list */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="Classes" desc="All registered classes" />
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : classes.length === 0 ? (
            <EmptyState icon={BookOpen} title="No classes configured" />
          ) : (
            <ul className="divide-y divide-gray-100">
              {classes.slice(0, 8).map((c, i) => (
                <li
                  key={c.id || i}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {c.name || c.className || '—'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {c.section || c.sections?.length || 0} section(s)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Today's schedule */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="Today's Schedule" desc="Snapshot of periods scheduled for today" />
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : todaySchedule.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nothing scheduled for today"
              desc="Publish timetable entries to see them here."
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {todaySchedule.map((e, i) => (
                <li
                  key={e.id || i}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-gray-400 w-6">
                      P{e.period || i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {e.subject || e.courseName || '—'}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {e.className || e.class || ''}{' '}
                        {e.teacherName ? `· ${e.teacherName}` : ''}
                      </div>
                    </div>
                  </div>
                  {e.startTime && (
                    <span className="text-[11px] text-gray-400">
                      {e.startTime}
                      {e.endTime ? `–${e.endTime}` : ''}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Reports (admin-reports) ─────────────────────────

function ReportsView() {
  const reports = [
    {
      title: 'Enrollment Report',
      desc: 'Student admissions by class, program & month',
      icon: GraduationCap,
    },
    {
      title: 'Fee Report',
      desc: 'Fee collection, defaulters & outstanding',
      icon: DollarSign,
    },
    {
      title: 'Attendance Report',
      desc: 'Class-wise & student-wise attendance rates',
      icon: ClipboardList,
    },
    {
      title: 'Result Analysis',
      desc: 'Test performance by class, subject & student',
      icon: Award,
    },
    {
      title: 'Staff Report',
      desc: 'Office staff & teacher activity summary',
      icon: UserCog,
    },
    {
      title: 'Events Report',
      desc: 'College events participation & outcomes',
      icon: Trophy,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate college-wide analytical reports on demand."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => {
          const RIcon = r.icon;
          return (
            <button
              key={r.title}
              onClick={() =>
                toast({
                  title: 'Generating…',
                  description: `${r.title} is being prepared. We'll notify you when it's ready.`,
                })
              }
              className="text-left rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm group"
            >
              <div className="flex items-start gap-3">
                <RIcon className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900">{r.title}</div>
                  <p className="text-xs text-gray-500 mt-1">{r.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#F26522] transition-colors shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Scheduled reports</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Recurring reports (weekly / monthly) will be delivered to your inbox automatically.
              Configure schedule from each report card above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Events ─────────────────────────

function EventsView({ user }: { user: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getEvents({ instituteId: user?.instituteId })
      .then((d) => {
        if (cancelled) return;
        setItems(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.instituteId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        subtitle="College-wide academic and extracurricular events."
        action={
          <Button
            onClick={() =>
              toast({
                title: 'Coming soon',
                description: 'Event creation will be available shortly.',
              })
            }
            variant="outline"
            className="border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium"
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Add Event
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <EmptyState
            icon={Trophy}
            title="No events scheduled"
            desc="When events are added they will appear here as cards."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100 grid place-items-center shrink-0">
                  <Trophy className="h-4 w-4 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900 truncate">{e.title}</div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {e.startDate || 'TBD'}
                  </div>
                  {e.location && (
                    <div className="text-xs text-gray-400 mt-0.5">{e.location}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Coming Soon (fallback) ─────────────────────────

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} />
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <EmptyState
          icon={Inbox}
          title="Coming soon"
          desc="This module is under active development and will be available shortly."
        />
      </div>
    </div>
  );
}

// ───────────────────────── Main router ─────────────────────────
//
// The Admin sidebar uses namespaced module IDs for sub-portal modules:
//   `admissions:admissions-new`  →  <AdmissionsPortal activeModule="admissions-new" />
//   `accountant:accountant-challans`  →  <AccountantPortal activeModule="accountant-challans" />
//   `academic:timetable`  →  <AcademicPortal activeModule="timetable" />
//   `teacher:teacher-dashboard`  →  <TeacherPortal activeModule="teacher-dashboard" />
//   `student:my-results`  →  <StudentPortal activeModule="my-results" />
//   `parent:my-timetable`  →  <ParentPortal activeModule="my-timetable" />
//
// This gives the admin the EXACT same UI as each dedicated role portal.

export function AdminPortal({ activeModule, user }: Props) {
  // ── Sub-portal delegation (namespaced modules) ──
  if (activeModule && activeModule.includes(':')) {
    const [ns, modId] = activeModule.split(':', 2);
    const subModule = modId || '';
    switch (ns) {
      case 'admissions':
        return <div className="animate-in fade-in-0 duration-200"><AdmissionsPortal activeModule={subModule} user={user} /></div>;
      case 'accountant':
        return <div className="animate-in fade-in-0 duration-200"><AccountantPortal activeModule={subModule} user={user} /></div>;
      case 'academic':
        return <div className="animate-in fade-in-0 duration-200"><AcademicPortal activeModule={subModule} user={user} /></div>;
      case 'teacher':
        return <div className="animate-in fade-in-0 duration-200"><TeacherPortal activeModule={subModule} user={user} /></div>;
      case 'student':
        return <div className="animate-in fade-in-0 duration-200"><StudentPortal activeModule={subModule} user={user} /></div>;
      case 'parent':
        return <div className="animate-in fade-in-0 duration-200"><ParentPortal activeModule={subModule} user={user} /></div>;
    }
  }

  // ── Admin-native modules ──
  let content: React.ReactNode;
  switch (activeModule) {
    case 'admin-overview':
      content = <AdminOverview user={user} />;
      break;
    case 'admin-analytics':
      content = <AnalyticsView />;
      break;
    case 'announcements':
      content = <AnnouncementsView user={user} />;
      break;
    case 'admin-students':
      content = <StudentsView />;
      break;
    case 'admin-teachers':
      content = <TeachersView />;
      break;
    case 'admin-staff':
      content = <StaffView />;
      break;
    case 'admin-fees':
      content = <FeesView />;
      break;
    case 'admin-academics':
      content = <AcademicsView user={user} />;
      break;
    case 'admin-reports':
      content = <ReportsView />;
      break;
    case 'events':
      content = <EventsView user={user} />;
      break;
    // `settings` is intentionally NOT rendered here (handled elsewhere).
    default:
      content = <ComingSoon title="Module" />;
  }

  return <div className="animate-in fade-in-0 duration-200">{content}</div>;
}
