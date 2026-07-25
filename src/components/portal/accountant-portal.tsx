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
  Pencil,
  Unlock,
  ShieldAlert,
  Eye,
  EyeOff,
  Download,
  ChevronDown,
  ChevronRight,
  Wallet,
} from 'lucide-react';
import { buildFeeChallan, savePdf } from '@/lib/pdf-utils';

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

// Whether a user (student or teacher) is currently blocked. The backend
// returns `blocked` as 0/1 or as a boolean — accept both.
const isBlocked = (u: any) => u?.blocked === 1 || u?.blocked === true;

// Small "Blocked" pill — rose tint, matches StatusBadge styling.
function BlockedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-rose-100 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
      <ShieldAlert className="h-3 w-3" />
      Blocked
    </span>
  );
}

// ───────────────────────── Constants ─────────────────────────

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Card'];
// Per user spec: show 2 fixed charge types + "Other" (customizable by admin).
const MISC_CHARGE_TYPES = ['Admission Fee', 'Exam Fee', 'Other'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
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
  else if (
    activeModule === 'accountant-challans' ||
    activeModule === 'accountant-collect' ||
    activeModule === 'accountant-installments'
  )
    content = (
      <FeeInstallmentsView
        user={user}
        students={students}
        invoices={invoices}
        loading={loading}
        onRefresh={refresh}
        onInvoiceUpdate={upsertInvoice}
        onStudentUpdate={upsertStudent}
      />
    );
  else if (activeModule === 'accountant-misc')
    content = <MiscChargesView user={user} students={students} loading={loading} />;
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
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);

  // Map studentId → invoice summary for fast lookups
  const invoiceByStudent = useMemo(() => {
    const map: Record<string, any[]> = {};
    invoices.forEach((inv) => {
      const key = inv.studentId || inv.userId;
      if (!key) return;
      (map[key] ||= []).push(inv);
    });
    return map;
  }, [invoices]);

  // Group students by class (e.g. "Class 5 - A"). Falls back to "Unassigned".
  const classGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    students.forEach((s) => {
      const cls = s.class ? (s.section ? `${s.class} - ${s.section}` : s.class) : 'Unassigned';
      (groups[cls] ||= []).push(s);
    });
    return Object.entries(groups)
      .map(([className, list]) => ({
        className,
        students: list.sort((a, b) => (a.rollNo || '').localeCompare(b.rollNo || '')),
      }))
      .sort((a, b) => a.className.localeCompare(b.className));
  }, [students]);

  // Filter class groups by search query (matches student name/roll/guardian/contact)
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classGroups;
    return classGroups
      .map((g) => ({
        ...g,
        students: g.students.filter(
          (s) =>
            s.name?.toLowerCase().includes(q) ||
            s.rollNo?.toLowerCase().includes(q) ||
            s.fatherName?.toLowerCase().includes(q) ||
            s.guardian?.toLowerCase().includes(q) ||
            s.guardianPhone?.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.students.length > 0);
  }, [classGroups, search]);

  const totalStudents = students.length;
  const totalLocked = students.filter(
    (s) => s.baseFeeLocked && s.baseFee != null && s.baseFee !== '',
  ).length;
  const totalCollected = invoices
    .filter((i) => (i.status || '').toLowerCase() === 'paid')
    .reduce((sum, i) => sum + Number(i.paidAmount || i.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students (Class-wise)"
        subtitle="Browse enrolled students grouped by class — click a class card to see every student inside."
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

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={GraduationCap}
          label="Total Students"
          value={totalStudents}
          sub={`${classGroups.length} class${classGroups.length === 1 ? '' : 'es'}`}
        />
        <StatCard
          icon={Lock}
          label="Fee Locked"
          value={totalLocked}
          sub="Ready for installments"
        />
        <StatCard
          icon={Wallet}
          label="Collected"
          value={fmtMoney(totalCollected)}
          sub="All-time paid"
        />
      </div>

      {/* Search */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, roll #, father / guardian, or contact…"
            className={`${inputCls} pl-9`}
          />
        </div>
      </div>

      {/* Class cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <EmptyState
            icon={Users}
            title={students.length === 0 ? 'No students enrolled yet' : 'No matching records'}
            desc={
              students.length === 0
                ? 'The Admission Office must enroll students first. Once enrolled, they will appear here grouped by class.'
                : 'Try a different search query.'
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGroups.map((g) => {
            const classPaid = g.students.reduce(
              (acc, s) => acc + sumPaid(invoiceByStudent[s.id] || []),
              0,
            );
            const classBalance = g.students.reduce(
              (acc, s) => acc + sumOutstanding(invoiceByStudent[s.id] || []),
              0,
            );
            const isOpen = expandedClass === g.className;
            return (
              <div
                key={g.className}
                className={cn(
                  'rounded-xl border bg-white overflow-hidden transition-all',
                  isOpen ? 'border-[#F26522] shadow-sm md:col-span-2 xl:col-span-3' : 'border-gray-200 hover:border-gray-300',
                )}
              >
                {/* Card header — always visible */}
                <button
                  type="button"
                  onClick={() => setExpandedClass(isOpen ? null : g.className)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-[#FFF0E8] grid place-items-center shrink-0">
                      <GraduationCap className="h-5 w-5 text-[#F26522]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {g.className}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {g.students.length} student{g.students.length === 1 ? '' : 's'} ·{' '}
                        <span className="text-emerald-700">Paid {fmtMoney(classPaid)}</span>
                        {classBalance > 0 && (
                          <span className="text-amber-700"> · Due {fmtMoney(classBalance)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {/* Expanded student list */}
                {isOpen && (
                  <div className="border-t border-gray-100">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-100 hover:bg-transparent">
                            <TableHead className="text-[10px] font-medium uppercase tracking-wider text-gray-400 px-4">
                              Roll #
                            </TableHead>
                            <TableHead className="text-[10px] font-medium uppercase tracking-wider text-gray-400 px-4">
                              Name
                            </TableHead>
                            <TableHead className="text-[10px] font-medium uppercase tracking-wider text-gray-400 px-4">
                              Father / Guardian
                            </TableHead>
                            <TableHead className="text-[10px] font-medium uppercase tracking-wider text-gray-400 px-4">
                              Contact
                            </TableHead>
                            <TableHead className="text-[10px] font-medium uppercase tracking-wider text-gray-400 px-4 text-right">
                              Base Fee
                            </TableHead>
                            <TableHead className="text-[10px] font-medium uppercase tracking-wider text-gray-400 px-4 text-right">
                              Paid
                            </TableHead>
                            <TableHead className="text-[10px] font-medium uppercase tracking-wider text-gray-400 px-4 text-right">
                              Balance
                            </TableHead>
                            <TableHead className="text-[10px] font-medium uppercase tracking-wider text-gray-400 px-4 text-center">
                              Status
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {g.students.map((s) => {
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
                                <TableCell className="text-xs font-mono text-gray-700 px-4 py-2.5">
                                  {s.rollNo || '—'}
                                </TableCell>
                                <TableCell className="text-xs font-medium text-gray-900 px-4 py-2.5">
                                  {s.name}
                                </TableCell>
                                <TableCell className="text-xs text-gray-700 px-4 py-2.5">
                                  {s.guardian || s.fatherName || '—'}
                                </TableCell>
                                <TableCell className="text-xs text-gray-700 px-4 py-2.5 tabular-nums">
                                  {s.guardianPhone || '—'}
                                </TableCell>
                                <TableCell className="text-xs text-gray-700 px-4 py-2.5 text-right tabular-nums">
                                  {s.baseFee ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Lock className="h-3 w-3 text-gray-400" />
                                      {fmtMoney(Number(s.baseFee))}
                                    </span>
                                  ) : (
                                    '—'
                                  )}
                                </TableCell>
                                <TableCell className="text-xs font-semibold text-gray-900 px-4 py-2.5 text-right tabular-nums">
                                  {fmtMoney(paid)}
                                </TableCell>
                                <TableCell className="text-xs font-semibold text-gray-900 px-4 py-2.5 text-right tabular-nums">
                                  {fmtMoney(balance)}
                                </TableCell>
                                <TableCell className="px-4 py-2.5 text-center">
                                  <StatusBadge status={status} />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
            <Row label="Father / Guardian" value={student.guardian || student.fatherName || '—'} />
            {student.guardianPhone ? (
              <Row label="Father / Guardian Contact" value={student.guardianPhone} mono />
            ) : null}
            {student.cnic ? <Row label="CNIC" value={student.cnic} mono /> : null}
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

// ───────────────────────── 3. Fee & Installments (merged) ─────────────────────────
//
// One unified page that replaces the old Collect Payment + Fee Challans +
// Installments pages. The accountant can:
//   1. Pick a student whose base fee has been locked by the Admission Office
//   2. Split the locked base fee into 3-5 installments (creates invoice rows)
//   3. Mark any installment / monthly invoice as Paid
//   4. Download a print-ready challan as a PDF (jsPDF)
//   5. Bulk-generate monthly tuition challans for the whole branch

type InstallmentRow = { id: string; amount: string; due: string };

function FeeInstallmentsView({
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
  const [rows, setRows] = useState<InstallmentRow[]>([]);
  const [planError, setPlanError] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [generatedLogin, setGeneratedLogin] = useState<{ rollNo: string; password: string } | null>(null);
  const [generatingMonthly, setGeneratingMonthly] = useState(false);

  // Students with a locked base fee are the primary audience for this page.
  const lockedStudents = useMemo(
    () => students.filter((s) => s.baseFeeLocked && s.baseFee != null && s.baseFee !== ''),
    [students],
  );

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lockedStudents;
    return lockedStudents.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.rollNo?.toLowerCase().includes(q) ||
        s.class?.toLowerCase().includes(q),
    );
  }, [lockedStudents, search]);

  // All invoices for the selected student
  const studentInvoices = useMemo(() => {
    if (!selected) return [];
    return invoices
      .filter((i) => i.studentId === selected.id || i.userId === selected.id)
      .sort((a, b) => {
        // Installments first (by dueDate), then monthly (by year/month desc)
        const aType = (a.type || '').toLowerCase() === 'installment' ? 0 : 1;
        const bType = (b.type || '').toLowerCase() === 'installment' ? 0 : 1;
        if (aType !== bType) return aType - bType;
        if (aType === 0) return (a.dueDate || '').localeCompare(b.dueDate || '');
        return (b.year || 0) - (a.year || 0) || (a.month || '').localeCompare(b.month || '');
      });
  }, [invoices, selected]);

  const studentInstallments = useMemo(
    () => studentInvoices.filter((i) => (i.type || '').toLowerCase() === 'installment'),
    [studentInvoices],
  );

  const baseFee = Number(selected?.baseFee || 0);
  const totalPlanned = rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  const remaining = baseFee - totalPlanned;

  const outstandingTotal = useMemo(
    () =>
      studentInvoices
        .filter((i) => (i.status || '').toLowerCase() !== 'paid')
        .reduce((acc, i) => acc + Number(i.amount || 0) - Number(i.paidAmount || 0), 0),
    [studentInvoices],
  );
  const paidTotal = useMemo(
    () =>
      studentInvoices
        .filter((i) => (i.status || '').toLowerCase() === 'paid')
        .reduce((acc, i) => acc + Number(i.paidAmount || i.amount || 0), 0),
    [studentInvoices],
  );

  // ── Installment plan builder helpers ──
  const addRow = () =>
    setRows((prev) => [...prev, { id: `inst-${Date.now()}`, amount: '', due: '' }]);

  const updateRow = (id: string, patch: Partial<InstallmentRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

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
    setPlanError(null);
  };

  const createPlan = async () => {
    if (!selected) return;
    if (rows.length === 0) {
      setPlanError('Add at least one installment.');
      return;
    }
    if (rows.some((r) => !r.amount || !r.due)) {
      setPlanError('Fill in all amounts and due dates.');
      return;
    }
    if (totalPlanned !== baseFee) {
      setPlanError(
        `Installments total ${fmtMoney(totalPlanned)} — must equal the locked base fee ${fmtMoney(baseFee)}.`,
      );
      return;
    }
    setSavingPlan(true);
    setPlanError(null);
    try {
      const payload = rows.map((r) => ({ amount: Number(r.amount), dueDate: r.due }));
      await api.createInstallments(selected.id, payload);
      toast({
        title: 'Installment plan created',
        description: `${rows.length} installments for ${selected.name}.`,
      });
      setRows([]);
      onRefresh();
    } catch (e: any) {
      toast({
        title: 'Could not create installments',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingPlan(false);
    }
  };

  // ── Mark an invoice paid ──
  const markPaid = async (inv: any) => {
    setMarkingId(inv.id);
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
      toast({
        title: 'Marked as paid',
        description: `${inv.studentName || selected?.name} — ${fmtMoney(Number(inv.amount))}`,
      });
      // If first payment (no real login yet), offer to generate one.
      if (selected && !hasRealLogin(selected)) {
        const password = genDefaultPassword();
        const rollNo = selected.rollNo || selected.email?.split('@')[0] || selected.id;
        try {
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
          setGeneratedLogin({ rollNo: String(rollNo), password });
        }
      }
    } catch (e: any) {
      toast({
        title: 'Could not mark paid',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setMarkingId(null);
    }
  };

  // ── Download a challan as PDF (branded, with logo) ──
  const downloadChallanPdf = async (inv: any) => {
    setDownloadingId(inv.id);
    try {
      let data = inv;
      // Fetch the full challan data (includes institute + branch names) for a clean PDF.
      try {
        const full = await api.getChallanData(inv.id);
        data = { ...inv, ...full };
      } catch {}
      const doc = await buildFeeChallan({
        instituteName: data.instituteName || user?.instituteName,
        branchName: data.branchName || user?.branchName,
        docTitle: 'Fee Challan',
        docSubtitle: 'Accountant Office',
        refLabel: 'Challan #',
        refValue: data.challanNo || String(data.id || '').slice(0, 12),
        studentName: data.studentName || selected?.name || '—',
        rollNo: data.rollNo || selected?.rollNo || '—',
        className: data.className || data.class || selected?.class || '',
        section: data.section || selected?.section,
        challanNo: data.challanNo || String(data.id || '').slice(0, 12),
        amount: data.amount,
        type: data.type || 'Tuition',
        status: data.status || 'Unpaid',
        dueDate: data.dueDate,
        month: data.month,
        year: data.year,
        paidDate: data.paidDate || data.paidAt,
      });
      const fileName = `Challan-${data.challanNo || data.id}.pdf`;
      savePdf(doc, fileName);
      toast({ title: 'Challan downloaded', description: fileName });
    } catch (e: any) {
      toast({
        title: 'Could not download PDF',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Bulk-generate monthly tuition challans ──
  const generateMonthly = async () => {
    const now = new Date();
    const m = MONTHS[now.getMonth()];
    const y = now.getFullYear();
    setGeneratingMonthly(true);
    try {
      const res = await api.generateInvoices(m, y);
      toast({
        title: 'Monthly challans generated',
        description:
          res?.generated != null
            ? `${res.generated} new challan(s) for ${m} ${y}.`
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
      setGeneratingMonthly(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee & Installments"
        subtitle="Split the locked base fee into installments, collect payments, and download challans as PDF."
        action={
          <div className="flex gap-2 flex-wrap">
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
              onClick={generateMonthly}
              disabled={generatingMonthly || students.length === 0}
            >
              {generatingMonthly ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" /> Generate Monthly Challans
                </>
              )}
            </Button>
          </div>
        }
      />

      <LockedFeeCallout />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Student picker ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <SectionHeader
            title="Select Student"
            desc={lockedStudents.length === 0 ? 'No students with a locked fee yet.' : `${lockedStudents.length} student(s) with locked fee`}
          />
          <div className="relative mb-3">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll #, class…"
              className={`${inputCls} pl-9`}
            />
          </div>
          {loading ? (
            <SkeletonTable rows={4} />
          ) : (
            <div className="space-y-1.5 max-h-[32rem] overflow-y-auto -mr-1 pr-1">
              {filteredStudents.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={lockedStudents.length === 0 ? 'No locked fees' : 'No matching students'}
                  desc={
                    lockedStudents.length === 0
                      ? 'The Admission Office must lock each student\'s base fee first.'
                      : 'Try a different search.'
                  }
                />
              ) : (
                filteredStudents.map((s) => {
                  const invs = invoices.filter((i) => i.studentId === s.id || i.userId === s.id);
                  const instCount = invs.filter((i) => (i.type || '').toLowerCase() === 'installment').length;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelected(s);
                        setRows([]);
                        setPlanError(null);
                        setGeneratedLogin(null);
                      }}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-colors',
                        selected?.id === s.id
                          ? 'border-[#F26522] bg-[#F26522]/5'
                          : 'border-gray-200 hover:bg-gray-50',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                        {instCount > 0 && (
                          <span className="text-[10px] uppercase tracking-wider text-emerald-700 border border-emerald-100 bg-emerald-50 rounded px-1.5 py-0.5 shrink-0">
                            {instCount} inst.
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate mt-0.5">
                        {s.rollNo} · {s.class || '—'}
                        {s.section ? `-${s.section}` : ''} · {fmtMoney(Number(s.baseFee || 0))}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* ── Detail panel ── */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          {!selected ? (
            <EmptyState
              icon={Receipt}
              title="Select a student"
              desc="Pick a student on the left to split their locked base fee into installments, collect payments, and download challans."
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
                    {fmtMoney(baseFee)}
                  </p>
                </div>
              </div>

              {/* Paid + Outstanding KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Collected</p>
                  <p className="text-base font-bold text-emerald-700 mt-1 tabular-nums">{fmtMoney(paidTotal)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Outstanding</p>
                  <p className="text-base font-bold text-amber-700 mt-1 tabular-nums">{fmtMoney(outstandingTotal)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Installments</p>
                  <p className="text-base font-bold text-gray-900 mt-1 tabular-nums">
                    {studentInstallments.length}
                    <span className="text-xs text-gray-400 font-normal"> / plan</span>
                  </p>
                </div>
              </div>

              {/* ── Installment plan builder ── */}
              {studentInstallments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/40 p-4">
                  <SectionHeader
                    title="Create Installment Plan"
                    desc="Add each installment with its amount and a due date you pick manually."
                  />
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="text-xs text-gray-500">
                      Quick split (you can edit dates after):
                    </span>
                    {[3, 4, 5].map((n) => (
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
                  {rows.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500 bg-white">
                      No installments yet. Click “Add Row” to create each
                      installment with its own due date, or use a quick split.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-[2rem_1fr_1.3fr_2rem] gap-2 text-[10px] uppercase tracking-wider text-gray-400 px-1">
                        <span>#</span>
                        <span>Amount (Rs)</span>
                        <span>Due Date (pick manually)</span>
                        <span />
                      </div>
                      {rows.map((r, i) => (
                        <div key={r.id} className="grid grid-cols-[2rem_1fr_1.3fr_2rem] gap-2 items-center">
                          <span className="text-sm font-semibold text-gray-400 text-center">{i + 1}</span>
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
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium"
                      onClick={addRow}
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> Add Row
                    </Button>
                    <Button
                      className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-4 text-sm font-medium ml-auto"
                      onClick={createPlan}
                      disabled={savingPlan || rows.length === 0}
                    >
                      {savingPlan ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving…
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1.5" /> Create Installments
                        </>
                      )}
                    </Button>
                  </div>
                  {/* Totals */}
                  {rows.length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-1.5 mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Base Fee</span>
                        <span className="font-mono text-gray-900">{fmtMoney(baseFee)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Planned Total</span>
                        <span className="font-mono text-gray-900">{fmtMoney(totalPlanned)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-gray-200">
                        <span className="font-semibold text-gray-700">Remaining</span>
                        <span
                          className={cn(
                            'font-bold tabular-nums font-mono',
                            remaining === 0 ? 'text-emerald-700' : 'text-gray-900',
                          )}
                        >
                          {fmtMoney(remaining)}
                        </span>
                      </div>
                    </div>
                  )}
                  {planError && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2 mt-3">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {planError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Installment plan active</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        {studentInstallments.length} installments · use the list below to mark paid or download.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700"
                    onClick={() => {
                      setRows(
                        studentInstallments.map((i) => ({
                          id: `inst-${i.id}`,
                          amount: String(i.amount),
                          due: i.dueDate || '',
                        })),
                      );
                      setPlanError(null);
                    }}
                  >
                    Re-split
                  </Button>
                </div>
              )}

              {/* ── Invoices list ── */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  All Invoices & Installments
                </h4>
                {studentInvoices.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">
                    No invoices yet. Create an installment plan above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {studentInvoices.map((inv) => {
                      const isPaid = (inv.status || '').toLowerCase() === 'paid';
                      const isInstallment = (inv.type || '').toLowerCase() === 'installment';
                      return (
                        <div
                          key={inv.id}
                          className={cn(
                            'flex items-center justify-between gap-3 p-3 rounded-lg border',
                            isPaid ? 'border-emerald-100 bg-emerald-50/40' : 'border-gray-200 bg-white',
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-900">
                                {isInstallment
                                  ? `Installment — Due ${formatDate(inv.dueDate)}`
                                  : `${inv.type || 'Tuition'} — ${inv.month ? monthName(inv.month) : ''} ${inv.year || ''}`}
                              </p>
                              <StatusBadge status={inv.status} />
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                              {inv.challanNo || String(inv.id || '').slice(0, 12)}
                              {inv.paidAt && ` · Paid ${formatDate(inv.paidAt)}`}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-gray-900 tabular-nums">
                              {fmtMoney(Number(inv.amount || 0))}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                              onClick={() => downloadChallanPdf(inv)}
                              disabled={downloadingId === inv.id}
                            >
                              {downloadingId === inv.id ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <Download className="h-3.5 w-3.5 mr-1" />
                              )}
                              PDF
                            </Button>
                            {!isPaid && (
                              <Button
                                size="sm"
                                className="h-8 px-2.5 text-xs bg-[#F26522] hover:bg-[#D4541E] text-white"
                                onClick={() => markPaid(inv)}
                                disabled={markingId === inv.id}
                              >
                                {markingId === inv.id ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                )}
                                Mark Paid
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">Username (Roll #)</p>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="font-mono font-semibold text-gray-900 text-sm">{generatedLogin.rollNo}</span>
                        <CopyButton text={generatedLogin.rollNo} />
                      </div>
                    </div>
                    <div className="rounded-lg bg-white border border-emerald-100 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">Default Password</p>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="font-mono font-semibold text-gray-900 text-sm">{generatedLogin.password}</span>
                        <CopyButton text={generatedLogin.password} />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-2.5">
                    The student signs in at the portal with their{' '}
                    <span className="font-semibold">Roll Number</span> and this{' '}
                    <span className="font-semibold">password</span> — then changes it on first login.
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


// ───────────────────────── 6. Miscellaneous Charges ─────────────────────────

type MiscCharge = {
  id: string;
  studentId: string;
  studentName: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
};

function MiscChargesView({ user, students, loading }: { user: any; students: any[]; loading: boolean }) {
  const [charges, setCharges] = useState<MiscCharge[]>([]);
  const [chargesLoading, setChargesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selStudent, setSelStudent] = useState('');
  const [type, setType] = useState(MISC_CHARGE_TYPES[0]);
  const [customType, setCustomType] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Load persisted misc charges for the branch
  useEffect(() => {
    let cancelled = false;
    setChargesLoading(true);
    api
      .getMiscCharges({ branchId: user?.branchId })
      .then((data) => {
        if (cancelled) return;
        setCharges(Array.isArray(data) ? (data as MiscCharge[]) : []);
      })
      .catch(() => {
        if (!cancelled) setCharges([]);
      })
      .finally(() => !cancelled && setChargesLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.branchId]);

  const filteredCharges = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return charges;
    return charges.filter(
      (c) =>
        c.studentName?.toLowerCase().includes(q) ||
        c.type?.toLowerCase().includes(q),
    );
  }, [charges, search]);

  // Searchable student list — students are ONLY shown when the accountant
  // types a name (or roll # / class). This keeps the list short and focused
  // instead of dumping every enrolled student at once.
  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return [];
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.rollNo?.toLowerCase().includes(q) ||
        s.class?.toLowerCase().includes(q),
    );
  }, [students, studentSearch]);

  const selectedStudent = students.find((s) => s.id === selStudent);
  const isOther = type === 'Other';
  const finalType = isOther ? customType.trim() : type;

  const total = charges.reduce((acc, c) => acc + c.amount, 0);

  const add = async () => {
    if (!selStudent) {
      toast({ title: 'Select a student', variant: 'destructive' });
      return;
    }
    if (isOther && !customType.trim()) {
      toast({ title: 'Enter a custom charge type', variant: 'destructive' });
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
    setSaving(true);
    try {
      const created = await api.addMiscCharge({
        studentId: selStudent,
        type: finalType,
        amount: v,
        description: desc.trim(),
      });
      const newCharge: MiscCharge = {
        id: created.id || `MC-${Date.now()}`,
        studentId: selStudent,
        studentName: created.studentName || selectedStudent?.name || '—',
        type: finalType,
        amount: v,
        description: desc.trim(),
        createdAt: created.createdAt || new Date().toISOString(),
      };
      setCharges((prev) => [newCharge, ...prev]);
      setAmount('');
      setDesc('');
      setCustomType('');
      setType(MISC_CHARGE_TYPES[0]);
      toast({
        title: 'Charge added',
        description: `${finalType} — ${fmtMoney(v)} for ${selectedStudent?.name || 'student'}.`,
      });
    } catch (e: any) {
      toast({
        title: 'Could not add charge',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const prev = charges;
    setCharges((c) => c.filter((x) => x.id !== id));
    try {
      await api.deleteMiscCharge(id);
      toast({ title: 'Charge removed' });
    } catch (e: any) {
      setCharges(prev); // rollback
      toast({
        title: 'Could not remove charge',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Miscellaneous Charges"
        subtitle="One-off fees (admission, exam, or custom) — separate from base tuition."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Add form */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="Add Charge" desc="Record a one-off fee for a student." />
          <div className="space-y-3">
            {/* Searchable student picker */}
            <Field label="Student" required>
              {selStudent ? (
                <div className="flex items-center justify-between gap-2 p-3 rounded-lg border border-[#F26522] bg-[#F26522]/5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedStudent?.name || '—'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {selectedStudent?.rollNo || '—'} · {selectedStudent?.class || '—'}
                      {selectedStudent?.section ? `-${selectedStudent.section}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    onClick={() => setSelStudent('')}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="relative mb-2">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Type a student name, roll #, or class to search…"
                      className={`${inputCls} pl-9`}
                      autoFocus
                    />
                  </div>
                  {loading ? (
                    <SkeletonTable rows={3} />
                  ) : students.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">
                      No students enrolled yet. The Admission Office must enroll students first.
                    </div>
                  ) : studentSearch.trim() === '' ? (
                    <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">
                      Start typing above to search for a student by name, roll #, or class.
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto -mr-1 pr-1 space-y-1.5 rounded-lg border border-gray-200 p-1.5">
                      {filteredStudents.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-500 text-center">
                          No matching students. Try a different name.
                        </div>
                      ) : (
                        filteredStudents.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSelStudent(s.id);
                              setStudentSearch('');
                            }}
                            className="w-full text-left p-2.5 rounded-md border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                            <div className="text-[11px] text-gray-500 truncate mt-0.5">
                              {s.rollNo || '—'} · {s.class || '—'}
                              {s.section ? `-${s.section}` : ''}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </Field>

            {/* Charge type — 2 fixed + Other (custom text input) */}
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
              {isOther && (
                <div className="mt-2">
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">
                    Write the charge name
                  </label>
                  <Input
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="e.g. Sports Fee, Trip Fee, Library Fine…"
                    className={`${inputCls} w-full`}
                    autoFocus
                  />
                </div>
              )}
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
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" /> Add Charge
                </>
              )}
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
          {chargesLoading ? (
            <SkeletonTable rows={5} />
          ) : filteredCharges.length === 0 ? (
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
                        {c.description || c.desc || '—'}
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

  // --- Teacher login form state ---
  // Note: the accountant only creates the teacher's LOGIN (name, ID,
  // email, password). Subjects and classes are assigned later by the
  // Academic Office, so they are intentionally NOT part of this form.
  const [form, setForm] = useState({
    name: '',
    rollNo: '',
    email: '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ user: string; pass: string; name: string } | null>(
    null,
  );
  const nameRef = useRef<HTMLInputElement>(null);

  // --- Student edit + block state (Task 15) ---
  // The accountant can edit a student's portal details (name, roll #,
  // email, password, class, section, guardian, contact, CNIC) and can
  // block / unblock a student's login from the Student Logins tab.
  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [studentForm, setStudentForm] = useState({
    name: '',
    rollNo: '',
    email: '',
    password: '',
    class: '',
    section: '',
    guardian: '',
    guardianPhone: '',
    cnic: '',
  });
  const [revealStudentPw, setRevealStudentPw] = useState(false);
  const [studentPwLoading, setStudentPwLoading] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [blockingStudentId, setBlockingStudentId] = useState('');

  // --- Teacher manage-existing state (Task 15) ---
  // Below the creation form, the Teacher Logins tab lists every existing
  // teacher in the branch so the accountant can edit or block them.
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersSearch, setTeachersSearch] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [teacherEditForm, setTeacherEditForm] = useState({
    name: '',
    rollNo: '',
    email: '',
    password: '',
    title: '',
  });
  const [revealTeacherPw, setRevealTeacherPw] = useState(false);
  const [teacherPwLoading, setTeacherPwLoading] = useState(false);
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [blockingTeacherId, setBlockingTeacherId] = useState('');

  // Fetch the list of existing teachers (role=teacher, scoped to the
  // accountant's branch) whenever the Teacher tab is opened. The list is
  // re-fetched after every create / edit / block so the accountant sees
  // the latest state.
  const loadTeachers = () => {
    setTeachersLoading(true);
    api
      .platformUsers({ role: 'teacher', branchId: user?.branchId })
      .then((r) => setTeachers(Array.isArray(r) ? r : []))
      .catch(() => setTeachers([]))
      .finally(() => setTeachersLoading(false));
  };
  useEffect(() => {
    if (tab !== 'teacher') return;
    loadTeachers();
  }, [tab]);

  const filteredTeachers = useMemo(() => {
    const q = teachersSearch.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) =>
      t.name?.toLowerCase().includes(q) ||
      t.rollNo?.toLowerCase().includes(q),
    );
  }, [teachers, teachersSearch]);

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
      // Only the login is created here. Subjects / classes are assigned
      // later by the Academic Office.
      await api.createPlatformUser({
        name: form.name,
        email,
        rollNo: form.rollNo,
        password,
        role: 'teacher',
        branchId: user?.branchId,
        instituteId: user?.instituteId,
        title: 'Teacher',
      });
      setCreated({ user: form.rollNo, pass: password, name: form.name });
      setForm({
        name: '',
        rollNo: '',
        email: '',
        password: '',
      });
      // Refresh the "Manage Existing Teachers" list so the new teacher
      // appears immediately without a manual Refresh click.
      loadTeachers();
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

  // ─── Student edit + block helpers (Task 15) ───

  const openEditStudent = (s: any) => {
    setEditStudent(s);
    setRevealStudentPw(false);
    setStudentForm({
      name: s.name || '',
      rollNo: s.rollNo || '',
      email: s.email || '',
      password: '',
      class: s.class || '',
      section: s.section || '',
      guardian: s.guardian || s.fatherName || '',
      guardianPhone: s.guardianPhone || '',
      cnic: s.cnic || '',
    });
  };

  // Reveal / hide the student's current password. Tapping "Reveal" calls the
  // backend password endpoint; tapping again just hides the field locally.
  const revealStudentPassword = async () => {
    if (!editStudent) return;
    if (revealStudentPw) {
      setRevealStudentPw(false);
      return;
    }
    setStudentPwLoading(true);
    try {
      const r = await api.getUserPassword(editStudent.id);
      setStudentForm((prev) => ({ ...prev, password: r?.password || '' }));
      setRevealStudentPw(true);
    } catch (e: any) {
      toast({
        title: 'Could not fetch password',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setStudentPwLoading(false);
    }
  };

  const saveStudent = async () => {
    if (!editStudent) return;
    if (!studentForm.name || !studentForm.rollNo) {
      toast({ title: 'Name and Roll No are required', variant: 'destructive' });
      return;
    }
    setSavingStudent(true);
    try {
      const body: any = {
        name: studentForm.name,
        rollNo: studentForm.rollNo,
        email: studentForm.email,
        class: studentForm.class,
        section: studentForm.section,
        guardian: studentForm.guardian,
        guardianPhone: studentForm.guardianPhone,
        cnic: studentForm.cnic,
      };
      // Only send a new password when the accountant actually typed one —
      // leaving the field blank keeps the existing password intact.
      if (studentForm.password) body.password = studentForm.password;
      await api.editUser(editStudent.id, body);
      onUpdate({ id: editStudent.id, ...body });
      toast({
        title: 'Student updated',
        description: `${studentForm.name} — changes saved.`,
      });
      setEditStudent(null);
    } catch (e: any) {
      toast({
        title: 'Could not save changes',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingStudent(false);
    }
  };

  const toggleStudentBlock = async (s: any) => {
    const blocked = isBlocked(s);
    if (!blocked) {
      const ok = window.confirm(
        `Block ${s.name}? They will be signed out and unable to log in until unblocked.`,
      );
      if (!ok) return;
    }
    setBlockingStudentId(s.id);
    try {
      await api.blockUser(s.id, !blocked);
      onUpdate({ id: s.id, blocked: blocked ? 0 : 1 });
      toast({
        title: blocked ? 'Student unblocked' : 'Student blocked',
        description: blocked
          ? `${s.name} can now sign in again.`
          : `${s.name} has been signed out.`,
      });
    } catch (e: any) {
      toast({
        title: 'Could not update block status',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBlockingStudentId('');
    }
  };

  // ─── Teacher edit + block helpers (Task 15) ───

  const openEditTeacher = (t: any) => {
    setEditingTeacher(t);
    setRevealTeacherPw(false);
    setTeacherEditForm({
      name: t.name || '',
      rollNo: t.rollNo || '',
      email: t.email || '',
      password: '',
      title: t.title || '',
    });
  };

  const revealTeacherPassword = async () => {
    if (!editingTeacher) return;
    if (revealTeacherPw) {
      setRevealTeacherPw(false);
      return;
    }
    setTeacherPwLoading(true);
    try {
      const r = await api.getUserPassword(editingTeacher.id);
      setTeacherEditForm((prev) => ({ ...prev, password: r?.password || '' }));
      setRevealTeacherPw(true);
    } catch (e: any) {
      toast({
        title: 'Could not fetch password',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTeacherPwLoading(false);
    }
  };

  const saveTeacher = async () => {
    if (!editingTeacher) return;
    if (!teacherEditForm.name || !teacherEditForm.rollNo) {
      toast({ title: 'Name and Teacher ID are required', variant: 'destructive' });
      return;
    }
    setSavingTeacher(true);
    try {
      // Subjects / classes are managed by the Academic Office, so we
      // never touch them from the accountant side.
      const body: any = {
        name: teacherEditForm.name,
        rollNo: teacherEditForm.rollNo,
        email: teacherEditForm.email,
        title: teacherEditForm.title,
      };
      if (teacherEditForm.password) body.password = teacherEditForm.password;
      await api.editUser(editingTeacher.id, body);
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === editingTeacher.id ? { ...t, ...body } : t,
        ),
      );
      toast({
        title: 'Teacher updated',
        description: `${teacherEditForm.name} — changes saved.`,
      });
      setEditingTeacher(null);
    } catch (e: any) {
      toast({
        title: 'Could not save changes',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingTeacher(false);
    }
  };

  const toggleTeacherBlock = async (t: any) => {
    const blocked = isBlocked(t);
    if (!blocked) {
      const ok = window.confirm(
        `Block ${t.name}? They will be signed out and unable to log in until unblocked.`,
      );
      if (!ok) return;
    }
    setBlockingTeacherId(t.id);
    try {
      await api.blockUser(t.id, !blocked);
      setTeachers((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, blocked: blocked ? 0 : 1 } : x)),
      );
      toast({
        title: blocked ? 'Teacher unblocked' : 'Teacher blocked',
        description: blocked
          ? `${t.name} can now sign in again.`
          : `${t.name} has been signed out.`,
      });
    } catch (e: any) {
      toast({
        title: 'Could not update block status',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBlockingTeacherId('');
    }
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
                  const blocked = isBlocked(s);
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
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                            {blocked ? <BlockedBadge /> : null}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">
                            {s.rollNo} · {s.class || '—'}
                            {s.section ? `-${s.section}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {creds ? (
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="rounded-lg border border-emerald-100 bg-white px-3 py-1.5 text-xs">
                              <span className="text-[10px] uppercase tracking-wider text-gray-400 block">
                                Username (Roll #)
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

                        {/* Edit portal details */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-8 px-3 text-xs font-medium"
                          onClick={() => openEditStudent(s)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>

                        {/* Block / Unblock login */}
                        {blocked ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg h-8 px-3 text-xs font-medium"
                            onClick={() => toggleStudentBlock(s)}
                            disabled={blockingStudentId === s.id}
                          >
                            {blockingStudentId === s.id ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <Unlock className="h-3.5 w-3.5 mr-1" />
                            )}
                            Unblock
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg h-8 px-3 text-xs font-medium"
                            onClick={() => toggleStudentBlock(s)}
                            disabled={blockingStudentId === s.id}
                          >
                            {blockingStudentId === s.id ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 mr-1" />
                            )}
                            Block
                          </Button>
                        )}
                      </div>
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
              <p className="font-semibold text-gray-900">Teacher logins are created here.</p>
              <p className="mt-1">
                The username is the Teacher ID and the password is auto-generated (teacher can
                change it on first sign-in). Subjects and classes are assigned later by the
                <span className="font-medium text-gray-900"> Academic Office</span>.
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
            </div>

            {/* Workflow note — makes it explicit that course / class
                assignment is the Academic Office's responsibility. */}
            <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2.5 flex gap-2">
              <GraduationCap className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-800 leading-relaxed">
                Subjects and classes for this teacher will be assigned by the
                <span className="font-semibold"> Academic Office</span> after the login is
                created. The accountant only issues credentials.
              </p>
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

          {/* ===== Manage Existing Teachers (Task 15) ===== */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <SectionHeader
              title="Manage Existing Teachers"
              desc="Edit portal details or block / unblock any teacher in your branch."
              action={
                <button
                  onClick={loadTeachers}
                  disabled={teachersLoading}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#F26522] font-medium disabled:opacity-60"
                >
                  <Loader2 className={cn('h-3.5 w-3.5', teachersLoading && 'animate-spin')} />
                  Refresh
                </button>
              }
            />

            {/* Search */}
            <div className="relative mb-4">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={teachersSearch}
                onChange={(e) => setTeachersSearch(e.target.value)}
                placeholder="Search by name or Teacher ID…"
                className={`${inputCls} pl-9`}
              />
            </div>

            {teachersLoading && teachers.length === 0 ? (
              <SkeletonTable rows={4} />
            ) : teachers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No teachers found"
                desc="Create a new teacher login above — it will appear here once created."
              />
            ) : filteredTeachers.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matching teachers"
                desc="Try a different search term."
              />
            ) : (
              <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                {filteredTeachers.map((t) => {
                  const blocked = isBlocked(t);
                  return (
                    <div
                      key={t.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg border border-gray-200 bg-gray-50 grid place-items-center shrink-0">
                          <Users className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {t.name}
                            </p>
                            {blocked ? (
                              <BlockedBadge />
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                <Check className="h-3 w-3" /> Active
                              </span>
                            )}
                            {t.title ? (
                              <span className="text-[11px] text-gray-500">{t.title}</span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">
                            {t.rollNo || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-8 px-3 text-xs font-medium"
                          onClick={() => openEditTeacher(t)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        {blocked ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg h-8 px-3 text-xs font-medium"
                            onClick={() => toggleTeacherBlock(t)}
                            disabled={blockingTeacherId === t.id}
                          >
                            {blockingTeacherId === t.id ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <Unlock className="h-3.5 w-3.5 mr-1" />
                            )}
                            Unblock
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg h-8 px-3 text-xs font-medium"
                            onClick={() => toggleTeacherBlock(t)}
                            disabled={blockingTeacherId === t.id}
                          >
                            {blockingTeacherId === t.id ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 mr-1" />
                            )}
                            Block
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* ===== Student Edit Sheet (Task 15) ===== */}
      <Sheet
        open={!!editStudent}
        onOpenChange={(o) => !o && setEditStudent(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-white">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold text-gray-900">
              Edit Student Portal
            </SheetTitle>
            <SheetDescription className="text-sm text-gray-500">
              Update name, roll number, credentials, and contact details.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <Input
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className={inputCls}
                  placeholder="Student name"
                />
              </Field>
              <Field label="Roll Number" required>
                <Input
                  value={studentForm.rollNo}
                  onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. 10-A-001"
                />
              </Field>
              <Field label="Email">
                <Input
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className={inputCls}
                  placeholder="username@concordia.edu.pk"
                />
              </Field>
              <Field label="Password">
                <div className="relative">
                  <Input
                    type={revealStudentPw ? 'text' : 'password'}
                    value={studentForm.password}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, password: e.target.value })
                    }
                    className={`${inputCls} pr-24`}
                    placeholder="Leave blank to keep current"
                  />
                  <button
                    type="button"
                    onClick={revealStudentPassword}
                    disabled={studentPwLoading}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 h-7 px-2 text-[11px] font-medium text-gray-500 hover:text-[#F26522] rounded-md hover:bg-gray-50 disabled:opacity-60"
                  >
                    {studentPwLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : revealStudentPw ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    {revealStudentPw ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Tap Reveal to fetch the current password from the server.
                </p>
              </Field>
              <Field label="Class">
                <Input
                  value={studentForm.class}
                  onChange={(e) => setStudentForm({ ...studentForm, class: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Grade 10"
                />
              </Field>
              <Field label="Section">
                <Input
                  value={studentForm.section}
                  onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. A"
                />
              </Field>
              <Field label="Father / Guardian">
                <Input
                  value={studentForm.guardian}
                  onChange={(e) => setStudentForm({ ...studentForm, guardian: e.target.value })}
                  className={inputCls}
                  placeholder="Father or guardian name"
                />
              </Field>
              <Field label="Contact">
                <Input
                  value={studentForm.guardianPhone}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, guardianPhone: e.target.value })
                  }
                  className={inputCls}
                  placeholder="03xx-xxxxxxx"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="CNIC">
                  <Input
                    value={studentForm.cnic}
                    onChange={(e) => setStudentForm({ ...studentForm, cnic: e.target.value })}
                    className={inputCls}
                    placeholder="xxxxx-xxxxxxx-x"
                  />
                </Field>
              </div>
            </div>
          </div>

          <SheetFooter>
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                onClick={() => setEditStudent(null)}
                className={cn(btnSecondary, 'justify-center h-10')}
              >
                Cancel
              </button>
              <button
                onClick={saveStudent}
                disabled={savingStudent}
                className={cn(btnPrimary, 'justify-center h-10')}
              >
                {savingStudent ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ===== Teacher Edit Sheet (Task 15) ===== */}
      <Sheet
        open={!!editingTeacher}
        onOpenChange={(o) => !o && setEditingTeacher(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-white">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold text-gray-900">
              Edit Teacher Portal
            </SheetTitle>
            <SheetDescription className="text-sm text-gray-500">
              Update name, Teacher ID, and credentials. Subjects and classes are
              managed by the Academic Office.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <Input
                  value={teacherEditForm.name}
                  onChange={(e) =>
                    setTeacherEditForm({ ...teacherEditForm, name: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Teacher name"
                />
              </Field>
              <Field label="Teacher ID / Roll No" required>
                <Input
                  value={teacherEditForm.rollNo}
                  onChange={(e) =>
                    setTeacherEditForm({ ...teacherEditForm, rollNo: e.target.value })
                  }
                  className={inputCls}
                  placeholder="e.g. T001"
                />
              </Field>
              <Field label="Email">
                <Input
                  value={teacherEditForm.email}
                  onChange={(e) =>
                    setTeacherEditForm({ ...teacherEditForm, email: e.target.value })
                  }
                  className={inputCls}
                  placeholder="username@concordia.edu.pk"
                />
              </Field>
              <Field label="Password">
                <div className="relative">
                  <Input
                    type={revealTeacherPw ? 'text' : 'password'}
                    value={teacherEditForm.password}
                    onChange={(e) =>
                      setTeacherEditForm({ ...teacherEditForm, password: e.target.value })
                    }
                    className={`${inputCls} pr-24`}
                    placeholder="Leave blank to keep current"
                  />
                  <button
                    type="button"
                    onClick={revealTeacherPassword}
                    disabled={teacherPwLoading}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 h-7 px-2 text-[11px] font-medium text-gray-500 hover:text-[#F26522] rounded-md hover:bg-gray-50 disabled:opacity-60"
                  >
                    {teacherPwLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : revealTeacherPw ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    {revealTeacherPw ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Tap Reveal to fetch the current password from the server.
                </p>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Title">
                  <Input
                    value={teacherEditForm.title}
                    onChange={(e) =>
                      setTeacherEditForm({ ...teacherEditForm, title: e.target.value })
                    }
                    className={inputCls}
                    placeholder="e.g. Senior Teacher"
                  />
                </Field>
              </div>
            </div>

            {/* Academic Office owns course / class assignment. */}
            <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2.5 flex gap-2">
              <GraduationCap className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-800 leading-relaxed">
                Subjects and classes for this teacher are assigned by the
                <span className="font-semibold"> Academic Office</span>.
              </p>
            </div>
          </div>

          <SheetFooter>
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                onClick={() => setEditingTeacher(null)}
                className={cn(btnSecondary, 'justify-center h-10')}
              >
                Cancel
              </button>
              <button
                onClick={saveTeacher}
                disabled={savingTeacher}
                className={cn(btnPrimary, 'justify-center h-10')}
              >
                {savingTeacher ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
