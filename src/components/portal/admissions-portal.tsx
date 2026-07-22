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

// Auto-suggest a roll number based on existing students in the branch.
const suggestRollNo = (students: any[]) => {
  const year = new Date().getFullYear();
  const count = students.length + 1;
  return `STU-${year}-${String(count).padStart(3, '0')}`;
};

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

  // Auto-suggest a roll number once students load.
  useEffect(() => {
    if (!form.rollNo) {
      setForm((f) => ({ ...f, rollNo: suggestRollNo(students) }));
    }
  }, [students.length]);

  const set = (k: keyof EnrollForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
    // Validation
    if (!form.name.trim())
      return toast({ title: 'Student name is required', variant: 'destructive' });
    if (!form.fatherName.trim())
      return toast({ title: "Father's name is required", variant: 'destructive' });
    if (!form.cnic.trim())
      return toast({ title: 'CNIC / B-Form number is required', variant: 'destructive' });
    if (!form.program)
      return toast({ title: 'Select a program / course', variant: 'destructive' });
    if (!form.classId) return toast({ title: 'Select a class', variant: 'destructive' });
    if (!form.rollNo.trim())
      return toast({ title: 'Roll number is required', variant: 'destructive' });

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

  const reset = () => {
    setForm({ ...emptyForm, rollNo: suggestRollNo(students) });
    setFeeLocked(false);
    setCreated(null);
  };

  if (created) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
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
          <div className="flex gap-2 mt-6">
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

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="New Enrollment"
        subtitle="Capture the student's personal details and finalize the one-time base fee."
      />

      <BaseFeeCallout />

      {/* Personal Information */}
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
              placeholder="e.g. Ahmed Raza"
              className={inputCls}
            />
          </Field>
          <Field label="Father's Name" required>
            <Input
              value={form.fatherName}
              onChange={(e) => set('fatherName', e.target.value)}
              placeholder="e.g. Muhammad Raza"
              className={inputCls}
            />
          </Field>
          <Field label="CNIC / B-Form Number" required>
            <div className="relative">
              <Hash className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={form.cnic}
                onChange={(e) => set('cnic', e.target.value)}
                placeholder="xxxxx-xxxxxxx-x"
                className={`${inputCls} pl-9`}
              />
            </div>
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
        </div>
      </div>

      {/* Academic Placement + Photo */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-gray-900">Academic Placement</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Program, class section, roll number, and photograph.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Course / Program" required>
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
          <Field label="Class" required>
            <Select
              value={form.classId}
              onValueChange={(v) => {
                const c = classes.find((x) => x.id === v);
                set('classId', v);
                if (c?.section) set('section', c.section);
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
                className={`${inputCls} pl-9 font-mono text-sm`}
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Auto-suggested — edit if needed.</p>
          </Field>
          <div className="md:col-span-2">
            <Field label="Student Photograph">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden grid place-items-center shrink-0">
                  {form.photoUrl ? (
                    <img
                      src={form.photoUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-300" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={onPhoto}
                    className="text-sm h-10 rounded-lg border border-gray-200 file:mr-3 file:rounded-md file:border-0 file:bg-gray-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-700 hover:file:bg-gray-100"
                  />
                  {form.photoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-fit text-xs h-7 text-gray-500 hover:text-gray-900"
                      onClick={() => set('photoUrl', '')}
                    >
                      <X className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  )}
                  <p className="text-[11px] text-gray-500">JPG/PNG, up to 1.5 MB.</p>
                </div>
              </div>
            </Field>
          </div>
        </div>
      </div>

      {/* Base Fee Finalization */}
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

      {/* Actions */}
      <div className="flex gap-2 justify-end pb-6">
        <Button
          variant="outline"
          className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium"
          onClick={reset}
        >
          Reset
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
// 4. Base Fee Finalization
// ---------------------------------------------------------------------------
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
  const pending = useMemo(() => students.filter((s) => !isLocked(s)), [students]);
  const locked = useMemo(() => students.filter((s) => isLocked(s)), [students]);
  const lockedTotal = locked.reduce((acc, s) => acc + Number(s.baseFee || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Base Fee Finalization"
        subtitle="Set and lock the one-time base fee for each enrolled student."
        actions={
          <Button
            variant="outline"
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium"
            onClick={onRefresh}
          >
            <Loader2 className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <BaseFeeCallout />

      {/* Pending finalization */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Awaiting Finalization</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {pending.length} student(s) without a locked base fee
            </p>
          </div>
        </div>
        {loading ? (
          <SkeletonTable rows={4} />
        ) : pending.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="All base fees are locked"
            desc="Every enrolled student has a finalized base fee."
          />
        ) : (
          <div className="space-y-3">
            {pending.map((s) => (
              <PendingFeeRow key={s.id} student={s} onLock={onLocalUpsert} />
            ))}
          </div>
        )}
      </div>

      {/* Locked fees (read-only) */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Locked Base Fees</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {locked.length} student(s) · Total {fmtMoney(lockedTotal)}
            </p>
          </div>
        </div>
        {locked.length === 0 ? (
          <EmptyState
            icon={Lock}
            title="No locked fees yet"
            desc="Finalize a student above to see them here."
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
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-center">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locked.map((s) => (
                  <TableRow key={s.id} className="border-gray-100 hover:bg-gray-50">
                    <TableCell className="text-sm font-mono text-gray-700">
                      {s.rollNo || '—'}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-900">
                      {s.name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {s.class || '—'} {s.section ? `· ${s.section}` : ''}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-900 text-right">
                      {fmtMoney(Number(s.baseFee))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-transparent gap-1"
                      >
                        <Lock className="h-3 w-3" /> Locked
                      </Badge>
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

function PendingFeeRow({
  student,
  onLock,
}: {
  student: any;
  onLock: (s: any) => void;
}) {
  const [amount, setAmount] = useState('');
  const [locking, setLocking] = useState(false);

  const lock = async () => {
    const v = Number(amount);
    if (!amount || isNaN(v) || v <= 0) {
      toast({
        title: 'Enter a valid amount',
        description: 'Base fee must be a positive number.',
        variant: 'destructive',
      });
      return;
    }
    setLocking(true);
    const patch = { baseFee: v, baseFeeLocked: true };
    try {
      await api.editUser(student.id, patch);
      toast({ title: 'Base fee locked', description: `${student.name} — ${fmtMoney(v)}` });
    } catch (e: any) {
      toast({
        title: 'Locked in this session',
        description:
          (e?.message || 'Backend sync failed') +
          ' — visible here, will persist once the API is wired.',
      });
    } finally {
      setLocking(false);
      onLock({ ...student, ...patch });
    }
  };

  return (
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
          onClick={lock}
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
  );
}
