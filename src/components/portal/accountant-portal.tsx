'use client';

// ============================================================================
// Concordia College — Accountant Portal (spec §3)
//
// Responsibilities:
//   1. View every student's data class-wise (read-only personal info)
//   2. Collect fee payments (cash / bank / wallet / card)
//   3. Generate student logins — username = roll number, default password.
//      Logins are issued AFTER the first fee payment is confirmed.
//   4. Generate + view fee challans (one per student per month)
//   5. Split the locked base fee into installments (sum must equal base fee)
//   6. Add miscellaneous charges (admission, registration, trip, exam, etc.)
//
// The base fee is set & LOCKED by the Admission Office — the Accountant can
// never change it. The Accountant only restructures HOW it is paid.
//
// Design language (matches admissions-portal Task 5b + admin-portal Task 5a):
//   • Flat, restrained, grayscale + a single orange (#F26522) accent.
//   • No gradient welcome banners, no decorative blobs, no colored icon
//     tiles, no glassmorphism, no framer-motion.
//   • White cards on 1px gray borders, rounded-xl.
//   • Tables: uppercase muted headers, hover row tint, subtle status
//     badges (bg tint + matching text — never saturated fills).
//   • Money amounts: text-gray-900 font-semibold (NEVER orange / green).
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
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
  Receipt,
  CreditCard,
  DollarSign,
  Lock,
  KeyRound,
  ClipboardList,
  Users,
  Loader2,
  Search,
  Copy,
  Check,
  AlertCircle,
  TrendingUp,
  FileText,
  Plus,
  GraduationCap,
  CalendarDays,
  Hash,
  Info,
  CheckCircle2,
  Printer,
  ArrowLeft,
  X,
} from 'lucide-react';

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

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-md" />
      ))}
    </div>
  );
}

/** Restrained empty state: small muted icon + title + optional subtitle.
 *  NO big colored circles. */
function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: any;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-6 w-6 text-gray-300 mb-3" />
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {desc && <p className="text-xs text-gray-500 mt-1 max-w-sm">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Subtle status badge — bg tint + matching text, never saturated fills. */
function StatusBadge({ status }: { status?: string }) {
  const s = (status || 'Pending').toLowerCase();
  const cls =
    s === 'paid' || s === 'completed' || s === 'active'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : s === 'pending' || s === 'partial' || s === 'unpaid'
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : s === 'overdue' || s === 'blocked' || s === 'inactive'
          ? 'bg-rose-50 text-rose-700 border-rose-100'
          : 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize',
        cls,
      )}
    >
      {status || 'Pending'}
    </span>
  );
}

/** Field wrapper: label above input, small asterisk for required fields. */
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">
        {label}
        {required && <span className="text-[#F26522] ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={cn(
          'text-sm font-medium text-gray-900 text-right',
          mono && 'font-mono text-xs',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        try {
          navigator.clipboard?.writeText(text);
        } catch {}
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#F26522] font-medium"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

/** Business-rule callout — base fee locked by Admissions. Gray, restrained. */
function LockedFeeCallout() {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex gap-3">
      <Info className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
      <div className="text-sm text-gray-600 leading-relaxed">
        <p className="font-semibold text-gray-900">Base fee is locked by the Admission Office.</p>
        <p className="mt-1">
          You can restructure payments (installments) and add miscellaneous charges, but{' '}
          <span className="font-medium text-gray-900">cannot alter the base amount itself</span>.
        </p>
      </div>
    </div>
  );
}

// Shared input className — keeps every input visually consistent.
const inputCls =
  'h-10 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/12';

// Shared button class names — keeps every primary/secondary action consistent.
const btnPrimary =
  'bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-4 text-sm font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-60';
const btnSecondary =
  'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium inline-flex items-center gap-1.5 transition-colors';

// ───────────────────────── Constants ─────────────────────────

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Card'];
const MISC_CHARGE_TYPES = [
  'Admission Fee',
  'Registration Fee',
  'Trip Fee',
  'Exam Fee',
  'Library Fee',
  'Lab Fee',
  'Other',
];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Default subject suggestions shown in the Teacher Logins tab when the
// api.reference() endpoint fails or returns an empty list.
const DEFAULT_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Urdu',
  'Islamiat', 'Pakistan Studies', 'Computer Science', 'Economics',
  'Accounting', 'Business Studies',
];

const fmtMoney = (n: number) => `Rs ${Number(n || 0).toLocaleString('en-PK')}`;

const formatDate = (iso?: string) => {
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

const monthName = (m: string | number) => {
  const i = typeof m === 'number' ? m - 1 : MONTHS.findIndex((x) => x === m);
  return MONTHS[i] || String(m);
};

const genDefaultPassword = () =>
  'concordia' + Math.floor(1000 + Math.random() * 9000).toString();

// Whether a student already has a real login (not the admissions placeholder).
// The admissions portal creates the row with a placeholder `tmp-…` password and
// an `@pending.concordia.edu.pk` email — the accountant swaps them for the real
// credentials when generating the login.
const hasRealLogin = (s: any) => {
  if (!s) return false;
  if (s.email && !String(s.email).includes('@pending.')) return true;
  if (s.password && !String(s.password).startsWith('tmp-')) return true;
  return false;
};

// A student's overall fee status: Paid / Pending / Overdue, derived from
// their invoice list.
function deriveFeeStatus(invoices: any[]): 'Paid' | 'Pending' | 'Overdue' {
  if (!invoices || invoices.length === 0) return 'Pending';
  const unpaid = invoices.filter((i) => (i.status || '').toLowerCase() !== 'paid');
  if (unpaid.length === 0) return 'Paid';
  const overdue = unpaid.some((i) => (i.status || '').toLowerCase() === 'overdue');
  return overdue ? 'Overdue' : 'Pending';
}

// Total paid amount across a student's invoices
const sumPaid = (invoices: any[]) =>
  invoices.reduce((acc, i) => acc + Number(i.paidAmount || 0), 0);

// Total outstanding across a student's invoices
const sumOutstanding = (invoices: any[]) =>
  invoices.reduce(
    (acc, i) =>
      acc +
      ((i.status || '').toLowerCase() === 'paid'
        ? 0
        : Number(i.amount || 0) - Number(i.paidAmount || 0)),
    0,
  );

// ───────────────────────── Main router ─────────────────────────

export function AccountantPortal({ activeModule, user }: Props) {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial + branch-change load. The effect body performs NO synchronous
  // setState — all state updates happen inside async promise callbacks.
  // `loading` starts true (useState initial), so we don't need to flip it
  // here on branch changes — the previous data stays visible until the new
  // data arrives, which keeps the UI smooth.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.platformUsers({ role: 'student', branchId: user?.branchId }).catch(() => []),
      api.getClasses(user?.branchId).catch(() => []),
      api.getBranchInvoices().catch(() => []),
    ]).then(([s, c, inv]) => {
      if (cancelled) return;
      setStudents(Array.isArray(s) ? s : []);
      setClasses(Array.isArray(c) ? c : []);
      setInvoices(Array.isArray(inv) ? inv : []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.branchId]);

  // Manual refresh (button clicks) may synchronously flip loading=true.
  const refresh = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.platformUsers({ role: 'student', branchId: user?.branchId }).catch(() => []),
      api.getClasses(user?.branchId).catch(() => []),
      api.getBranchInvoices().catch(() => []),
    ])
      .then(([s, c, inv]) => {
        setStudents(Array.isArray(s) ? s : []);
        setClasses(Array.isArray(c) ? c : []);
        setInvoices(Array.isArray(inv) ? inv : []);
      })
      .catch((e) => setError(e?.message || 'Failed to load data'))
      .finally(() => setLoading(false));
  };

  // Optimistic local upsert — keeps the UI responsive while the backend
  // catches up.
  const upsertStudent = (s: any) =>
    setStudents((prev) => {
      const idx = prev.findIndex((x) => x.id === s.id);
      if (idx === -1) return [s, ...prev];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...s };
      return copy;
    });

  const upsertInvoice = (inv: any) =>
    setInvoices((prev) => {
      const idx = prev.findIndex((x) => x.id === inv.id);
      if (idx === -1) return [inv, ...prev];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...inv };
      return copy;
    });

  let content: React.ReactNode;
  if (activeModule === 'accountant-students')
    content = (
      <StudentsView
        students={students}
        invoices={invoices}
        loading={loading}
        onRefresh={refresh}
      />
    );
  else if (activeModule === 'accountant-collect')
    content = (
      <CollectPaymentView
        user={user}
        students={students}
        invoices={invoices}
        loading={loading}
        onRefresh={refresh}
        onInvoiceUpdate={upsertInvoice}
        onStudentUpdate={upsertStudent}
      />
    );
  else if (activeModule === 'accountant-challans')
    content = (
      <ChallansView
        user={user}
        invoices={invoices}
        students={students}
        loading={loading}
        onRefresh={refresh}
        onInvoiceUpdate={upsertInvoice}
      />
    );
  else if (activeModule === 'accountant-installments')
    content = <InstallmentsView students={students} loading={loading} />;
  else if (activeModule === 'accountant-misc')
    content = <MiscChargesView students={students} />;
  else if (activeModule === 'accountant-logins')
    content = (
      <LoginsView user={user} students={students} loading={loading} onUpdate={upsertStudent} />
    );
  else
    content = (
      <OverviewView
        user={user}
        students={students}
        invoices={invoices}
        loading={loading}
      />
    );

  return <div className="animate-in fade-in-0 duration-200">{content}</div>;
}

