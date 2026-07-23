'use client';

// ============================================================================
// Concordia College — Admin Portal (spec §1.1)
//
// SIDEBAR (clean & neat, per user spec):
//   Main              → Admin Dashboard (flat single page)
//   Admission Office  → dropdown (sub-portal modules, NO dashboard)
//   Accountant        → dropdown (sub-portal modules, NO dashboard)
//   Academic Office   → dropdown (sub-portal modules, NO dashboard)
//   Account           → Settings (flat single page)
//
// The Admin Dashboard is the single place where the admin monitors
// everything happening across the whole institute / all portals. It
// surfaces live stats (students, teachers, staff, fee collection,
// announcements, attendance, results) plus quick-access cards that
// jump directly into a sub-portal module.
//
// All data is fetched live from the API. NO hardcoded / fake data.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  GraduationCap,
  DollarSign,
  Building2,
  Megaphone,
  Award,
  BookOpen,
  Trophy,
  UserCog,
  Inbox,
} from 'lucide-react';

// Sub-portal components — the admin accesses every role's full portal.
import { AdmissionsPortal } from './admissions-portal';
import { AccountantPortal } from './accountant-portal';
import { AcademicPortal } from './academic-portal';
import { useApp } from '@/lib/store';

type Props = { activeModule: string; user: any };

// ───────────────────────── Shared helpers ─────────────────────────

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

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  onClick,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'w-full text-left rounded-xl border border-gray-200 bg-white p-5 transition-all',
        onClick ? 'hover:border-[#F26522] hover:shadow-sm cursor-pointer' : 'cursor-default',
      )}
    >
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
    </button>
  );
}

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

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-gray-100', className)} />;
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
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-5 w-5 text-gray-300 mb-2.5" />
      <div className="text-sm text-gray-500">{title}</div>
      {desc && <div className="text-xs text-gray-400 mt-1 max-w-sm">{desc}</div>}
    </div>
  );
}

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

const fmtMoney = (n: number) => `Rs ${(n || 0).toLocaleString()}`;

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

// ═══════════════════════════════════════════════════════════════
// Admin Dashboard — the single monitoring page for the whole institute.
// Live stats + recent activity. Sub-portal access is via the sidebar
// dropdowns (Admission Office / Accountant / Academic Office).
// ═══════════════════════════════════════════════════════════════

function AdminDashboard({ user, setActiveModule }: { user: any; setActiveModule: (id: string) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = (user?.name || 'Admin').split(' ')[0];

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.scopedStats(user?.instituteId, user?.branchId).catch(() => null),
      api.platformUsers({}).catch(() => []),
      api.getAnnouncements().catch(() => []),
      api.getFeeInvoices({}).catch(() => []),
    ]).then(([s, u, a, f]) => {
      if (cancelled) return;
      setStats(s);
      setUsers(Array.isArray(u) ? u : []);
      setAnnouncements(Array.isArray(a) ? a.slice(0, 5) : []);
      setFees(Array.isArray(f) ? f.slice(0, 6) : []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.instituteId, user?.branchId]);

  const students = useMemo(() => users.filter((u) => u.role === 'student'), [users]);
  const teachers = useMemo(() => users.filter((u) => u.role === 'teacher'), [users]);
  const staff = useMemo(() => users.filter((u) => STAFF_ROLES.includes(u.role)), [users]);
  const feeCollected = stats?.totalRevenue ?? fees.filter((f) => f.status === 'Paid').reduce((s, f) => s + (f.paidAmount || f.amount || 0), 0);

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
        subtitle="Monitor everything happening across the whole institute and all portals."
      />

      {/* ── Live KPIs — no fake data, all from API ── */}
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
            onClick={() => setActiveModule('academic:academic-students')}
          />
          <StatCard
            icon={Users}
            label="Teachers"
            value={stats?.totalTeachers ?? teachers.length}
            sub="Active faculty members"
            onClick={() => setActiveModule('academic:academic-teachers')}
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
            onClick={() => setActiveModule('accountant:accountant-collect')}
          />
        </div>
      )}

      {/* ── Two-column: announcements + at-a-glance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              desc="Posts will appear here once the Academic Office publishes them."
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

      {/* ── Recent students table ── */}
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
          <EmptyState
            icon={GraduationCap}
            title="No students enrolled yet"
            desc="The Admission Office can enroll new students from the Admission Office portal."
          />
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

// ───────────────────────── Coming Soon ─────────────────────────

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-12 w-12 rounded-xl bg-[#FFF0E8] grid place-items-center mb-4">
        <Inbox className="h-6 w-6 text-[#F26522]" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-1 max-w-sm">
        This module is being prepared. Check back soon.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AdminPortal — main router
//
// The admin sidebar has flat pages (Admin Dashboard, Settings) and
// dropdown groups (Admission Office, Accountant, Academic Office).
// Dropdown items use namespaced IDs like `admissions:admissions-new`.
// The router delegates namespaced modules to the dedicated portal
// component, passing the de-namespaced module ID.
// ═══════════════════════════════════════════════════════════════

export function AdminPortal({ activeModule, user }: Props) {
  const setActiveModule = useApp(s => s.setActiveModule);

  // ── Sub-portal delegation (namespaced modules) ──
  if (activeModule && activeModule.includes(':')) {
    const [ns, modId] = activeModule.split(':', 2);
    const subModule = modId || '';

    switch (ns) {
      case 'admissions':
        return (
          <div className="animate-in fade-in-0 duration-200">
            <AdmissionsPortal activeModule={subModule} user={user} />
          </div>
        );
      case 'accountant':
        return (
          <div className="animate-in fade-in-0 duration-200">
            <AccountantPortal activeModule={subModule} user={user} />
          </div>
        );
      case 'academic':
        return (
          <div className="animate-in fade-in-0 duration-200">
            <AcademicPortal activeModule={subModule} user={user} />
          </div>
        );
    }
  }

  // ── Admin-native flat modules ──
  let content: React.ReactNode;
  switch (activeModule) {
    case 'admin-dashboard':
    case 'admin-overview':
      content = <AdminDashboard user={user} setActiveModule={setActiveModule} />;
      break;
    // `settings` is intentionally NOT rendered here (handled in role-portal.tsx).
    default:
      content = <ComingSoon title="Module" />;
  }

  return <div className="animate-in fade-in-0 duration-200">{content}</div>;
}
