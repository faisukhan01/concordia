'use client';

// ============================================================================
// Concordia College — Admission Office Portal (spec §2)
//
// Responsibilities:
//   1. Register new students with full personal info (spec §2.1)
//   2. Finalize & LOCK the one-time base fee — immutable after save
//   3. Update / manage existing student personal info
//
// The Admission Office does NOT create login credentials — the Accountant
// does that after the first fee payment. So this portal never asks for
// email/password; it generates an internal placeholder so the platform-users
// row can be created, and the Accountant later sets the real login.
//
// Design language: flat, restrained, grayscale + a single orange accent
// (#F26522) for primary actions and the section accent line. No gradients,
// no decorative blobs, no colored icon tiles.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  UserPlus,
  GraduationCap,
  DollarSign,
  Lock,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit,
  CalendarDays,
  Hash,
  TrendingUp,
  Users,
  Clock,
  Info,
  KeyRound,
  Image as ImageIcon,
  X,
  Download,
  Eye,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------
const PROGRAMS = [
  'ICS',
  'I.Com',
  'F.Sc Pre-Medical',
  'F.Sc Pre-Engineering',
  'FA',
  'F.A General Science',
  'ADP',
  'BS Commerce',
];

const fmtMoney = (n: number) => 'PKR ' + Number(n || 0).toLocaleString('en-PK');

const isLocked = (s: any) =>
  Boolean(s?.baseFeeLocked) && s?.baseFee != null && s.baseFee !== '';

const monthName = (d: Date) =>
  d.toLocaleString('en-PK', { month: 'short', year: 'numeric' });

const genTempPassword = () =>
  'tmp-' + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);

type Props = { activeModule: string; user: any };