// ───────────────────────── 1. Overview / Dashboard ─────────────────────────

function OverviewView({
  user,
  students,
  invoices,
  loading,
}: {
  user: any;
  students: any[];
  invoices: any[];
  loading: boolean;
}) {
  const firstName = (user?.name || 'Accountant').split(' ')[0];

  // KPIs derived from invoices + students
  const collected = useMemo(
    () =>
      invoices
        .filter((i) => (i.status || '').toLowerCase() === 'paid')
        .reduce((s, i) => s + Number(i.paidAmount || i.amount || 0), 0),
    [invoices],
  );
  const pending = useMemo(
    () =>
      invoices
        .filter((i) => (i.status || '').toLowerCase() !== 'paid')
        .reduce((s, i) => s + Number(i.amount || 0), 0),
    [invoices],
  );
  const overdue = useMemo(
    () => invoices.filter((i) => (i.status || '').toLowerCase() === 'overdue').length,
    [invoices],
  );
  const withLogin = useMemo(() => students.filter(hasRealLogin).length, [students]);

  // Recent payments — newest paid invoices first, top 8
  const recentPayments = useMemo(
    () =>
      invoices
        .filter((i) => (i.status || '').toLowerCase() === 'paid')
        .sort((a, b) => (b.paidAt || b.updatedAt || '').localeCompare(a.paidAt || a.updatedAt || ''))
        .slice(0, 8),
    [invoices],
  );

  // Monthly collection — last 6 months, current month in orange accent
  const monthly = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const total = invoices
        .filter((inv) => {
          if ((inv.status || '').toLowerCase() !== 'paid') return false;
          const pd = inv.paidAt ? new Date(inv.paidAt) : null;
          return !!pd && pd.getMonth() === m && pd.getFullYear() === y;
        })
        .reduce((acc, inv) => acc + Number(inv.paidAmount || inv.amount || 0), 0);
      buckets.push({
        label: d.toLocaleString('en-US', { month: 'short' }),
        total,
      });
    }
    return buckets;
  }, [invoices]);
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.total));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Fee collection, challans, and student logins — all in one place."
      />

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label="Total Collected"
            value={fmtMoney(collected)}
            sub="All paid invoices"
          />
          <StatCard
            icon={TrendingUp}
            label="Pending"
            value={fmtMoney(pending)}
            sub="Awaiting payment"
          />
          <StatCard
            icon={AlertCircle}
            label="Overdue"
            value={overdue}
            sub="Unpaid invoices past due"
          />
          <StatCard
            icon={KeyRound}
            label="Students with Login"
            value={withLogin}
            sub={`of ${students.length} enrolled`}
          />
        </div>
      )}

      {/* Monthly collection bar chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <SectionHeader
          title="Monthly Collection"
          desc="Total fee collected — last 6 months"
        />
        {loading ? (
          <Skeleton className="h-44 w-full rounded-md" />
        ) : (
          <div className="flex items-end gap-3 h-44 pt-2">
            {monthly.map((m, i) => {
              const isCurrent = i === monthly.length - 1;
              return (
                <div
                  key={m.label + i}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                >
                  <span className="text-[11px] font-semibold text-gray-700 tabular-nums">
                    {m.total > 0 ? `${(m.total / 1000).toFixed(0)}k` : ''}
                  </span>
                  <div
                    className={cn(
                      'w-full rounded-t-sm transition-all',
                      isCurrent ? 'bg-[#F26522]' : 'bg-gray-200',
                    )}
                    style={{ height: `${Math.max(4, (m.total / maxMonthly) * 100)}%` }}
                  />
                  <span className="text-[10px] text-gray-400">{m.label}</span>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[#F26522]" /> Current month
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-gray-200" /> Prior months
          </span>
        </div>
      </div>

      {/* Recent payments table */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <SectionHeader
          title="Recent Payments"
          desc="Latest fee collections"
          action={
            <span className="text-[11px] text-gray-400">{recentPayments.length} shown</span>
          }
        />
        {loading ? (
          <SkeletonTable rows={5} />
        ) : recentPayments.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No payments recorded yet"
            desc="Use Collect Payment to record a student's first fee payment."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 hover:bg-transparent">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Student
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Period
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                    Amount
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Method
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-center">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((p) => (
                  <TableRow key={p.id} className="border-gray-100 hover:bg-gray-50">
                    <TableCell className="text-sm font-medium text-gray-900">
                      {p.studentName || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {p.month ? monthName(p.month) : '—'}
                      {p.year ? ` ${p.year}` : ''}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-900 text-right tabular-nums">
                      {fmtMoney(Number(p.paidAmount || p.amount || 0))}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {p.paymentMethod || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(p.paidAt || p.updatedAt || p.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── 2. Students (class-wise) ─────────────────────────

function StudentsView({
  students,
  invoices,
  loading,
  onRefresh,
}: {
  students: any[];
  invoices: any[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => s.class && set.add(s.class));
    return Array.from(set).sort();
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (classFilter !== 'all' && s.class !== classFilter) return false;
      if (!q) return true;
      return (
        s.name?.toLowerCase().includes(q) ||
        s.rollNo?.toLowerCase().includes(q) ||
        s.fatherName?.toLowerCase().includes(q)
      );
    });
  }, [students, search, classFilter]);

  // Map studentId → invoice summary for fast table lookups
  const invoiceByStudent = useMemo(() => {
    const map: Record<string, any[]> = {};
    invoices.forEach((inv) => {
      const key = inv.studentId || inv.userId;
      if (!key) return;
      (map[key] ||= []).push(inv);
    });
    return map;
  }, [invoices]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students (Class-wise)"
        subtitle="View every enrolled student and their current fee standing."
        action={
          <Button
            variant="outline"
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium"
            onClick={onRefresh}
          >
            <Loader2 className={cn('h-4 w-4 mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll #, or father's name…"
              className={`${inputCls} pl-9`}
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className={`${inputCls} w-full sm:w-52`}>
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        {loading ? (
          <SkeletonTable rows={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={students.length === 0 ? 'No students enrolled' : 'No matching records'}
            desc={
              students.length === 0
                ? 'The Admission Office must enroll students first.'
                : 'Try adjusting your search or class filter.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 hover:bg-transparent">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Roll #
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Name
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Class
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                    Base Fee
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                    Paid
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                    Balance
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-center">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const invs = invoiceByStudent[s.id] || [];
                  const paid = sumPaid(invs);
                  const balance = sumOutstanding(invs);
                  const status = deriveFeeStatus(invs);
                  return (
                    <TableRow
                      key={s.id}
                      className="border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelected(s)}
                    >
                      <TableCell className="text-sm font-mono text-gray-700">
                        {s.rollNo || '—'}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {s.name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {s.class || '—'}
                        {s.section ? (
                          <span className="text-gray-400"> · {s.section}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 text-right tabular-nums">
                        {s.baseFee ? (
                          <span className="inline-flex items-center gap-1">
                            <Lock className="h-3 w-3 text-gray-400" />
                            {fmtMoney(Number(s.baseFee))}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-900 text-right tabular-nums">
                        {fmtMoney(paid)}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-900 text-right tabular-nums">
                        {fmtMoney(balance)}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Fee detail sheet */}
      <StudentFeeSheet
        student={selected}
        invoices={selected ? invoiceByStudent[selected.id] || [] : []}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function StudentFeeSheet({
  student,
  invoices,
  onClose,
}: {
  student: any | null;
  invoices: any[];
  onClose: () => void;
}) {
  if (!student) return null;
  const paid = sumPaid(invoices);
  const balance = sumOutstanding(invoices);
  const status = deriveFeeStatus(invoices);

  return (
    <Sheet open={!!student} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-white">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold text-gray-900">
            Fee Detail
          </SheetTitle>
          <SheetDescription className="text-sm text-gray-500">
            {student.name} · {student.rollNo || '—'}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-4">
          {/* Student info */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <Row label="Roll Number" value={student.rollNo || '—'} mono />
            <Row label="Class" value={`${student.class || '—'}${student.section ? ' · ' + student.section : ''}`} />
            <Row label="Program" value={student.program || '—'} />
            <Row label="Father / Guardian" value={student.fatherName || student.guardian || '—'} />
            <Row
              label="Base Fee (locked)"
              value={student.baseFee ? fmtMoney(Number(student.baseFee)) : 'Not set'}
              mono
            />
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Collected</p>
              <p className="text-base font-bold text-gray-900 mt-1 tabular-nums">
                {fmtMoney(paid)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Balance</p>
              <p className="text-base font-bold text-gray-900 mt-1 tabular-nums">
                {fmtMoney(balance)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Status</p>
              <div className="mt-1.5">
                <StatusBadge status={status} />
              </div>
            </div>
          </div>

          {/* Invoice list */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Invoices</h4>
            {invoices.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">
                No invoices issued yet. Generate a challan from the Fee Challans tab.
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 hover:bg-transparent">
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        Period
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                        Amount
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-center">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} className="border-gray-100">
                        <TableCell className="text-sm text-gray-700">
                          {inv.month ? monthName(inv.month) : '—'}
                          {inv.year ? ` ${inv.year}` : ''}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-gray-900 text-right tabular-nums">
                          {fmtMoney(Number(inv.amount || 0))}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={inv.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium w-full"
            onClick={onClose}
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ───────────────────────── 3. Collect Payment ─────────────────────────

function CollectPaymentView({
  user,
  students,
  invoices,
  loading,
  onRefresh,
  onInvoiceUpdate,
  onStudentUpdate,
}: {
  user: any;
  students: any[];
  invoices: any[];
  loading: boolean;
  onRefresh: () => void;
  onInvoiceUpdate: (inv: any) => void;
  onStudentUpdate: (s: any) => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [saving, setSaving] = useState(false);
  const [generatedLogin, setGeneratedLogin] = useState<{
    rollNo: string;
    password: string;
  } | null>(null);

  // When a student is selected, find their outstanding invoices.
  const studentInvoices = useMemo(() => {
    if (!selected) return [];
    return invoices.filter(
      (i) =>
        (i.studentId === selected.id || i.userId === selected.id) &&
        (i.status || '').toLowerCase() !== 'paid',
    );
  }, [invoices, selected]);

  const studentPaidTotal = useMemo(() => {
    if (!selected) return 0;
    return invoices
      .filter((i) => i.studentId === selected.id || i.userId === selected.id)
      .reduce((acc, i) => acc + Number(i.paidAmount || 0), 0);
  }, [invoices, selected]);

  const outstanding = useMemo(
    () =>
      studentInvoices.reduce(
        (acc, i) => acc + Number(i.amount || 0) - Number(i.paidAmount || 0),
        0,
      ),
    [studentInvoices],
  );

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.rollNo?.toLowerCase().includes(q) ||
        s.class?.toLowerCase().includes(q),
    );
  }, [students, search]);

  const submit = async () => {
    if (!selected) return;
    const v = Number(amount);
    if (!amount || isNaN(v) || v <= 0) {
      toast({
        title: 'Enter a valid amount',
        description: 'Payment amount must be a positive number.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    setGeneratedLogin(null);
    try {
      // Mark the first outstanding invoice paid (or partial if amount < invoice).
      const unpaid = studentInvoices[0];
      if (unpaid) {
        const updated = await api.markInvoicePaid(unpaid.id, v, method);
        onInvoiceUpdate({
          ...unpaid,
          ...updated,
          status: v >= Number(unpaid.amount) - Number(unpaid.paidAmount) ? 'Paid' : 'Partial',
          paidAmount: Number(unpaid.paidAmount || 0) + v,
          paidAt: new Date().toISOString(),
          paymentMethod: method,
        });
      }
      toast({
        title: 'Payment recorded',
        description: `${selected.name} — ${fmtMoney(v)} via ${method}`,
      });
      setAmount('');

      // If first payment (no real login yet), offer to generate one.
      if (!hasRealLogin(selected)) {
        const password = genDefaultPassword();
        const rollNo = selected.rollNo || selected.email?.split('@')[0] || selected.id;
        try {
          // PATCH the existing student row with the real credentials.
          await api.editUser(selected.id, {
            email: `${String(rollNo).toLowerCase()}@concordia.edu.pk`,
            password,
          });
          onStudentUpdate({
            ...selected,
            email: `${String(rollNo).toLowerCase()}@concordia.edu.pk`,
            password,
          });
          setGeneratedLogin({ rollNo: String(rollNo), password });
          toast({
            title: 'Student login generated',
            description: `Username ${rollNo} — share the credentials below.`,
          });
        } catch {
          // Backend sync failed — still surface the staged credentials.
          setGeneratedLogin({ rollNo: String(rollNo), password });
        }
      }
    } catch (e: any) {
      toast({
        title: 'Could not record payment',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collect Payment"
        subtitle="Record a fee payment and, on first payment, generate the student login."
        action={
          <Button
            variant="outline"
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium"
            onClick={onRefresh}
          >
            <Loader2 className={cn('h-4 w-4 mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student picker */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <SectionHeader title="1. Select Student" />
          <div className="relative mb-3">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students…"
              className={`${inputCls} pl-9`}
            />
          </div>
          {loading ? (
            <SkeletonTable rows={4} />
          ) : (
            <div className="space-y-1.5 max-h-[28rem] overflow-y-auto -mr-1 pr-1">
              {filteredStudents.length === 0 ? (
                <EmptyState icon={Users} title="No students" desc="Adjust your search." />
              ) : (
                filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelected(s);
                      setGeneratedLogin(null);
                      setAmount('');
                    }}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-colors',
                      selected?.id === s.id
                        ? 'border-[#F26522] bg-[#F26522]/5'
                        : 'border-gray-200 hover:bg-gray-50',
                    )}
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                    <div className="text-[11px] text-gray-500 truncate">
                      {s.rollNo} · {s.class || '—'}
                      {s.section ? `-${s.section}` : ''}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Fee summary + payment form */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          {!selected ? (
            <EmptyState
              icon={CreditCard}
              title="Select a student"
              desc="Choose a student on the left to record their fee payment."
            />
          ) : (
            <div className="space-y-5">
              {/* Student summary */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{selected.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selected.rollNo} · {selected.class || '—'}
                    {selected.section ? `-${selected.section}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">
                    Base Fee (locked)
                  </p>
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5 justify-end mt-0.5">
                    <Lock className="h-3 w-3 text-gray-400" />
                    {fmtMoney(Number(selected.baseFee || 0))}
                  </p>
                </div>
              </div>

              {/* Outstanding invoices */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Outstanding Invoices
                  </h4>
                  <span className="text-xs text-gray-500">
                    Total due: <span className="font-semibold text-gray-900">{fmtMoney(outstanding)}</span>
                  </span>
                </div>
                {studentInvoices.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">
                    No outstanding invoices. Generate a challan from the Fee Challans tab.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {studentInvoices.map((i) => (
                      <div
                        key={i.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700">
                            {i.month ? monthName(i.month) : '—'}
                            {i.year ? ` ${i.year}` : ''}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Invoice {(i.challanNo || i.id || '').slice(0, 10)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-gray-900 tabular-nums">
                            {fmtMoney(Number(i.amount) - Number(i.paidAmount || 0))}
                          </p>
                          <StatusBadge status={i.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Amount (Rs)" required>
                  <div className="relative">
                    <DollarSign className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="number"
                      min={0}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </Field>
                <Field label="Payment Method">
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className={`${inputCls} w-full`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Button
                className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-10 px-4 text-sm font-medium w-full"
                onClick={submit}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Recording…
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-1.5" /> Record Payment
                  </>
                )}
              </Button>

              {/* Collected so far */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                <span>Collected so far from this student</span>
                <span className="font-semibold text-gray-900 tabular-nums">
                  {fmtMoney(studentPaidTotal)}
                </span>
              </div>

              {/* Generated login confirmation */}
              {generatedLogin && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <KeyRound className="h-4 w-4 text-emerald-700" />
                    <p className="text-sm font-semibold text-emerald-800">
                      Student login generated — share with the student
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white border border-emerald-100 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        Username (Roll #)
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="font-mono font-semibold text-gray-900 text-sm">
                          {generatedLogin.rollNo}
                        </span>
                        <CopyButton text={generatedLogin.rollNo} />
                      </div>
                    </div>
                    <div className="rounded-lg bg-white border border-emerald-100 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        Default Password
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="font-mono font-semibold text-gray-900 text-sm">
                          {generatedLogin.password}
                        </span>
                        <CopyButton text={generatedLogin.password} />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-2.5">
                    The student should change this password on first login.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── 4. Fee Challans ─────────────────────────

function ChallansView({
  user,
  invoices,
  students,
  loading,
  onRefresh,
  onInvoiceUpdate,
}: {
  user: any;
  invoices: any[];
  students: any[];
  loading: boolean;
  onRefresh: () => void;
  onInvoiceUpdate: (inv: any) => void;
}) {
  const [view, setView] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [generating, setGenerating] = useState(false);

  // Filtered + sorted challan list (newest first)
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices
      .filter((i) => {
        if (statusFilter !== 'all' && (i.status || '').toLowerCase() !== statusFilter) return false;
        if (!q) return true;
        return (
          i.studentName?.toLowerCase().includes(q) ||
          i.challanNo?.toLowerCase().includes(q) ||
          i.rollNo?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [invoices, search, statusFilter]);

  const generateChallans = async () => {
    const now = new Date();
    const m = MONTHS[now.getMonth()];
    const y = now.getFullYear();
    setGenerating(true);
    try {
      const res = await api.generateInvoices(m, y);
      toast({
        title: 'Challans generated',
        description:
          res?.created != null
            ? `${res.created} new challan(s) for ${m} ${y}.`
            : `Challans queued for ${m} ${y}.`,
      });
      onRefresh();
    } catch (e: any) {
      toast({
        title: 'Could not generate challans',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const markPaid = async (inv: any) => {
    try {
      const updated = await api.markInvoicePaid(inv.id, Number(inv.amount), 'Cash');
      onInvoiceUpdate({
        ...inv,
        ...updated,
        status: 'Paid',
        paidAmount: Number(inv.amount),
        paidAt: new Date().toISOString(),
        paymentMethod: 'Cash',
      });
      setView(null);
      toast({
        title: 'Challan marked paid',
        description: `${inv.studentName} — ${fmtMoney(Number(inv.amount))}`,
      });
    } catch (e: any) {
      toast({
        title: 'Could not mark paid',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  // If viewing a single challan, render the document
  if (view) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Fee Challan"
          subtitle={`Challan ${view.challanNo || view.id} — ${view.studentName || ''}`}
          action={
            <Button
              variant="outline"
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium"
              onClick={() => setView(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to list
            </Button>
          }
        />

        <div className="max-w-2xl mx-auto">
          <ChallanDocument
            challan={view}
            branchName={user?.branchName || user?.instituteName || 'Concordia College'}
            onMarkPaid={
              (view.status || '').toLowerCase() === 'paid' ? undefined : () => markPaid(view)
            }
            onPrint={() => window.print()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Challans"
        subtitle="Generate monthly challans and view each one as a print-ready document."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium"
              onClick={onRefresh}
            >
              <Loader2 className={cn('h-4 w-4 mr-1.5', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-4 text-sm font-medium"
              onClick={generateChallans}
              disabled={generating || students.length === 0}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" /> Generate Challans
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student or challan #…"
              className={`${inputCls} pl-9`}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`${inputCls} w-full sm:w-44`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        {loading ? (
          <SkeletonTable rows={6} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={invoices.length === 0 ? 'No challans issued yet' : 'No matching challans'}
            desc={
              invoices.length === 0
                ? 'Click Generate Challans to create this month\'s invoices for confirmed admissions.'
                : 'Try a different search or status filter.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 hover:bg-transparent">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Challan #
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Student
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Period
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                    Amount
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((i) => (
                  <TableRow key={i.id} className="border-gray-100 hover:bg-gray-50">
                    <TableCell className="text-sm font-mono text-gray-700">
                      {i.challanNo || String(i.id || '').slice(0, 10)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-900">
                      {i.studentName || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {i.month ? monthName(i.month) : '—'}
                      {i.year ? ` ${i.year}` : ''}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-900 text-right tabular-nums">
                      {fmtMoney(Number(i.amount || 0))}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={i.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        onClick={() => setView(i)}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

/** Print-friendly challan document. Subtle top accent line, NOT a gradient banner. */
function ChallanDocument({
  challan,
  branchName,
  onMarkPaid,
  onPrint,
}: {
  challan: any;
  branchName: string;
  onMarkPaid?: () => void;
  onPrint?: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 border-t-2 border-t-[#F26522]">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{branchName}</h2>
          <p className="text-xs text-gray-500 mt-0.5">Fee Challan</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Challan #</p>
          <p className="text-sm font-mono font-semibold text-gray-900 mt-0.5">
            {challan.challanNo || String(challan.id || '').slice(0, 12)}
          </p>
          <p className="text-[11px] text-gray-400 mt-1.5">
            Issued: {formatDate(challan.createdAt)}
          </p>
        </div>
      </div>

      {/* Student info */}
      <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-400">Student</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">
            {challan.studentName || '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-400">Class</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">
            {challan.className || challan.class || '—'}
            {challan.section ? ` · ${challan.section}` : ''}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-400">Period</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">
            {challan.month ? monthName(challan.month) : '—'}
            {challan.year ? ` ${challan.year}` : ''}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-400">Type</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">
            {challan.type || 'Tuition'}
          </p>
        </div>
      </div>

      {/* Fee breakdown */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 hover:bg-transparent">
              <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Description
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="border-gray-100">
              <TableCell className="text-sm text-gray-700">
                {challan.type || 'Tuition'} Fee — {challan.month ? monthName(challan.month) : ''}
                {challan.year ? ` ${challan.year}` : ''}
              </TableCell>
              <TableCell className="text-sm font-semibold text-gray-900 text-right tabular-nums">
                {fmtMoney(Number(challan.amount || 0))}
              </TableCell>
            </TableRow>
            <TableRow className="border-gray-100 bg-gray-50">
              <TableCell className="text-sm font-bold text-gray-900">Total Payable</TableCell>
              <TableCell className="text-base font-bold text-gray-900 text-right tabular-nums">
                {fmtMoney(Number(challan.amount || 0))}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Status stamp + actions */}
      <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider text-gray-400">Status</span>
          <StatusBadge status={challan.status} />
          {challan.paidAt && (
            <span className="text-xs text-gray-500">Paid on {formatDate(challan.paidAt)}</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium"
            onClick={onPrint}
          >
            <Printer className="h-4 w-4 mr-1.5" /> Print
          </Button>
          {onMarkPaid && (
            <Button
              className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-4 text-sm font-medium"
              onClick={onMarkPaid}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark Paid
            </Button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-gray-400 mt-5 pt-4 border-t border-gray-100">
        This is a computer-generated challan and does not require a physical signature. Please
        retain this document for your records.
      </p>
    </div>
  );
}

// ───────────────────────── 5. Installments ─────────────────────────

type InstallmentRow = { id: string; amount: string; due: string };

function InstallmentsView({
  students,
  loading,
}: {
  students: any[];
  loading: boolean;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [rows, setRows] = useState<InstallmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.rollNo?.toLowerCase().includes(q) ||
        s.class?.toLowerCase().includes(q),
    );
  }, [students, search]);

  const baseFee = Number(selected?.baseFee || 0);
  const totalPlanned = rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  const remaining = baseFee - totalPlanned;

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { id: `inst-${Date.now()}`, amount: '', due: '' },
    ]);

  const updateRow = (id: string, patch: Partial<InstallmentRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  // Auto-split helper — evenly divide the base fee into N installments
  const autoSplit = (n: number) => {
    if (!baseFee) return;
    const per = Math.floor(baseFee / n);
    const last = baseFee - per * (n - 1);
    const now = new Date();
    const next: InstallmentRow[] = Array.from({ length: n }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 5);
      return {
        id: `inst-${Date.now()}-${i}`,
        amount: String(i === n - 1 ? last : per),
        due: d.toISOString().split('T')[0],
      };
    });
    setRows(next);
    setError(null);
  };

  const save = () => {
    if (rows.length === 0) {
      toast({ title: 'Add at least one installment', variant: 'destructive' });
      return;
    }
    if (rows.some((r) => !r.amount || !r.due)) {
      toast({
        title: 'Fill in all amounts and due dates',
        variant: 'destructive',
      });
      return;
    }
    if (totalPlanned !== baseFee) {
      setError(
        `Installments total ${fmtMoney(totalPlanned)} — must equal base fee ${fmtMoney(baseFee)}.`,
      );
      return;
    }
    setError(null);
    toast({
      title: 'Installment plan saved',
      description: `${rows.length} installments for ${selected.name}.`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Installments"
        subtitle="Split the locked base fee into multiple due-dated installments."
      />

      <LockedFeeCallout />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student picker */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <SectionHeader title="Select Student" />
          <div className="relative mb-3">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students…"
              className={`${inputCls} pl-9`}
            />
          </div>
          {loading ? (
            <SkeletonTable rows={4} />
          ) : (
            <div className="space-y-1.5 max-h-[28rem] overflow-y-auto -mr-1 pr-1">
              {filteredStudents.length === 0 ? (
                <EmptyState icon={Users} title="No students" desc="Adjust your search." />
              ) : (
                filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelected(s);
                      setRows([]);
                      setError(null);
                    }}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-colors',
                      selected?.id === s.id
                        ? 'border-[#F26522] bg-[#F26522]/5'
                        : 'border-gray-200 hover:bg-gray-50',
                    )}
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                    <div className="text-[11px] text-gray-500 truncate">
                      {s.rollNo} · {fmtMoney(Number(s.baseFee || 0))}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Plan builder */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          {!selected ? (
            <EmptyState
              icon={ClipboardList}
              title="Select a student"
              desc="Then split their base fee into 2–6 installments with due dates."
            />
          ) : (
            <div className="space-y-5">
              {/* Base fee summary */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{selected.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selected.rollNo} · {selected.class || '—'}
                    {selected.section ? `-${selected.section}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">
                    Base Fee (locked)
                  </p>
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5 justify-end mt-0.5">
                    <Lock className="h-3 w-3 text-gray-400" />
                    {fmtMoney(baseFee)}
                  </p>
                </div>
              </div>

              {/* Quick-split */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">Quick split:</span>
                {[2, 3, 4].map((n) => (
                  <Button
                    key={n}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                    onClick={() => autoSplit(n)}
                    disabled={!baseFee}
                  >
                    {n} installments
                  </Button>
                ))}
              </div>

              {/* Installment rows */}
              {rows.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
                  No installments yet. Use a quick split or add rows manually below.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 text-[10px] uppercase tracking-wider text-gray-400 px-1">
                    <span>#</span>
                    <span>Amount (Rs)</span>
                    <span>Due Date</span>
                    <span />
                  </div>
                  {rows.map((r, i) => (
                    <div
                      key={r.id}
                      className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center"
                    >
                      <span className="text-sm font-semibold text-gray-400 text-center">
                        {i + 1}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={r.amount}
                        onChange={(e) => updateRow(r.id, { amount: e.target.value })}
                        placeholder="0"
                        className={`${inputCls} h-9`}
                      />
                      <Input
                        type="date"
                        value={r.due}
                        onChange={(e) => updateRow(r.id, { due: e.target.value })}
                        className={`${inputCls} h-9`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => removeRow(r.id)}
                        aria-label="Remove installment"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium"
                onClick={addRow}
              >
                <Plus className="h-4 w-4 mr-1.5" /> Add Installment
              </Button>

              {/* Totals */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1.5">
                <Row label="Base Fee" value={fmtMoney(baseFee)} mono />
                <Row label="Planned Total" value={fmtMoney(totalPlanned)} mono />
                <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">Remaining</span>
                  <span
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      remaining === 0 ? 'text-emerald-700' : 'text-gray-900',
                    )}
                  >
                    {fmtMoney(remaining)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-4 text-sm font-medium"
                onClick={save}
                disabled={rows.length === 0}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Save Installment Plan
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── 6. Miscellaneous Charges ─────────────────────────

type MiscCharge = {
  id: string;
  studentId: string;
  studentName: string;
  type: string;
  amount: number;
  desc: string;
  createdAt: string;
};

function MiscChargesView({ students }: { students: any[] }) {
  const [charges, setCharges] = useState<MiscCharge[]>([]);
  const [search, setSearch] = useState('');
  const [selStudent, setSelStudent] = useState('');
  const [type, setType] = useState(MISC_CHARGE_TYPES[0]);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  const filteredCharges = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return charges;
    return charges.filter(
      (c) =>
        c.studentName?.toLowerCase().includes(q) ||
        c.type?.toLowerCase().includes(q),
    );
  }, [charges, search]);

  const total = charges.reduce((acc, c) => acc + c.amount, 0);

  const add = () => {
    if (!selStudent) {
      toast({ title: 'Select a student', variant: 'destructive' });
      return;
    }
    const v = Number(amount);
    if (!amount || isNaN(v) || v <= 0) {
      toast({
        title: 'Enter a valid amount',
        description: 'Amount must be a positive number.',
        variant: 'destructive',
      });
      return;
    }
    const s = students.find((x) => x.id === selStudent);
    const newCharge: MiscCharge = {
      id: `MC-${Date.now()}`,
      studentId: selStudent,
      studentName: s?.name || '—',
      type,
      amount: v,
      desc: desc.trim(),
      createdAt: new Date().toISOString(),
    };
    setCharges((prev) => [newCharge, ...prev]);
    setAmount('');
    setDesc('');
    toast({
      title: 'Charge added',
      description: `${type} — ${fmtMoney(v)} for ${s?.name || 'student'}.`,
    });
  };

  const remove = (id: string) => {
    setCharges((prev) => prev.filter((c) => c.id !== id));
    toast({ title: 'Charge removed' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Miscellaneous Charges"
        subtitle="Admission, registration, trip, exam and other one-off fees — separate from base tuition."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Add form */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="Add Charge" desc="Record a one-off fee for a student." />
          <div className="space-y-3">
            <Field label="Student" required>
              <Select value={selStudent} onValueChange={setSelStudent}>
                <SelectTrigger className={`${inputCls} w-full`}>
                  <SelectValue placeholder="Select student…" />
                </SelectTrigger>
                <SelectContent>
                  {students.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-500">No students enrolled.</div>
                  )}
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.rollNo || '—'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Charge Type" required>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className={`${inputCls} w-full`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MISC_CHARGE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Amount (Rs)" required>
              <div className="relative">
                <DollarSign className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>
            <Field label="Description (optional)">
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                placeholder="e.g. Annual educational trip — Lahore"
                className="rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/12"
              />
            </Field>
            <Button
              className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-10 px-4 text-sm font-medium w-full"
              onClick={add}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Charge
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader
            title="All Charges"
            desc={`${charges.length} record(s) · Total ${fmtMoney(total)}`}
            action={
              <div className="relative w-44">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className={`${inputCls} pl-9 h-9`}
                />
              </div>
            }
          />
          {filteredCharges.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title={charges.length === 0 ? 'No misc charges yet' : 'No matching charges'}
              desc={
                charges.length === 0
                  ? 'Use the form on the left to add the first charge.'
                  : 'Try a different search.'
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 hover:bg-transparent">
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Student
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Type
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                      Amount
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Description
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCharges.map((c) => (
                    <TableRow key={c.id} className="border-gray-100 hover:bg-gray-50">
                      <TableCell className="text-sm font-medium text-gray-900">
                        {c.studentName}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        <Badge
                          variant="outline"
                          className="bg-gray-50 text-gray-700 border-gray-200 text-[10px]"
                        >
                          {c.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-900 text-right tabular-nums">
                        {fmtMoney(c.amount)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                        {c.desc || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => remove(c.id)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── 7. Create Logins (Student + Teacher) ─────────────────────────

function LoginsView({
  user,
  students,
  loading,
  onUpdate,
}: {
  user: any;
  students: any[];
  loading: boolean;
  onUpdate: (s: any) => void;
}) {
  const [tab, setTab] = useState<'student' | 'teacher'>('student');

  // --- Student logins state (existing flow) ---
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'with' | 'without'>('all');
  const [creating, setCreating] = useState('');
  const [generated, setGenerated] = useState<
    Record<string, { rollNo: string; password: string }>
  >({});

  // --- Teacher login form state (new) ---
  const [form, setForm] = useState({
    name: '',
    rollNo: '',
    email: '',
    password: '',
    subjects: [] as string[],
    subjectInput: '',
  });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ user: string; pass: string; name: string } | null>(
    null,
  );
  const [suggestedSubjects, setSuggestedSubjects] = useState<string[]>([]);
  const [suggestedLoaded, setSuggestedLoaded] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Lazy-load suggested subjects the first time the Teacher tab is opened.
  // Falls back to the hardcoded DEFAULT_SUBJECTS list if the API fails or
  // returns nothing.
  useEffect(() => {
    if (tab !== 'teacher' || suggestedLoaded) return;
    let cancelled = false;
    api
      .reference()
      .then((r) => {
        if (cancelled) return;
        const list =
          Array.isArray(r?.subjects) && r.subjects.length > 0 ? r.subjects : DEFAULT_SUBJECTS;
        setSuggestedSubjects(list);
        setSuggestedLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setSuggestedSubjects(DEFAULT_SUBJECTS);
        setSuggestedLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, suggestedLoaded]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const hasLogin = hasRealLogin(s);
      if (filter === 'with' && !hasLogin) return false;
      if (filter === 'without' && hasLogin) return false;
      if (!q) return true;
      return (
        s.name?.toLowerCase().includes(q) ||
        s.rollNo?.toLowerCase().includes(q) ||
        s.class?.toLowerCase().includes(q)
      );
    });
  }, [students, search, filter]);

  const stats = useMemo(() => {
    const withLogin = students.filter(hasRealLogin).length;
    return { total: students.length, with: withLogin, without: students.length - withLogin };
  }, [students]);

  const generate = async (s: any) => {
    setCreating(s.id);
    try {
      const password = genDefaultPassword();
      const rollNo = s.rollNo || s.email?.split('@')[0] || s.id;
      const email = `${String(rollNo).toLowerCase()}@concordia.edu.pk`;
      try {
        // PATCH the existing student row with real credentials.
        await api.editUser(s.id, { email, password });
      } catch {
        // Fall back to createPlatformUser if the row is somehow missing.
        await api.createPlatformUser({
          name: s.name,
          email,
          rollNo: s.rollNo,
          password,
          role: 'student',
          branchId: s.branchId || user?.branchId,
          instituteId: s.instituteId || user?.instituteId,
          class: s.class,
          section: s.section,
          guardian: s.guardian,
        });
      }
      onUpdate({ ...s, email, password });
      setGenerated((prev) => ({ ...prev, [s.id]: { rollNo: String(rollNo), password } }));
      toast({
        title: 'Login generated',
        description: `${s.name} — username ${rollNo}`,
      });
    } catch (e: any) {
      toast({
        title: 'Could not generate login',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreating('');
    }
  };

  // ─── Teacher form helpers ───

  const addSubjects = (raw: string) => {
    const parts = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setForm((prev) => {
      const merged = [...prev.subjects];
      for (const p of parts) {
        if (!merged.some((s) => s.toLowerCase() === p.toLowerCase())) merged.push(p);
      }
      return { ...prev, subjects: merged, subjectInput: '' };
    });
  };

  const removeSubject = (s: string) => {
    setForm((prev) => ({ ...prev, subjects: prev.subjects.filter((x) => x !== s) }));
  };

  const onSubjectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSubjects((e.target as HTMLInputElement).value);
    } else if (e.key === 'Backspace' && form.subjectInput === '' && form.subjects.length > 0) {
      setForm((prev) => ({ ...prev, subjects: prev.subjects.slice(0, -1) }));
    }
  };

  // --- Password strength meter (simple) ---
  const pwLevel: 'empty' | 'weak' | 'medium' | 'strong' = (() => {
    if (!form.password) return 'empty';
    const len = form.password.length;
    const hasLetter = /[a-zA-Z]/.test(form.password);
    const hasNum = /[0-9]/.test(form.password);
    if (len < 6) return 'weak';
    if (len >= 10 && hasLetter && hasNum) return 'strong';
    return 'medium';
  })();

  const strengthMeta: Record<
    'empty' | 'weak' | 'medium' | 'strong',
    { label: string; color: string; bar: string; width: string }
  > = {
    empty: { label: '', color: '', bar: '', width: '0%' },
    weak: { label: 'Weak', color: 'text-red-600', bar: 'bg-red-500', width: '33%' },
    medium: { label: 'Medium', color: 'text-amber-600', bar: 'bg-amber-500', width: '66%' },
    strong: { label: 'Strong', color: 'text-emerald-600', bar: 'bg-emerald-500', width: '100%' },
  };
  const sm = strengthMeta[pwLevel];

  const submitTeacher = async () => {
    if (!form.name || !form.rollNo) {
      toast({ title: 'Name and Teacher ID are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const password = form.password || 'teacher' + Math.floor(1000 + Math.random() * 9000);
      const email = form.email || `${form.rollNo.toLowerCase()}@concordia.edu.pk`;
      // Flush any un-committed subject text so it isn't lost on submit.
      let subjects = form.subjects;
      if (form.subjectInput.trim()) {
        const parts = form.subjectInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        subjects = [...form.subjects];
        for (const p of parts) {
          if (!subjects.some((s) => s.toLowerCase() === p.toLowerCase())) subjects.push(p);
        }
      }
      await api.createPlatformUser({
        name: form.name,
        email,
        rollNo: form.rollNo,
        password,
        role: 'teacher',
        branchId: user?.branchId,
        instituteId: user?.instituteId,
        subjects: JSON.stringify(subjects),
        title: 'Teacher',
      });
      setCreated({ user: form.rollNo, pass: password, name: form.name });
      setForm({
        name: '',
        rollNo: '',
        email: '',
        password: '',
        subjects: [],
        subjectInput: '',
      });
      toast({
        title: 'Teacher login created',
        description: `${form.name} — username ${form.rollNo}`,
      });
    } catch (e: any) {
      toast({
        title: 'Failed to create login',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const createAnother = () => {
    setCreated(null);
    // Defer focus until after the Sheet's close animation + focus-restore.
    setTimeout(() => nameRef.current?.focus(), 300);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Logins"
        subtitle={
          tab === 'student'
            ? 'Issue login credentials to enrolled students after fee payment, or create teacher accounts.'
            : 'Generate login credentials for teachers and students.'
        }
      />

      {/* Tab switcher */}
      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
        <button
          onClick={() => setTab('student')}
          className={cn(
            'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
            tab === 'student' ? 'bg-[#F26522] text-white' : 'text-gray-600 hover:bg-gray-50',
          )}
        >
          Student Logins
        </button>
        <button
          onClick={() => setTab('teacher')}
          className={cn(
            'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
            tab === 'teacher' ? 'bg-[#F26522] text-white' : 'text-gray-600 hover:bg-gray-50',
          )}
        >
          Teacher Logins
        </button>
      </div>

      {/* ===== Student Logins tab (existing flow — UNCHANGED) ===== */}
      {tab === 'student' && (
        <>
          {/* Info callout — gray, restrained */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex gap-3">
            <Info className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600 leading-relaxed">
              <p className="font-semibold text-gray-900">Per spec §3 — when to issue logins.</p>
              <p className="mt-1">
                Student logins are created by the Accountant after the first fee payment is
                confirmed. The username is the student&apos;s roll number and the password is a
                system-generated default that the student must change on first sign-in.
              </p>
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={Users} label="Total Students" value={stats.total} sub="Enrolled" />
            <StatCard icon={KeyRound} label="With Login" value={stats.with} sub="Credentials issued" />
            <StatCard
              icon={AlertCircle}
              label="Without Login"
              value={stats.without}
              sub="Awaiting first payment"
            />
          </div>

          {/* Filters */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, roll #, or class…"
                  className={`${inputCls} pl-9`}
                />
              </div>
              <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                <SelectTrigger className={`${inputCls} w-full sm:w-48`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  <SelectItem value="with">With login</SelectItem>
                  <SelectItem value="without">Without login</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Student list */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            {loading ? (
              <SkeletonTable rows={6} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={KeyRound}
                title={students.length === 0 ? 'No students enrolled' : 'No matching students'}
                desc={
                  students.length === 0
                    ? 'The Admission Office must enroll students first.'
                    : 'Try a different search or filter.'
                }
              />
            ) : (
              <div className="space-y-2">
                {filtered.map((s) => {
                  const hasLogin = hasRealLogin(s);
                  const creds = generated[s.id];
                  return (
                    <div
                      key={s.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg border border-gray-200 bg-gray-50 grid place-items-center shrink-0">
                          <GraduationCap className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {s.rollNo} · {s.class || '—'}
                            {s.section ? `-${s.section}` : ''}
                          </p>
                        </div>
                      </div>

                      {creds ? (
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="rounded-lg border border-emerald-100 bg-white px-3 py-1.5 text-xs">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 block">
                              Username
                            </span>
                            <span className="font-mono font-semibold text-gray-900 flex items-center gap-2">
                              {creds.rollNo}
                              <CopyButton text={creds.rollNo} />
                            </span>
                          </div>
                          <div className="rounded-lg border border-emerald-100 bg-white px-3 py-1.5 text-xs">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 block">
                              Password
                            </span>
                            <span className="font-mono font-semibold text-gray-900 flex items-center gap-2">
                              {creds.password}
                              <CopyButton text={creds.password} />
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-100 gap-1"
                          >
                            <Check className="h-3 w-3" /> Login Ready
                          </Badge>
                        </div>
                      ) : hasLogin ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-100 gap-1"
                        >
                          <Check className="h-3 w-3" /> Login Active
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-8 px-3 text-xs font-medium"
                          onClick={() => generate(s)}
                          disabled={creating === s.id}
                        >
                          {creating === s.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Generating…
                            </>
                          ) : (
                            <>
                              <KeyRound className="h-3.5 w-3.5 mr-1" /> Generate Login
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== Teacher Logins tab (new) ===== */}
      {tab === 'teacher' && (
        <>
          {/* Info callout */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex gap-3">
            <Info className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600 leading-relaxed">
              <p className="font-semibold text-gray-900">Teacher accounts are created here.</p>
              <p className="mt-1">
                The username is the Teacher ID and the password is auto-generated (teacher can
                change it on first sign-in).
              </p>
            </div>
          </div>

          {/* Teacher creation form */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 max-w-2xl">
            <SectionHeader
              title="New Teacher Login"
              desc="Credentials will be generated automatically if left blank."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <Input
                  ref={nameRef}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  placeholder="Ayesha Khan"
                />
              </Field>
              <Field label="Teacher ID / Roll No" required>
                <Input
                  value={form.rollNo}
                  onChange={(e) => setForm({ ...form, rollNo: e.target.value })}
                  className={inputCls}
                  placeholder="T001"
                />
              </Field>
              <Field label="Email (optional)">
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                  placeholder="auto-generated if blank"
                />
              </Field>
              <Field label="Password (optional)">
                <Input
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputCls}
                  placeholder="auto-generated if blank"
                />
                {pwLevel === 'empty' ? (
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    Will be auto-generated (e.g. teacher4827).
                  </p>
                ) : (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="h-1 flex-1 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', sm.bar)}
                        style={{ width: sm.width }}
                      />
                    </div>
                    <span className={cn('text-[11px] font-medium tabular-nums', sm.color)}>
                      {sm.label}
                    </span>
                  </div>
                )}
              </Field>

              <div className="md:col-span-2">
                <Field label="Subjects">
                  <div className="rounded-lg border border-gray-200 bg-white focus-within:border-[#F26522] focus-within:ring-2 focus-within:ring-[#F26522]/12 p-1 min-h-10 flex flex-wrap items-center gap-1">
                    {form.subjects.map((s) => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="bg-gray-100 text-gray-700 border-transparent gap-1 pl-2 pr-1 py-1 text-xs"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => removeSubject(s)}
                          className="inline-flex items-center justify-center h-4 w-4 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                          aria-label={`Remove ${s}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <input
                      value={form.subjectInput}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, subjectInput: e.target.value }))
                      }
                      onKeyDown={onSubjectKeyDown}
                      onBlur={(e) => addSubjects(e.target.value)}
                      placeholder={
                        form.subjects.length === 0 ? 'Type a subject and press Enter' : ''
                      }
                      className="flex-1 min-w-[140px] h-8 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none px-1.5"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    Press Enter or comma to add a subject.
                  </p>
                  {suggestedSubjects.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                        Suggestions
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedSubjects.slice(0, 12).map((s) => {
                          const added = form.subjects.some(
                            (x) => x.toLowerCase() === s.toLowerCase(),
                          );
                          return (
                            <button
                              key={s}
                              type="button"
                              disabled={added}
                              onClick={() => addSubjects(s)}
                              className={cn(
                                'inline-flex items-center gap-1 text-[11px] font-medium rounded-md border px-2 py-1 transition-colors',
                                added
                                  ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-[#F26522] hover:text-[#F26522]',
                              )}
                            >
                              {added ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Field>
              </div>
            </div>

            <div className="mt-5">
              <button onClick={submitTeacher} disabled={saving} className={btnPrimary}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                Generate Login
              </button>
            </div>
          </div>
        </>
      )}

      {/* Credentials confirmation Sheet (teacher) */}
      <Sheet open={!!created} onOpenChange={(o) => !o && setCreated(null)}>
        <SheetContent className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="text-gray-900">Login Created</SheetTitle>
            <SheetDescription>Share these credentials securely.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Name</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">{created?.name}</div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Username</span>
                  <CopyButton text={created?.user || ''} />
                </div>
                <div className="text-sm font-mono font-semibold text-gray-900">
                  {created?.user}
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Password</span>
                  <CopyButton text={created?.pass || ''} />
                </div>
                <div className="text-sm font-mono font-semibold text-gray-900">
                  {created?.pass}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={createAnother}
                className={cn(btnPrimary, 'justify-center h-10')}
              >
                <Plus className="h-4 w-4" /> Create Another
              </button>
              <button
                onClick={() => setCreated(null)}
                className={cn(btnSecondary, 'justify-center h-10')}
              >
                Done
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