// ---------------------------------------------------------------------------
// Main router
// ---------------------------------------------------------------------------
export function AdmissionsPortal({ activeModule, user }: Props) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial + branch-change load. The effect body performs NO synchronous
  // setState — all state updates happen inside async promise callbacks.
  useEffect(() => {
    let cancelled = false;
    api
      .platformUsers({ role: 'student', branchId: user?.branchId })
      .then((r) => {
        if (!cancelled) setStudents(Array.isArray(r) ? r : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load students');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.branchId]);

  // Manual refresh (button clicks) may synchronously flip loading=true.
  const refresh = () => {
    setLoading(true);
    setError(null);
    api
      .platformUsers({ role: 'student', branchId: user?.branchId })
      .then((r) => setStudents(Array.isArray(r) ? r : []))
      .catch((e) => setError(e.message || 'Failed to load students'))
      .finally(() => setLoading(false));
  };

  // Optimistic local upsert — keeps the UI responsive while the backend
  // (which a later task wires up for the new admissions fields) catches up.
  const upsertLocal = (s: any) =>
    setStudents((prev) => {
      const idx = prev.findIndex((x) => x.id === s.id);
      if (idx === -1) return [s, ...prev];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...s };
      return copy;
    });

  let content: React.ReactNode;
  if (activeModule === 'admissions-new')
    content = (
      <NewEnrollmentView
        user={user}
        students={students}
        onCreated={refresh}
        onLocalUpsert={upsertLocal}
      />
    );
  else if (activeModule === 'admissions-students')
    content = (
      <StudentRecordsView
        user={user}
        students={students}
        loading={loading}
        error={error}
        onRefresh={refresh}
        onLocalUpsert={upsertLocal}
      />
    );
  else if (activeModule === 'admissions-base-fee')
    content = (
      <BaseFeeView
        students={students}
        loading={loading}
        onRefresh={refresh}
        onLocalUpsert={upsertLocal}
      />
    );
  else content = <OverviewView user={user} students={students} loading={loading} />;

  return <div className="animate-in fade-in-0 duration-200">{content}</div>;
}

// ---------------------------------------------------------------------------
// Shared presentational bits
// ---------------------------------------------------------------------------

// Clean welcome header: thin orange accent line + h1 + muted subtitle.
function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <div className="h-0.5 w-8 bg-[#F26522] mb-3" />
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// FLAT KPI card — white bg, gray border, small inline icon top-right.
function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: any;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-2 truncate">{value}</p>
          {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
        </div>
        <Icon className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

function StatusBadge({ student }: { student: any }) {
  if (isLocked(student))
    return (
      <Badge
        variant="outline"
        className="bg-emerald-50 text-emerald-700 border-transparent gap-1"
      >
        <Lock className="h-3 w-3" /> Locked
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="bg-amber-50 text-amber-700 border-transparent gap-1"
    >
      <Clock className="h-3 w-3" /> Pending
    </Badge>
  );
}

// Gray, restrained info callout. NOT orange-tinted.
function BaseFeeCallout() {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex gap-3">
      <Info className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
      <div className="text-sm text-gray-600 leading-relaxed">
        <p className="font-semibold text-gray-900">
          Base Fee is set once by the Admission Office and locked forever.
        </p>
        <p className="mt-1">
          The Accountant may later split this amount into installments, but{' '}
          <span className="font-medium text-gray-900">cannot change the base amount</span>.
          Double-check the figure before clicking{' '}
          <span className="font-medium text-gray-900">Finalize &amp; Lock</span> — there is no
          undo.
        </p>
      </div>
    </div>
  );
}

// Simple empty state — small muted icon + text. No big colored circles.
function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: any;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-12 text-center">
      <Icon className="h-6 w-6 text-gray-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">{desc}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Field wrapper: label above input, small asterisk for required fields.
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
      <Label className="text-xs font-semibold text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-[#F26522] ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

// Shared input className — keeps every input visually consistent.
const inputCls =
  'h-10 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/12';

// ---------------------------------------------------------------------------
// 1. Overview / Dashboard
// ---------------------------------------------------------------------------
function OverviewView({
  user,
  students,
  loading,
}: {
  user: any;
  students: any[];
  loading: boolean;
}) {
  const now = useMemo(() => new Date(), []);

  const recent = useMemo(
    () =>
      [...students]
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 10),
    [students],
  );

  const thisMonthCount = useMemo(() => {
    const m = now.getMonth();
    const y = now.getFullYear();
    return students.filter((s) => {
      const d = s.createdAt ? new Date(s.createdAt) : null;
      return !!d && d.getMonth() === m && d.getFullYear() === y;
    }).length;
  }, [students, now]);

  const pendingFee = useMemo(() => students.filter((s) => !isLocked(s)), [students]);
  const lockedCount = students.length - pendingFee.length;
  const lockedSum = useMemo(
    () =>
      students
        .filter((s) => isLocked(s))
        .reduce((acc, s) => acc + Number(s.baseFee || 0), 0),
    [students],
  );

  // Enrollment by program (simple muted CSS bars).
  const byProgram = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students) {
      const p = s.program || 'Unspecified';
      map.set(p, (map.get(p) || 0) + 1);
    }
    const arr = Array.from(map.entries()).map(([name, count]) => ({ name, count }));
    arr.sort((a, b) => b.count - a.count);
    return arr;
  }, [students]);
  const maxProgram = Math.max(1, ...byProgram.map((p) => p.count));

  return (
    <div className="space-y-6">
      {/* Welcome header — clean text only, no gradient banner */}
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Officer'}`}
        subtitle="Register new students, finalize base fees, and manage enrollment records — all in one place."
      />

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Enrolled Students"
            value={students.length}
            icon={GraduationCap}
            hint="All records in this branch"
          />
          <KpiCard
            label="This Month"
            value={thisMonthCount}
            icon={TrendingUp}
            hint={monthName(now)}
          />
          <KpiCard
            label="Pending Base Fee"
            value={pendingFee.length}
            icon={Clock}
            hint="Awaiting finalization"
          />
          <KpiCard
            label="Base Fee Locked"
            value={lockedCount}
            icon={Lock}
            hint={fmtMoney(lockedSum)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent admissions */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Recent Admissions</h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 10 enrolled students</p>
            </div>
          </div>
          {loading ? (
            <SkeletonTable rows={5} />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No students enrolled yet"
              desc="Use New Enrollment to add the first one."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 hover:bg-transparent">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Name
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Class
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Roll #
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                    Base Fee
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-center">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((s) => (
                  <TableRow
                    key={s.id}
                    className="border-gray-100 hover:bg-gray-50"
                  >
                    <TableCell className="text-sm font-medium text-gray-900">
                      {s.name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {s.class || '—'}
                      {s.section ? ` · ${s.section}` : ''}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-gray-700">
                      {s.rollNo || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 text-right">
                      {isLocked(s) ? fmtMoney(Number(s.baseFee)) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge student={s} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Enrollment by program */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Enrollment by Program</h2>
            <p className="text-xs text-gray-500 mt-0.5">Distribution across courses</p>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          ) : byProgram.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No program data yet" desc="" />
          ) : (
            <div className="space-y-3">
              {byProgram.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900 truncate">{p.name}</span>
                    <span className="text-gray-500 tabular-nums">{p.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gray-400"
                      style={{ width: `${(p.count / maxProgram) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. New Enrollment
// ---------------------------------------------------------------------------
type EnrollForm = {
  name: string;
  fatherName: string;
  cnic: string;
  dob: string;
  address: string;
  prevResult: string;
  program: string;
  classId: string;
  section: string;
  rollNo: string;
  guardian: string;
  baseFee: string;
  photoUrl: string;
};

const emptyForm: EnrollForm = {
  name: '',
  fatherName: '',
  cnic: '',
  dob: '',
  address: '',
  prevResult: '',
  program: '',
  classId: '',
  section: '',
  rollNo: '',
  guardian: '',
  baseFee: '',
  photoUrl: '',
};

function NewEnrollmentView({
  user,
  students,
  onCreated,
  onLocalUpsert,
}: {
  user: any;
  students: any[];
  onCreated: () => void;
  onLocalUpsert: (s: any) => void;
}) {
  const [form, setForm] = useState<EnrollForm>(emptyForm);
  const [classes, setClasses] = useState<any[]>([]);
  const [reference, setReference] = useState<{ sections: string[] }>({ sections: [] });
  const [saving, setSaving] = useState(false);
  const [feeLocked, setFeeLocked] = useState(false);
  const [created, setCreated] = useState<any>(null);

  // --- Wizard state ---
  // step tracks the current 1..3 step; touched tracks fields the user has
  // blurred so we only show inline hints after they've interacted; cnicWarning
  // holds the duplicate-CNIC notice (warning, not a block).
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [cnicWarning, setCnicWarning] = useState<string | null>(null);

  // Fetch classes + reference once on mount.
  useEffect(() => {
    if (user?.branchId) {
      api
        .getClasses(user.branchId)
        .then((r) => setClasses(Array.isArray(r) ? r : []))
        .catch(() => setClasses([]));
    }
    api
      .reference()
      .then((r) => setReference({ sections: r?.sections || ['A', 'B', 'C'] }))
      .catch(() => setReference({ sections: ['A', 'B', 'C'] }));
  }, [user?.branchId]);

  // Class-scoped roll-number suggestion: when the user picks a class on
  // Step 2, auto-suggest STU-{year}-{classSeq:03d} based on how many students
  // are already in THAT class (not the whole branch). Field stays editable.
  useEffect(() => {
    if (!form.classId) return;
    const inClass = students.filter((s) => s.classId === form.classId);
    const year = new Date().getFullYear();
    const seq = inClass.length + 1;
    setForm((f) => ({ ...f, rollNo: `STU-${year}-${String(seq).padStart(3, '0')}` }));
    // Only re-run when classId changes — we don't want a students refresh to
    // overwrite a value the user has manually edited.
  }, [form.classId]);

  // Debounced (400ms) duplicate-CNIC detection. Warns but does not block —
  // the user can still save after acknowledging.
  useEffect(() => {
    const cnic = form.cnic.trim();
    if (!cnic) {
      setCnicWarning(null);
      return;
    }
    const t = setTimeout(() => {
      const match = students.find(
        (s) => s.cnic && String(s.cnic).trim() === cnic,
      );
      if (match) {
        setCnicWarning(
          `A student with this CNIC is already enrolled: ${match.name} (${match.rollNo}). Verify this is a different person before saving.`,
        );
      } else {
        setCnicWarning(null);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.cnic, students]);

  const set = (k: keyof EnrollForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const markTouched = (k: string) =>
    setTouched((t) => (t[k] ? t : { ...t, [k]: true }));

  // Inline validation hint — small red helper below the input, shown only
  // when the field has been touched (blurred) and is still empty.
  const err = (k: keyof EnrollForm, label: string): React.ReactNode =>
    touched[k] && !form[k].trim() ? (
      <p className="text-[11px] text-red-500 mt-1">{label} is required.</p>
    ) : null;

  // Validate the required fields for a given step. Marks missing fields as
  // touched so their inline hints appear, and shows a single toast.
  const validateStep = (n: 1 | 2 | 3): boolean => {
    if (n === 1) {
      const required: (keyof EnrollForm)[] = ['name', 'fatherName', 'cnic'];
      const missing = required.filter((k) => !form[k].trim());
      if (missing.length) {
        setTouched((t) => {
          const next = { ...t };
          for (const k of missing) next[k] = true;
          return next;
        });
        toast({
          title: 'Please complete required fields',
          description: 'Highlighted fields on this step are required.',
          variant: 'destructive',
        });
        return false;
      }
      return true;
    }
    if (n === 2) {
      const required: (keyof EnrollForm)[] = ['program', 'classId', 'rollNo'];
      const missing = required.filter((k) => !form[k].trim());
      if (missing.length) {
        setTouched((t) => {
          const next = { ...t };
          for (const k of missing) next[k] = true;
          return next;
        });
        toast({
          title: 'Please complete academic placement',
          description: 'Program, class, and roll number are required.',
          variant: 'destructive',
        });
        return false;
      }
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => (s === 1 ? 2 : s === 2 ? 3 : s));
  };

  const goBack = () => setStep((s) => (s === 3 ? 2 : s === 2 ? 1 : s));

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast({
        title: 'Image too large',
        description: 'Please pick a photo under 1.5 MB.',
        variant: 'destructive',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('photoUrl', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const lockFeeNow = () => {
    const v = Number(form.baseFee);
    if (!form.baseFee || isNaN(v) || v <= 0) {
      toast({
        title: 'Enter a valid amount',
        description: 'Base fee must be a positive number.',
        variant: 'destructive',
      });
      return;
    }
    setFeeLocked(true);
    toast({
      title: 'Base fee staged',
      description: `${fmtMoney(v)} will be locked permanently once you save the enrollment.`,
    });
  };

  const submit = async () => {
    // Defensive: re-validate every step before saving (each step's Continue
    // already validated, but this guards against refreshes or back-edits).
    if (!validateStep(1)) {
      setStep(1);
      return;
    }
    if (!validateStep(2)) {
      setStep(2);
      return;
    }

    const selectedClass = classes.find((c) => c.id === form.classId);
    const body: any = {
      name: form.name.trim(),
      rollNo: form.rollNo.trim(),
      // Internal placeholder — the Accountant sets the real login later.
      password: genTempPassword(),
      email: `${form.rollNo.trim().toLowerCase()}@pending.concordia.edu.pk`,
      role: 'student',
      instituteId: user?.instituteId,
      branchId: user?.branchId,
      class: selectedClass?.name || null,
      classId: form.classId,
      section: form.section || selectedClass?.section || 'A',
      guardian: form.guardian.trim() || null,
      // Concordia admissions fields (spec §2.1)
      fatherName: form.fatherName.trim(),
      cnic: form.cnic.trim(),
      dob: form.dob || null,
      address: form.address.trim() || null,
      prevResult: form.prevResult.trim() || null,
      program: form.program,
      photoUrl: form.photoUrl || null,
    };
    if (feeLocked && form.baseFee) {
      body.baseFee = Number(form.baseFee);
      body.baseFeeLocked = true;
    }

    setSaving(true);
    try {
      const res = await api.createPlatformUser(body);
      const newStudent: any = {
        id: res?.user?.id || `local-${Date.now()}`,
        ...body,
        baseFee: body.baseFee ?? null,
        baseFeeLocked: !!body.baseFeeLocked,
        createdAt: new Date().toISOString(),
      };
      onLocalUpsert(newStudent);
      onCreated();
      setCreated(newStudent);
    } catch (e: any) {
      // Optimistic fallback so the demo still flows when the backend
      // hasn't been wired for the admissions role yet.
      const newStudent: any = {
        id: `local-${Date.now()}`,
        ...body,
        baseFee: body.baseFee ?? null,
        baseFeeLocked: !!body.baseFeeLocked,
        createdAt: new Date().toISOString(),
      };
      onLocalUpsert(newStudent);
      setCreated(newStudent);
      toast({
        title: 'Saved in this session',
        description:
          (e?.message || 'Backend sync failed') +
          ' — the record is visible here and will sync once the admissions API is wired.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to Step 1 (not Step 3) when the user wants to enroll another.
  const reset = () => {
    setForm({ ...emptyForm });
    setFeeLocked(false);
    setCreated(null);
    setStep(1);
    setTouched({});
    setCnicWarning(null);
  };

  // === Confirmation screen (with print support) ===
  if (created) {
    return (
      <div className="max-w-xl mx-auto">
        {/*
          Print CSS — uses the visibility trick to hide everything outside
          .print-receipt when the user prints. .no-print elements (the action
          buttons) are removed entirely via display:none.
        */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                body * { visibility: hidden !important; }
                .print-receipt, .print-receipt * { visibility: visible !important; }
                .print-receipt {
                  position: absolute !important;
                  left: 0; top: 0; right: 0;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 24px !important;
                  border: none !important;
                  box-shadow: none !important;
                }
                .no-print { display: none !important; }
              }
            `,
          }}
        />
        <div className="print-receipt rounded-xl border border-gray-200 bg-white p-8 text-center">
          <div className="h-0.5 w-8 bg-[#F26522] mx-auto mb-4" />
          <CheckCircle2 className="h-9 w-9 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Enrollment Confirmed</h2>
          <p className="text-sm text-gray-500 mt-1.5">
            <span className="font-medium text-gray-900">{created.name}</span> has been
            registered in{' '}
            <span className="font-medium text-gray-900">{created.program}</span>.
          </p>
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left text-sm space-y-2">
            <Row label="Roll Number" value={created.rollNo} mono />
            <Row
              label="Class"
              value={`${created.class || '—'}${created.section ? ' · ' + created.section : ''}`}
            />
            <Row
              label="Base Fee"
              value={
                created.baseFeeLocked ? fmtMoney(Number(created.baseFee)) : 'Not finalized yet'
              }
            />
            <Row
              label="Status"
              value={created.baseFeeLocked ? 'Locked' : 'Pending finalization'}
            />
          </div>
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left flex gap-3">
            <KeyRound className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed">
              Login credentials are <span className="font-medium text-gray-900">not</span>{' '}
              created at this stage. The Accountant will issue the student&apos;s email &amp;
              password after the first fee payment.
            </p>
          </div>
          <div className="flex gap-2 mt-6 no-print">
            <Button
              variant="outline"
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium flex-1"
              onClick={() => window.print()}
            >
              Print Receipt
            </Button>
            <Button
              className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-4 text-sm font-medium flex-1"
              onClick={reset}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Enroll Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // === Sticky step indicator (3 numbered circles + thin connecting line) ===
  // Current step is highlighted in #F26522; completed steps show a checkmark;
  // future steps are gray. A separate progress line fills orange as steps
  // complete, sitting on top of a gray background line.
  const stepLabels = ['Personal', 'Academic', 'Fees'];
  const stepIndicator = (
    <div className="sticky top-0 z-20 py-3 bg-white/95 backdrop-blur border-y border-gray-200">
      <div className="relative max-w-md mx-auto">
        {/* Background line — gray, sits at the circle's vertical center (h-9/2 = 18px) */}
        <div className="absolute left-4 right-4 top-[18px] h-px bg-gray-200" />
        {/* Progress line — orange, fills 0% / 50% / 100% as steps complete */}
        <div
          className="absolute left-4 top-[18px] h-px bg-[#F26522] transition-all duration-300"
          style={{
            width:
              step === 1
                ? '0px'
                : step === 2
                  ? 'calc(50% - 1rem)'
                  : 'calc(100% - 2rem)',
          }}
        />
        {/* Circles + labels */}
        <div className="relative flex justify-between items-start">
          {[1, 2, 3].map((n, i) => {
            const isActive = step === n;
            const isDone = step > n;
            return (
              <div key={n} className="flex flex-col items-center">
                <div
                  className={`h-9 w-9 rounded-full grid place-items-center text-sm font-semibold border-2 bg-white shrink-0 ${
                    isActive || isDone
                      ? 'bg-[#F26522] text-white border-[#F26522]'
                      : 'bg-white text-gray-400 border-gray-200'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : n}
                </div>
                <span
                  className={`text-[11px] font-medium mt-1.5 ${
                    isActive ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {stepLabels[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="New Enrollment"
        subtitle="Capture the student's personal details and finalize the one-time base fee."
      />

      {stepIndicator}

      {/* === Step 1 — Personal Information === */}
      {step === 1 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Personal Information</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Student identity and contact details.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Student Name" required>
              <Input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                onBlur={() => markTouched('name')}
                placeholder="e.g. Ahmed Raza"
                className={inputCls}
              />
              {err('name', 'Student name')}
            </Field>
            <Field label="Father's Name" required>
              <Input
                value={form.fatherName}
                onChange={(e) => set('fatherName', e.target.value)}
                onBlur={() => markTouched('fatherName')}
                placeholder="e.g. Muhammad Raza"
                className={inputCls}
              />
              {err('fatherName', "Father's name")}
            </Field>
            <Field label="CNIC / B-Form Number" required>
              <div className="relative">
                <Hash className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={form.cnic}
                  onChange={(e) => set('cnic', e.target.value)}
                  onBlur={() => markTouched('cnic')}
                  placeholder="xxxxx-xxxxxxx-x"
                  className={`${inputCls} pl-9`}
                />
              </div>
              {err('cnic', 'CNIC / B-Form number')}
              {cnicWarning && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-snug">
                    ⚠ {cnicWarning}
                  </p>
                </div>
              )}
            </Field>
            <Field label="Date of Birth">
              <div className="relative">
                <CalendarDays className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="date"
                  value={form.dob}
                  onChange={(e) => set('dob', e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>
            <Field label="Guardian Name">
              <Input
                value={form.guardian}
                onChange={(e) => set('guardian', e.target.value)}
                placeholder="e.g. Muhammad Raza"
                className={inputCls}
              />
            </Field>
            <Field label="Previous Academic Result">
              <Input
                value={form.prevResult}
                onChange={(e) => set('prevResult', e.target.value)}
                placeholder="e.g. Matric — 85% (A Grade)"
                className={inputCls}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Address">
                <Textarea
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="House #, Street, Area, City"
                  rows={2}
                  className="rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/12"
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Student Photograph">
                <div className="flex items-center gap-4">
                  {/* Preview: 96x96 (h-24 w-24), with hover "Change" overlay
                      and a circular Remove X button in the top-right corner.
                      Both controls appear only when a photo is set. */}
                  <div className="relative group shrink-0">
                    <div className="h-24 w-24 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden grid place-items-center">
                      {form.photoUrl ? (
                        <img
                          src={form.photoUrl}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-7 w-7 text-gray-300" />
                      )}
                    </div>
                    {/* Hover "Change" overlay — wraps a hidden file input */}
                    {form.photoUrl && (
                      <label className="absolute inset-0 rounded-xl bg-black/40 text-white text-[11px] font-medium grid place-items-center cursor-pointer opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        Change
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onPhoto}
                          className="hidden"
                        />
                      </label>
                    )}
                    {/* Circular Remove button — top-right, only when photo set */}
                    {form.photoUrl && (
                      <button
                        type="button"
                        onClick={() => set('photoUrl', '')}
                        aria-label="Remove photo"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border border-gray-200 shadow-sm grid place-items-center text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {!form.photoUrl && (
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={onPhoto}
                        className="text-sm h-10 rounded-lg border border-gray-200 file:mr-3 file:rounded-md file:border-0 file:bg-gray-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-700 hover:file:bg-gray-100"
                      />
                    )}
                    <p className="text-[11px] text-gray-500">
                      JPG/PNG, up to 1.5 MB. Hover the preview to change.
                    </p>
                  </div>
                </div>
              </Field>
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <Button
              type="button"
              onClick={goNext}
              className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-5 text-sm font-medium min-w-32"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* === Step 2 — Academic Placement === */}
      {step === 2 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Academic Placement</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Program, class section, and roll number.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Course / Program" required>
              <Select
                value={form.program}
                onValueChange={(v) => {
                  set('program', v);
                  markTouched('program');
                }}
              >
                <SelectTrigger className={`${inputCls} w-full`}>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err('program', 'Program')}
            </Field>
            <Field label="Class" required>
              <Select
                value={form.classId}
                onValueChange={(v) => {
                  const c = classes.find((x) => x.id === v);
                  set('classId', v);
                  if (c?.section) set('section', c.section);
                  markTouched('classId');
                }}
              >
                <SelectTrigger className={`${inputCls} w-full`}>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-500">
                      No classes in this branch.
                    </div>
                  )}
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.section ? ` — ${c.section}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err('classId', 'Class')}
            </Field>
            <Field label="Section">
              <Select value={form.section} onValueChange={(v) => set('section', v)}>
                <SelectTrigger className={`${inputCls} w-full`}>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {(reference.sections.length ? reference.sections : ['A', 'B', 'C']).map(
                    (s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Roll Number" required>
              <div className="relative">
                <Hash className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={form.rollNo}
                  onChange={(e) => set('rollNo', e.target.value)}
                  onBlur={() => markTouched('rollNo')}
                  placeholder="Auto-suggested from class"
                  className={`${inputCls} pl-9 font-mono text-sm`}
                />
              </div>
              {err('rollNo', 'Roll number')}
              <p className="text-[11px] text-gray-500 mt-1">
                Auto-suggested from this class — edit if needed.
              </p>
            </Field>
          </div>

          <div className="flex gap-2 justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={goNext}
              className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-5 text-sm font-medium min-w-32"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* === Step 3 — Base Fee Finalization === */}
      {step === 3 && (
        <div className="space-y-6">
          <BaseFeeCallout />

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Base Fee Finalization</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  One-time amount, locked permanently on save.
                </p>
              </div>
              {feeLocked && (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-transparent gap-1"
                >
                  <Lock className="h-3 w-3" /> Staged for Lock
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
              <Field label="Base Fee Amount (PKR)">
                <div className="relative">
                  <DollarSign className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="number"
                    min={0}
                    value={form.baseFee}
                    onChange={(e) => {
                      set('baseFee', e.target.value);
                      if (feeLocked) setFeeLocked(false);
                    }}
                    placeholder="e.g. 45000"
                    className={`${inputCls} pl-9`}
                    disabled={feeLocked}
                  />
                </div>
              </Field>
              <Button
                type="button"
                className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-10 px-5 text-sm font-medium"
                onClick={lockFeeNow}
                disabled={feeLocked}
              >
                {feeLocked ? (
                  <>
                    <Lock className="h-4 w-4 mr-1.5" /> Locked
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-1.5" /> Finalize &amp; Lock
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {feeLocked
                ? 'Base fee is staged. It will be permanently locked when you save the enrollment.'
                : 'Optional at enrollment — you can also lock it later from Base Fee Finalization. Once locked, it cannot be edited.'}
            </p>
          </div>

          {/* Review summary before save */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Review &amp; Save</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Confirm the enrollment details below before saving.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <Row label="Student" value={form.name || '—'} />
              <Row label="Father" value={form.fatherName || '—'} />
              <Row label="CNIC" value={form.cnic || '—'} mono />
              <Row label="Program" value={form.program || '—'} />
              <Row
                label="Class"
                value={
                  form.classId
                    ? `${classes.find((c) => c.id === form.classId)?.name || '—'}${form.section ? ' · ' + form.section : ''}`
                    : '—'
                }
              />
              <Row label="Roll #" value={form.rollNo || '—'} mono />
              <Row
                label="Base Fee"
                value={
                  feeLocked && form.baseFee ? fmtMoney(Number(form.baseFee)) : 'Not finalized'
                }
              />
              <Row label="Photo" value={form.photoUrl ? 'Attached' : 'None'} />
            </div>
          </div>

          <div className="flex gap-2 justify-between pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium"
            >
              Back
            </Button>
            <Button
              className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-4 text-sm font-medium min-w-40"
              onClick={submit}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Save Enrollment
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Student Records
// ---------------------------------------------------------------------------
function StudentRecordsView({
  user,
  students,
  loading,
  error,
  onRefresh,
  onLocalUpsert,
}: {
  user: any;
  students: any[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onLocalUpsert: (s: any) => void;
}) {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [editing, setEditing] = useState<any | null>(null);

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
        s.fatherName?.toLowerCase().includes(q) ||
        s.rollNo?.toLowerCase().includes(q) ||
        s.cnic?.toLowerCase().includes(q)
      );
    });
  }, [students, search, classFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Records"
        subtitle="Search, filter, and edit personal information for enrolled students."
        actions={
          <Button
            variant="outline"
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium"
            onClick={onRefresh}
          >
            <Loader2
              className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`}
            />
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
              placeholder="Search by name, father, roll #, or CNIC…"
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
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        ) : loading ? (
          <SkeletonTable rows={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={students.length === 0 ? 'No students enrolled yet' : 'No matching records'}
            desc={
              students.length === 0
                ? 'Start by enrolling your first student from the New Enrollment tab.'
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
                    Father
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Class
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Program
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                    Base Fee
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className="border-gray-100 hover:bg-gray-50">
                    <TableCell className="text-sm font-mono text-gray-700">
                      {s.rollNo || '—'}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-900">
                      {s.name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {s.fatherName || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {s.class || '—'}
                      {s.section ? (
                        <span className="text-gray-400"> · {s.section}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {s.program || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 text-right">
                      {isLocked(s) ? fmtMoney(Number(s.baseFee)) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge student={s} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        onClick={() => setEditing(s)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit sheet */}
      <EditStudentSheet
        student={editing}
        user={user}
        onClose={() => setEditing(null)}
        onSaved={(updated) => {
          onLocalUpsert(updated);
          setEditing(null);
        }}
      />
    </div>
  );
}

function EditStudentSheet({
  student,
  user,
  onClose,
  onSaved,
}: {
  student: any | null;
  user: any;
  onClose: () => void;
  onSaved: (updated: any) => void;
}) {
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name || '',
        fatherName: student.fatherName || '',
        cnic: student.cnic || '',
        dob: student.dob || '',
        address: student.address || '',
        prevResult: student.prevResult || '',
        program: student.program || '',
        guardian: student.guardian || '',
        section: student.section || 'A',
      });
    }
  }, [student]);

  if (!student) return null;
  const locked = isLocked(student);
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim())
      return toast({ title: 'Name is required', variant: 'destructive' });
    setSaving(true);
    const body: any = {
      name: form.name.trim(),
      // admissions fields (a later backend task persists these via the same PATCH)
      fatherName: form.fatherName.trim(),
      cnic: form.cnic.trim(),
      dob: form.dob || null,
      address: form.address.trim(),
      prevResult: form.prevResult.trim(),
      program: form.program,
      guardian: form.guardian.trim(),
      section: form.section,
    };
    try {
      await api.editUser(student.id, body);
      toast({ title: 'Student updated', description: form.name });
    } catch (e: any) {
      toast({
        title: 'Saved in this session',
        description: (e?.message || 'Backend sync failed') + ' — changes are visible locally.',
      });
    } finally {
      setSaving(false);
      onSaved({ ...student, ...body });
    }
  };

  return (
    <Sheet open={!!student} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-white">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold text-gray-900">
            Edit Student
          </SheetTitle>
          <SheetDescription className="text-sm text-gray-500">
            Update personal information. Base fee is managed separately in Base Fee
            Finalization.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-4">
          {locked && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Base fee is locked at{' '}
              <strong className="mx-1">{fmtMoney(Number(student.baseFee))}</strong> — not
              editable here.
            </div>
          )}
          <Field label="Student Name" required>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Father's Name">
            <Input
              value={form.fatherName}
              onChange={(e) => set('fatherName', e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CNIC / B-Form">
              <Input
                value={form.cnic}
                onChange={(e) => set('cnic', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Date of Birth">
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => set('dob', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Program">
            <Select value={form.program} onValueChange={(v) => set('program', v)}>
              <SelectTrigger className={`${inputCls} w-full`}>
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {PROGRAMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Section">
              <Input
                value={form.section}
                onChange={(e) => set('section', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Guardian">
              <Input
                value={form.guardian}
                onChange={(e) => set('guardian', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Previous Result">
            <Input
              value={form.prevResult}
              onChange={(e) => set('prevResult', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Address">
            <Textarea
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              rows={2}
              className="rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/12"
            />
          </Field>
        </div>

        <SheetFooter>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-4 text-sm font-medium flex-1"
              onClick={save}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// 4. Fee Records — unified table of all students + their base fee status.
//    The actual fee LOCKING happens during New Enrollment. This page is a
//    read-oriented registry: it shows every enrolled student with their
//    class, program, base fee amount, and locked/pending status. Pending
//    students can still be locked inline (for cases where it was skipped
//    during enrollment).
// ---------------------------------------------------------------------------

// CSV export — emits a fee-records-{YYYY-MM-DD}.csv download from the
// in-memory filtered list. No backend round-trip.
function exportFeeCsv(students: any[]) {
  const headers = [
    'RollNo',
    'Name',
    'FatherName',
    'Class',
    'Section',
    'Program',
    'BaseFee',
    'Status',
  ];
  const escapeCell = (v: string) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = students.map((s) =>
    [
      s.rollNo || '',
      s.name || '',
      s.fatherName || '',
      s.class || '',
      s.section || '',
      s.program || '',
      isLocked(s) ? String(s.baseFee ?? 0) : '',
      isLocked(s) ? 'Locked' : 'Pending',
    ]
      .map(escapeCell)
      .join(','),
  );
  const csv = [headers.map(escapeCell).join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fee-records-${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Per-student fee detail sheet — shown when clicking the "View" button on a
// LOCKED row. Surfaces the locked base fee amount + locked date + the
// Admission-Office-set-it note. Pending rows disable the View button.
function StudentFeeDetailSheet({
  student,
  onClose,
}: {
  student: any | null;
  onClose: () => void;
}) {
  const formatDate = (d: any) => {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return '—';
      return dt.toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const lockedDate = formatDate(
    student?.updated_at || student?.updatedAt || student?.createdAt,
  );

  return (
    <Sheet open={!!student} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto bg-white"
      >
        <SheetHeader>
          <SheetTitle className="text-base font-semibold text-gray-900">
            Fee Detail
          </SheetTitle>
          <SheetDescription className="text-sm text-gray-500">
            Base fee record for this student.
          </SheetDescription>
        </SheetHeader>

        {student && (
          <div className="px-4 pb-4 space-y-5">
            {/* Header: photo + name + roll + class · section · program */}
            <div className="flex items-center gap-4">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="h-16 w-16 rounded-full border border-gray-200 object-cover shrink-0"
                />
              ) : (
                <div className="h-16 w-16 rounded-full border border-gray-200 bg-gray-50 grid place-items-center shrink-0">
                  <GraduationCap className="h-7 w-7 text-gray-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-base font-semibold text-gray-900 truncate">
                  {student.name}
                </p>
                <p className="text-xs font-mono text-gray-500">
                  {student.rollNo || '—'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {student.class || '—'}
                  {student.section ? ` · ${student.section}` : ''} ·{' '}
                  {student.program || '—'}
                </p>
              </div>
            </div>

            {/* Personal info */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
              <Row label="Father's Name" value={student.fatherName || '—'} />
              <Row label="CNIC / B-Form" value={student.cnic || '—'} mono />
              <Row label="Date of Birth" value={formatDate(student.dob)} />
            </div>

            {/* Base fee amount (big) */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Base Fee
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {fmtMoney(Number(student.baseFee))}
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                <StatusBadge student={student} />
                <span className="text-xs text-gray-500">
                  · Locked on {lockedDate}
                </span>
              </div>
            </div>

            {/* Admission-office note */}
            <div className="rounded-lg border border-gray-200 bg-white p-3 flex gap-2.5">
              <Info className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 leading-relaxed">
                Set by Admission Office · Accountant may split into installments
                but cannot change the base amount.
              </p>
            </div>
          </div>
        )}

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

// Bulk lock by program sheet — pick a program + an amount, preview the
// pending students in that program, then lock them sequentially with
// progress feedback. Continues past individual failures.
function BulkLockSheet({
  open,
  onOpenChange,
  students,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  students: any[];
  onDone: () => void;
}) {
  const programs = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.program) set.add(s.program);
    });
    return Array.from(set).sort();
  }, [students]);

  const [program, setProgram] = useState('');
  const [amount, setAmount] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });

  // Default-select the first program when none has been chosen yet. Derived
  // (no setState-in-effect) so it stays in sync as the students list changes.
  const effectiveProgram = program || (programs.length > 0 ? programs[0] : '');

  // Reset transient fields when the sheet closes — done in onOpenChange so we
  // don't trigger synchronous setState in an effect.
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setAmount('');
      setProgress({ done: 0, total: 0 });
      if (running) return; // don't allow close while a bulk run is in flight
    }
    onOpenChange(nextOpen);
  };

  const pendingInProgram = useMemo(() => {
    if (!effectiveProgram) return [];
    return students.filter(
      (s) => s.program === effectiveProgram && !isLocked(s),
    );
  }, [students, effectiveProgram]);

  const amt = Number(amount);
  const amountValid = !!amount && !isNaN(amt) && amt > 0;

  const runLock = async () => {
    if (!amountValid || pendingInProgram.length === 0) return;
    setRunning(true);
    const failed: string[] = [];
    const total = pendingInProgram.length;
    let done = 0;
    setProgress({ done: 0, total });
    for (const s of pendingInProgram) {
      try {
        await api.editUser(s.id, { baseFee: amt, baseFeeLocked: true });
      } catch {
        failed.push(s.name || s.rollNo || s.id);
      }
      done += 1;
      setProgress({ done, total });
    }
    setRunning(false);
    const succeeded = total - failed.length;
    if (failed.length === 0) {
      toast({
        title: `Locked ${total} student${total === 1 ? '' : 's'}`,
        description: `${effectiveProgram} · ${fmtMoney(amt)} each`,
      });
    } else {
      toast({
        title: `Locked ${succeeded} of ${total}`,
        description: `Failed: ${failed.join(', ')}`,
        variant: 'destructive',
      });
    }
    onDone();
    handleOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto bg-white"
      >
        <SheetHeader>
          <SheetTitle className="text-base font-semibold text-gray-900">
            Bulk Lock by Program
          </SheetTitle>
          <SheetDescription className="text-sm text-gray-500">
            Lock the same base fee for every pending student in a program.
            This cannot be undone.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-4">
          <Field label="Program" required>
            <Select value={effectiveProgram} onValueChange={setProgram}>
              <SelectTrigger className={`${inputCls} w-full`}>
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {programs.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    No programs available
                  </SelectItem>
                ) : (
                  programs.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Base Fee (PKR)" required>
            <div className="relative">
              <DollarSign className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 25000"
                className={`${inputCls} pl-9`}
                disabled={running}
              />
            </div>
          </Field>

          {/* Preview list */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Pending students {effectiveProgram ? `in ${effectiveProgram}` : ''} (
              {pendingInProgram.length})
            </p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 max-h-72 overflow-y-auto">
              {pendingInProgram.length === 0 ? (
                <div className="p-5 text-center">
                  <CheckCircle2 className="h-5 w-5 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">
                    {effectiveProgram
                      ? `All students in ${effectiveProgram} are already locked.`
                      : 'Select a program to see pending students.'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {pendingInProgram.map((s) => (
                    <li
                      key={s.id}
                      className="px-3 py-2 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {s.name}
                        </p>
                        <p className="text-xs font-mono text-gray-500">
                          {s.rollNo || '—'}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-transparent gap-1 shrink-0"
                      >
                        <Clock className="h-3 w-3" /> Pending
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Progress */}
          {running && (
            <div className="rounded-lg border border-gray-200 bg-white p-3 flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-[#F26522]" />
              <p className="text-sm text-gray-700">
                Locking {progress.done} of {progress.total}…
              </p>
            </div>
          )}
        </div>

        <SheetFooter>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium flex-1"
              onClick={() => handleOpenChange(false)}
              disabled={running}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-4 text-sm font-medium flex-1 disabled:opacity-60"
              onClick={runLock}
              disabled={running || !amountValid || pendingInProgram.length === 0}
            >
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Locking…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-1.5" />
                  Lock {pendingInProgram.length} Student
                  {pendingInProgram.length === 1 ? '' : 's'}
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function BaseFeeView({
  students,
  loading,
  onRefresh,
  onLocalUpsert,
}: {
  students: any[];
  loading: boolean;
  onRefresh: () => void;
  onLocalUpsert: (s: any) => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [detailStudent, setDetailStudent] = useState<any | null>(null);

  const locked = useMemo(() => students.filter((s) => isLocked(s)), [students]);
  const pending = useMemo(() => students.filter((s) => !isLocked(s)), [students]);
  const lockedTotal = locked.reduce((acc, s) => acc + Number(s.baseFee || 0), 0);

  const filtered = useMemo(() => {
    let list = students;
    if (statusFilter === 'locked') list = list.filter(isLocked);
    else if (statusFilter === 'pending') list = list.filter((s) => !isLocked(s));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.rollNo || '').toLowerCase().includes(q) ||
        (s.class || '').toLowerCase().includes(q) ||
        (s.program || '').toLowerCase().includes(q)
      );
    }
    // Locked first, then pending; alphabetically within each group
    return [...list].sort((a, b) => {
      const la = isLocked(a) ? 0 : 1;
      const lb = isLocked(b) ? 0 : 1;
      if (la !== lb) return la - lb;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [students, search, statusFilter]);

  const filtersActive = !!search.trim() || statusFilter !== 'all';
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Records"
        subtitle="All enrolled students and their base fee status. Fees are locked during New Enrollment."
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium"
              onClick={onRefresh}
            >
              <Loader2 className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium disabled:opacity-50"
              onClick={() => exportFeeCsv(filtered)}
              disabled={loading || filtered.length === 0}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
            <Button
              className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-4 text-sm font-medium disabled:opacity-50"
              onClick={() => setBulkOpen(true)}
              disabled={loading || students.length === 0}
            >
              <Lock className="h-4 w-4 mr-1.5" />
              Bulk Lock
            </Button>
          </div>
        }
      />

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={GraduationCap} label="Total Students" value={String(students.length)} hint="All enrolled" />
        <KpiCard icon={Lock} label="Fee Locked" value={String(locked.length)} hint="Finalized" />
        <KpiCard icon={Clock} label="Pending" value={String(pending.length)} hint="Awaiting lock" />
        <KpiCard icon={DollarSign} label="Total Locked" value={fmtMoney(lockedTotal)} hint="Sum of locked fees" />
      </div>

      {/* Search + filter bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll #, class, or program…"
              className={`${inputCls} pl-9`}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`${inputCls} w-full sm:w-44`}>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="locked">Locked only</SelectItem>
              <SelectItem value="pending">Pending only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Unified records table */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        {loading ? (
          <SkeletonTable rows={6} />
        ) : filtered.length === 0 ? (
          students.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No students enrolled yet"
              desc="Enroll students from the New Enrollment tab to see their fee records here."
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No students match your filters"
              desc="Try clearing the search or selecting 'All statuses'."
              action={
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={!filtersActive}
                  className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium disabled:opacity-50"
                >
                  Clear filters
                </Button>
              }
            />
          )
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
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Program
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                    Base Fee
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className="border-gray-100 hover:bg-gray-50">
                    <TableCell className="text-sm font-mono text-gray-700">
                      {s.rollNo || '—'}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-900">
                      {s.name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {s.class || '—'}
                      {s.section ? <span className="text-gray-400"> · {s.section}</span> : null}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {s.program || '—'}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-900 text-right">
                      {isLocked(s) ? fmtMoney(Number(s.baseFee)) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {isLocked(s) ? (
                        <StatusBadge student={s} />
                      ) : (
                        <PendingFeeRow student={s} onLock={onLocalUpsert} compact />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isLocked(s) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                          onClick={() => setDetailStudent(s)}
                          aria-label={`View fee detail for ${s.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-300 cursor-not-allowed"
                                disabled
                                aria-label="View detail disabled — finalize base fee first"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Finalize base fee first</TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <BulkLockSheet
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        students={students}
        onDone={onRefresh}
      />
      <StudentFeeDetailSheet
        student={detailStudent}
        onClose={() => setDetailStudent(null)}
      />
    </div>
  );
}

function PendingFeeRow({
  student,
  onLock,
  compact = false,
}: {
  student: any;
  onLock: (s: any) => void;
  compact?: boolean;
}) {
  const [amount, setAmount] = useState('');
  const [locking, setLocking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const amt = Number(amount);
  const amountValid = !!amount && !isNaN(amt) && amt > 0;

  // Validate first, then open the confirm dialog. The actual API call only
  // fires once the user clicks "Confirm & Lock" inside the dialog.
  const tryLock = () => {
    if (!amountValid) {
      toast({
        title: 'Enter a valid amount',
        description: 'Base fee must be a positive number.',
        variant: 'destructive',
      });
      return;
    }
    setDialogOpen(true);
  };

  const confirmLock = async (e?: React.MouseEvent) => {
    // Stop AlertDialogAction from auto-closing — we close manually after the
    // API call finishes so the spinner stays visible during the request.
    e?.preventDefault();
    if (!amountValid) return;
    setLocking(true);
    const patch = { baseFee: amt, baseFeeLocked: true };
    try {
      await api.editUser(student.id, patch);
      toast({ title: 'Base fee locked', description: `${student.name} — ${fmtMoney(amt)}` });
    } catch (err: any) {
      // Optimistic fallback — keep the change visible locally so the user
      // can move on even if the backend is temporarily unavailable.
      toast({
        title: 'Locked in this session',
        description:
          (err?.message || 'Backend sync failed') +
          ' — visible here, will persist once the API is wired.',
      });
    } finally {
      setLocking(false);
      setDialogOpen(false);
      onLock({ ...student, ...patch });
    }
  };

  // Shared AlertDialog body — used for both compact + full modes.
  const confirmDialog = (
    <AlertDialog
      open={dialogOpen}
      onOpenChange={(o) => {
        if (!locking) setDialogOpen(o);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Lock base fee for {student.name}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Student</span>
                <span className="font-medium text-gray-900">{student.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Roll #</span>
                <span className="font-mono text-xs text-gray-900">
                  {student.rollNo || '—'}
                </span>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Base fee to lock
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {fmtMoney(amt)}
                </p>
              </div>
              <p className="flex gap-1.5 text-xs text-gray-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                <span>
                  This action cannot be undone. The Accountant will see this amount
                  as the immutable base for all future invoices.
                </span>
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg"
            disabled={locking}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmLock}
            disabled={locking}
            className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg"
          >
            {locking ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Locking…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-1.5" />
                Confirm & Lock
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Compact mode: inline badge + small lock input for table rows
  if (compact) {
    return (
      <>
        <div className="inline-flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-transparent gap-1"
          >
            <Clock className="h-3 w-3" /> Pending
          </Badge>
          <div className="relative">
            <DollarSign className="h-3 w-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="h-7 w-24 rounded-md border border-gray-200 bg-white text-xs pl-6 pr-1 text-gray-900 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522]/12"
            />
          </div>
          <button
            onClick={tryLock}
            disabled={locking}
            className="h-7 px-2 rounded-md bg-[#F26522] hover:bg-[#D4541E] text-white text-[11px] font-medium inline-flex items-center gap-1 disabled:opacity-60"
          >
            {locking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lock className="h-3 w-3" />}
            Lock
          </button>
        </div>
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-gray-300 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-9 w-9 rounded-lg border border-gray-200 bg-gray-50 grid place-items-center shrink-0">
            <GraduationCap className="h-4 w-4 text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {student.rollNo} · {student.class || '—'}{' '}
              {student.section ? `· ${student.section}` : ''} ·{' '}
              {student.program || 'No program'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <DollarSign className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className={`${inputCls} pl-9 w-36`}
            />
          </div>
          <Button
            className="bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-10 px-4 text-sm font-medium"
            onClick={tryLock}
            disabled={locking}
          >
            {locking ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Lock className="h-4 w-4 mr-1.5" />
            )}
            Lock
          </Button>
        </div>
      </div>
      {confirmDialog}
    </>
  );
}
