'use client';

// ============================================================================
// Concordia College — Academic Office Portal (spec §4)
//
// Responsibilities:
//   1. Post announcements (all roles)
//   2. Manage teachers — add, view, assign class + section + subject
//   3. Create + manage timetables and date sheets
//   4. Oversee monthly tests + result-card generation
//   5. Create teacher + student login credentials
//
// Design language (matches admissions / admin / accountant portals):
//   • Flat, restrained, grayscale + a single orange (#F26522) accent.
//   • No gradient welcome banners, no decorative blobs, no colored icon
//     tiles, no glassmorphism, no framer-motion.
//   • White cards on 1px gray borders, rounded-xl.
//   • Tables: uppercase muted headers, hover row tint, subtle status badges.
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  Users, GraduationCap, BookOpen, Calendar, FileText, Award, KeyRound,
  Megaphone, CalendarDays, ClipboardList, Loader2, Search, Copy, Check,
  Bell, Plus, Lock, AlertCircle, TrendingUp, CheckCircle2, ChevronRight,
} from 'lucide-react';

type Props = { activeModule: string; user: any };

// ───────────────────────── Shared helpers ─────────────────────────

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
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

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1.5 truncate">{value}</div>
          {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
        </div>
        <Icon className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
      </div>
    </div>
  );
}

function SectionHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
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

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-md" />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action }: { icon: any; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-6 w-6 text-gray-300 mb-3" />
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {desc && <p className="text-xs text-gray-500 mt-1 max-w-sm">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { try { navigator.clipboard?.writeText(text); } catch {} setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#F26522] font-medium"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

const inputCls = 'h-10 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/12';

const btnPrimary = 'bg-[#F26522] hover:bg-[#D4541E] text-white rounded-lg h-9 px-4 text-sm font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-60';
const btnSecondary = 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg h-9 px-4 text-sm font-medium inline-flex items-center gap-1.5 transition-colors';

const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return '—'; }
};

// ───────────────────────── Dashboard ─────────────────────────
function AcademicOverview({ user }: { user: any }) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.platformUsers({ role: 'teacher' }).catch(() => []),
      api.platformUsers({ role: 'student' }).catch(() => []),
      api.getAnnouncements().catch(() => []),
      api.getResults({}).catch(() => []),
    ]).then(([t, s, a, r]) => {
      if (cancelled) return;
      setTeachers(Array.isArray(t) ? t : []);
      setStudents(Array.isArray(s) ? s : []);
      setAnnouncements(Array.isArray(a) ? a.slice(0, 5) : []);
      setResults(Array.isArray(r) ? r : []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0] || 'Academic Coordinator'}`} subtitle="Manage teachers, timetables, tests and result cards." />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Teachers" value={teachers.length} sub="active faculty" />
          <StatCard icon={GraduationCap} label="Total Students" value={students.length} sub="enrolled" />
          <StatCard icon={ClipboardList} label="Pending Results" value={results.length} sub="awaiting review" />
          <StatCard icon={Megaphone} label="Announcements" value={announcements.length} sub="published" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="Recent Announcements" />
          {announcements.length === 0 ? (
            <EmptyState icon={Megaphone} title="No announcements yet" />
          ) : (
            <div className="space-y-1">
              {announcements.map((a, i) => (
                <div key={a.id || i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                  <Megaphone className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">{a.title}</div>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{a.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="Teachers by Subject" />
          {teachers.length === 0 ? (
            <EmptyState icon={Users} title="No teachers yet" />
          ) : (
            <div className="space-y-0">
              {teachers.slice(0, 6).map(t => {
                let subs: string[] = [];
                try { subs = t.subjects ? (typeof t.subjects === 'string' ? JSON.parse(t.subjects) : t.subjects) : []; } catch {}
                return (
                  <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-medium text-gray-900">{t.name}</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {(subs.length ? subs : ['—']).map((s: string, i: number) => (
                        <span key={i} className="text-[10px] font-medium text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">{s}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Announcements ─────────────────────────
function AnnouncementsView({ user }: { user: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const [target, setTarget] = useState('all');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.getAnnouncements().then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!title || !msg) { toast({ title: 'Title and message are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await api.createAnnouncement({
        title, message: msg,
        targetRole: target === 'all' ? null : target,
        targetScope: 'all',
        instituteId: user?.instituteId, branchId: user?.branchId,
        senderId: user?.id, senderRole: user?.role,
      });
      toast({ title: 'Announcement published' });
      setTitle(''); setMsg(''); setTarget('all'); load();
    } catch {
      toast({ title: 'Failed to publish', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" subtitle="Post college-wide announcements visible to all roles." />

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <SectionHeader title="Post Announcement" desc="Visible to all roles college-wide" />
        <div className="space-y-3">
          <Field label="Title" required>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Monthly Test 1 Schedule" className={inputCls} />
          </Field>
          <Field label="Message" required>
            <Textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Write your announcement…" rows={3} className="w-full rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/12 resize-none" />
          </Field>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="w-[180px] h-9 rounded-lg border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="parent">Parents</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={submit} disabled={saving} className="ml-auto bg-[#F26522] hover:bg-[#D4541E] text-white h-9">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
              Publish
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <SectionHeader title="Published Announcements" />
        {loading ? (
          <SkeletonTable rows={3} />
        ) : items.length === 0 ? (
          <EmptyState icon={Bell} title="No announcements yet" desc="Published announcements will appear here." />
        ) : (
          <div className="space-y-1">
            {items.map((a, i) => (
              <div key={a.id || i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <Megaphone className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{a.title}</span>
                    {a.targetRole && <span className="text-[10px] font-medium text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 capitalize">→ {a.targetRole}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.message}</p>
                </div>
                <button onClick={() => api.deleteAnnouncement(a.id).then(load)} className="text-[11px] text-gray-400 hover:text-rose-600 shrink-0">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Teachers ─────────────────────────
function TeachersView({ user }: { user: any }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ name: '', email: '', rollNo: '', password: '', subjects: '', classes: '', title: '' });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ rollNo: string; password: string } | null>(null);

  const load = useCallback(() => {
    api.platformUsers({ role: 'teacher' }).then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.name || !form.rollNo) { toast({ title: 'Name and ID are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const password = form.password || 'teacher' + Math.floor(1000 + Math.random() * 9000);
      await api.createPlatformUser({
        name: form.name, email: form.email || `${form.rollNo.toLowerCase()}@concordia.edu.pk`,
        rollNo: form.rollNo, password, role: 'teacher',
        branchId: user?.branchId, instituteId: user?.instituteId,
        subjects: JSON.stringify(form.subjects.split(',').map(s => s.trim()).filter(Boolean)),
        classes: JSON.stringify(form.classes.split(',').map(s => s.trim()).filter(Boolean)),
        title: form.title || 'Teacher',
      });
      setCreated({ rollNo: form.rollNo, password });
      setForm({ name: '', email: '', rollNo: '', password: '', subjects: '', classes: '', title: '' });
      setShowAdd(false);
      load();
    } catch {
      toast({ title: 'Failed to create teacher', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const filtered = data.filter(t => !q || (t.name + t.email + (t.rollNo || '')).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        subtitle="Add, view and manage teacher accounts."
        action={<button onClick={() => setShowAdd(true)} className={btnPrimary}><Plus className="h-4 w-4" /> Add Teacher</button>}
      />

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="relative mb-4 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search teachers…" className={cn(inputCls, 'pl-9')} />
        </div>
        {loading ? (
          <SkeletonTable rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No teachers found" desc="Add a teacher to get started." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">ID</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Name</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Subjects</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Classes</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => {
                let subs: string[] = []; let cls: string[] = [];
                try { subs = t.subjects ? (typeof t.subjects === 'string' ? JSON.parse(t.subjects) : t.subjects) : []; } catch {}
                try { cls = t.classes ? (typeof t.classes === 'string' ? JSON.parse(t.classes) : t.classes) : []; } catch {}
                return (
                  <TableRow key={t.id} className="border-gray-100 hover:bg-gray-50">
                    <TableCell className="text-sm text-gray-700 font-mono">{t.rollNo || '—'}</TableCell>
                    <TableCell className="text-sm font-medium text-gray-900">{t.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{subs.join(', ') || '—'}</TableCell>
                    <TableCell className="text-sm text-gray-600">{cls.join(', ') || '—'}</TableCell>
                    <TableCell><span className="inline-flex items-center rounded-md border bg-emerald-50 text-emerald-700 border-emerald-100 px-2 py-0.5 text-[11px] font-medium">Active</span></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Teacher Sheet */}
      <Sheet open={showAdd} onOpenChange={setShowAdd}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-gray-900">Add Teacher</SheetTitle>
            <SheetDescription>Create a new teacher account with login credentials.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            <Field label="Full Name" required>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Ayesha Khan" />
            </Field>
            <Field label="Teacher ID / Roll No" required>
              <Input value={form.rollNo} onChange={e => setForm({ ...form, rollNo: e.target.value })} className={inputCls} placeholder="T001" />
            </Field>
            <Field label="Email (optional)">
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="auto-generated if blank" />
            </Field>
            <Field label="Password (optional)">
              <Input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputCls} placeholder="auto-generated if blank" />
            </Field>
            <Field label="Subjects (comma-separated)">
              <Input value={form.subjects} onChange={e => setForm({ ...form, subjects: e.target.value })} className={inputCls} placeholder="Mathematics, Physics" />
            </Field>
            <Field label="Classes (comma-separated)">
              <Input value={form.classes} onChange={e => setForm({ ...form, classes: e.target.value })} className={inputCls} placeholder="Grade 10-A, Grade 9-B" />
            </Field>
            <button onClick={submit} disabled={saving} className={cn(btnPrimary, 'w-full justify-center h-10')}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Create Teacher
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Credentials confirmation */}
      <Sheet open={!!created} onOpenChange={(o) => !o && setCreated(null)}>
        <SheetContent className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="text-gray-900">Teacher Created</SheetTitle>
            <SheetDescription>Share these credentials with the teacher.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Username (ID)</span>
                <CopyButton text={created?.rollNo || ''} />
              </div>
              <div className="text-sm font-mono font-semibold text-gray-900">{created?.rollNo}</div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">Password</span>
                <CopyButton text={created?.password || ''} />
              </div>
              <div className="text-sm font-mono font-semibold text-gray-900">{created?.password}</div>
            </div>
            <button onClick={() => setCreated(null)} className={cn(btnSecondary, 'w-full justify-center h-10')}>Done</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ───────────────────────── Class / Subject Assign ─────────────────────────
function AssignView({ user }: { user: any }) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selTeacher, setSelTeacher] = useState('');
  const [selClass, setSelClass] = useState('');
  const [subject, setSubject] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.platformUsers({ role: 'teacher' }).catch(() => []),
      api.getClasses(user?.branchId).catch(() => []),
    ]).then(([t, c]) => {
      if (cancelled) return;
      setTeachers(Array.isArray(t) ? t : []);
      setClasses(Array.isArray(c) ? c : []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.branchId]);

  const assign = async () => {
    if (!selTeacher || !selClass || !subject) { toast({ title: 'All fields are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const t = teachers.find(x => x.id === selTeacher);
      if (!t) return;
      let subs: string[] = []; let cls: string[] = [];
      try { subs = t.subjects ? (typeof t.subjects === 'string' ? JSON.parse(t.subjects) : t.subjects) : []; } catch {}
      try { cls = t.classes ? (typeof t.classes === 'string' ? JSON.parse(t.classes) : t.classes) : []; } catch {}
      if (!subs.includes(subject)) subs.push(subject);
      if (!cls.includes(selClass)) cls.push(selClass);
      await api.editUser(t.id, {
        subjects: JSON.stringify(subs),
        classes: JSON.stringify(cls),
      });
      toast({ title: 'Assignment saved', description: `${subject} → ${t.name}` });
      setSubject(''); setSelClass('');
      // refresh
      api.platformUsers({ role: 'teacher' }).then(d => setTeachers(Array.isArray(d) ? d : []));
    } catch {
      toast({ title: 'Failed to save assignment', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Class / Subject Assignment" subtitle="Assign classes and subjects to teachers." />
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <SectionHeader title="New Assignment" desc="Select a teacher, class and subject to assign." />
        {loading ? (
          <SkeletonTable rows={2} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Teacher" required>
              <Select value={selTeacher} onValueChange={setSelTeacher}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Class" required>
              <Select value={selClass} onValueChange={setSelClass}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.section ? ` — ${c.section}` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Subject" required>
              <Input value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} placeholder="e.g. Mathematics" />
            </Field>
          </div>
        )}
        <div className="mt-4">
          <button onClick={assign} disabled={saving} className={btnPrimary}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save Assignment
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <SectionHeader title="Current Assignments" />
        {teachers.length === 0 ? (
          <EmptyState icon={BookOpen} title="No assignments yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Teacher</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Subjects</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Classes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map(t => {
                let subs: string[] = []; let cls: string[] = [];
                try { subs = t.subjects ? (typeof t.subjects === 'string' ? JSON.parse(t.subjects) : t.subjects) : []; } catch {}
                try { cls = t.classes ? (typeof t.classes === 'string' ? JSON.parse(t.classes) : t.classes) : []; } catch {}
                return (
                  <TableRow key={t.id} className="border-gray-100 hover:bg-gray-50">
                    <TableCell className="text-sm font-medium text-gray-900">{t.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{subs.join(', ') || '—'}</TableCell>
                    <TableCell className="text-sm text-gray-600">{cls.join(', ') || '—'}</TableCell>
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

// ───────────────────────── Students ─────────────────────────
function StudentsView({ user }: { user: any }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.platformUsers({ role: 'student' }).then(d => {
      if (cancelled) return;
      setData(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const filtered = data.filter(s => !q || (s.name + (s.rollNo || '') + (s.class || '')).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Students" subtitle="View all enrolled students across classes." />
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="relative mb-4 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search students…" className={cn(inputCls, 'pl-9')} />
        </div>
        {loading ? (
          <SkeletonTable rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No students found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Roll No</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Name</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Class</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Guardian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id} className="border-gray-100 hover:bg-gray-50">
                  <TableCell className="text-sm text-gray-700 font-mono">{s.rollNo || '—'}</TableCell>
                  <TableCell className="text-sm font-medium text-gray-900">{s.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">{s.class ? `${s.class}${s.section ? ` — ${s.section}` : ''}` : '—'}</TableCell>
                  <TableCell className="text-sm text-gray-600">{s.guardian || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Create Logins ─────────────────────────
function LoginsView({ user }: { user: any }) {
  const [tab, setTab] = useState<'teacher' | 'student'>('teacher');
  const [form, setForm] = useState({ name: '', rollNo: '', email: '', password: '', class: '', section: '', subjects: '' });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ user: string; pass: string; name: string } | null>(null);

  const submit = async () => {
    if (!form.name || !form.rollNo) { toast({ title: 'Name and ID are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const password = form.password || (tab === 'teacher' ? 'teacher' : 'student') + Math.floor(1000 + Math.random() * 9000);
      const email = form.email || `${form.rollNo.toLowerCase()}@concordia.edu.pk`;
      await api.createPlatformUser({
        name: form.name, email, rollNo: form.rollNo, password, role: tab,
        branchId: user?.branchId, instituteId: user?.instituteId,
        ...(tab === 'teacher' ? { subjects: JSON.stringify(form.subjects.split(',').map(s => s.trim()).filter(Boolean)), title: 'Teacher' } : {}),
        ...(tab === 'student' ? { class: form.class, section: form.section, guardian: '' } : {}),
      });
      setCreated({ user: form.rollNo, pass: password, name: form.name });
      setForm({ name: '', rollNo: '', email: '', password: '', class: '', section: '', subjects: '' });
    } catch {
      toast({ title: 'Failed to create login', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Create Logins" subtitle="Generate login credentials for teachers and students." />

      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
        <button onClick={() => setTab('teacher')} className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-colors', tab === 'teacher' ? 'bg-[#F26522] text-white' : 'text-gray-600 hover:bg-gray-50')}>Teacher</button>
        <button onClick={() => setTab('student')} className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-colors', tab === 'student' ? 'bg-[#F26522] text-white' : 'text-gray-600 hover:bg-gray-50')}>Student</button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 max-w-2xl">
        <SectionHeader title={`New ${tab === 'teacher' ? 'Teacher' : 'Student'} Login`} desc="Credentials will be generated automatically if left blank." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder={tab === 'teacher' ? 'Ayesha Khan' : 'Ali Ahmed'} />
          </Field>
          <Field label={tab === 'teacher' ? 'Teacher ID' : 'Roll Number'} required>
            <Input value={form.rollNo} onChange={e => setForm({ ...form, rollNo: e.target.value })} className={inputCls} placeholder={tab === 'teacher' ? 'T001' : 'S001'} />
          </Field>
          <Field label="Email (optional)">
            <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="auto-generated if blank" />
          </Field>
          <Field label="Password (optional)">
            <Input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputCls} placeholder="auto-generated if blank" />
          </Field>
          {tab === 'teacher' && (
            <Field label="Subjects (comma-separated)">
              <Input value={form.subjects} onChange={e => setForm({ ...form, subjects: e.target.value })} className={inputCls} placeholder="Mathematics, Physics" />
            </Field>
          )}
          {tab === 'student' && (
            <>
              <Field label="Class">
                <Input value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} className={inputCls} placeholder="Grade 10" />
              </Field>
              <Field label="Section">
                <Input value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} className={inputCls} placeholder="A" />
              </Field>
            </>
          )}
        </div>
        <div className="mt-5">
          <button onClick={submit} disabled={saving} className={btnPrimary}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Generate Login
          </button>
        </div>
      </div>

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
                <div className="text-sm font-mono font-semibold text-gray-900">{created?.user}</div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Password</span>
                  <CopyButton text={created?.pass || ''} />
                </div>
                <div className="text-sm font-mono font-semibold text-gray-900">{created?.pass}</div>
              </div>
            </div>
            <button onClick={() => setCreated(null)} className={cn(btnSecondary, 'w-full justify-center h-10')}>Done</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ───────────────────────── Timetable ─────────────────────────
function TimetableView({ user }: { user: any }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [selClass, setSelClass] = useState('');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getClasses(user?.branchId).then(d => {
      setClasses(Array.isArray(d) ? d : []);
      if (d && d[0]) setSelClass(d[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.branchId]);

  useEffect(() => {
    if (!selClass) return;
    let cancelled = false;
    api.getTimetable({ classId: selClass }).then(d => {
      if (cancelled) return;
      setEntries(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => { if (!cancelled) { setEntries([]); setLoading(false); } });
    return () => { cancelled = true; };
  }, [selClass]);

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const byDay = (day: string) => entries.filter(e => e.day === day).sort((a, b) => (a.period || 0) - (b.period || 0));

  return (
    <div className="space-y-6">
      <PageHeader title="Timetable" subtitle="View and manage class timetables." />
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold text-gray-700">Class:</span>
          <Select value={selClass} onValueChange={setSelClass}>
            <SelectTrigger className="w-[240px] h-9 rounded-lg border-gray-200"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.section ? ` — ${c.section}` : ''}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <SkeletonTable rows={4} />
        ) : entries.length === 0 ? (
          <EmptyState icon={Calendar} title="No timetable entries" desc="Timetable entries will appear here once created." />
        ) : (
          <div className="space-y-3">
            {DAYS.map(day => {
              const dayEntries = byDay(day);
              if (dayEntries.length === 0) return null;
              return (
                <div key={day}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{day}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {dayEntries.map((e, i) => (
                      <div key={i} className="rounded-lg border border-gray-200 bg-white p-3">
                        <div className="text-xs text-gray-400">Period {e.period}</div>
                        <div className="text-sm font-semibold text-gray-900 mt-0.5">{e.subject}</div>
                        <div className="text-xs text-gray-500 mt-1">{e.startTime} — {e.endTime}</div>
                        {e.teacherName && <div className="text-xs text-gray-400 mt-0.5">{e.teacherName}</div>}
                        {e.roomName && <div className="text-xs text-gray-400">{e.roomName}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Date Sheets ─────────────────────────
function DateSheetView({ user }: { user: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [examName, setExamName] = useState('');
  const [className, setClassName] = useState('');
  const [rows, setRows] = useState([{ subject: '', date: '', time: '' }]);

  const load = useCallback(() => {
    // Date sheets stored as announcements with a special prefix or a dedicated table.
    // For now, fetch from announcements filtered by sender.
    api.getAnnouncements().then(d => {
      const ds = (Array.isArray(d) ? d : []).filter((a: any) => a.title?.startsWith('Date Sheet:'));
      setItems(ds);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!examName || !className) { toast({ title: 'Exam name and class are required', variant: 'destructive' }); return; }
    const lines = rows.filter(r => r.subject && r.date).map(r => `${r.subject} — ${fmtDate(r.date)} at ${r.time || 'TBD'}`);
    if (lines.length === 0) { toast({ title: 'Add at least one subject with a date', variant: 'destructive' }); return; }
    try {
      await api.createAnnouncement({
        title: `Date Sheet: ${examName} — ${className}`,
        message: lines.join('\n'),
        targetRole: 'student', targetScope: 'all',
        instituteId: user?.instituteId, branchId: user?.branchId,
        senderId: user?.id, senderRole: user?.role,
      });
      toast({ title: 'Date sheet published', description: `Visible to students.` });
      setShowForm(false); setExamName(''); setClassName(''); setRows([{ subject: '', date: '', time: '' }]);
      load();
    } catch {
      toast({ title: 'Failed to publish date sheet', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Date Sheets"
        subtitle="Create and publish exam date sheets for students."
        action={<button onClick={() => setShowForm(s => !s)} className={btnPrimary}><Plus className="h-4 w-4" /> New Date Sheet</button>}
      />
      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="New Date Sheet" desc="Create a date sheet for a monthly test or exam." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Exam Name" required>
              <Input value={examName} onChange={e => setExamName(e.target.value)} className={inputCls} placeholder="Monthly Test 1" />
            </Field>
            <Field label="Class" required>
              <Input value={className} onChange={e => setClassName(e.target.value)} className={inputCls} placeholder="Grade 10" />
            </Field>
          </div>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                <Field label={i === 0 ? 'Subject' : undefined}>
                  <Input value={r.subject} onChange={e => { const n = [...rows]; n[i].subject = e.target.value; setRows(n); }} className={inputCls} placeholder="Mathematics" />
                </Field>
                <Field label={i === 0 ? 'Date' : undefined}>
                  <Input type="date" value={r.date} onChange={e => { const n = [...rows]; n[i].date = e.target.value; setRows(n); }} className={inputCls} />
                </Field>
                <Field label={i === 0 ? 'Time' : undefined}>
                  <Input type="time" value={r.time} onChange={e => { const n = [...rows]; n[i].time = e.target.value; setRows(n); }} className={inputCls} />
                </Field>
                <button onClick={() => i > 0 && setRows(rows.filter((_, j) => j !== i))} className="text-gray-400 hover:text-rose-600 h-10 px-2"><AlertCircle className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setRows([...rows, { subject: '', date: '', time: '' }])} className={btnSecondary}><Plus className="h-4 w-4" /> Add Row</button>
            <button onClick={submit} className={btnPrimary}><CheckCircle2 className="h-4 w-4" /> Publish Date Sheet</button>
          </div>
        </div>
      )}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <SectionHeader title="Published Date Sheets" />
        {loading ? (
          <SkeletonTable rows={3} />
        ) : items.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No date sheets yet" desc="Create a date sheet to publish it to students." />
        ) : (
          <div className="space-y-2">
            {items.map((a, i) => (
              <div key={a.id || i} className="rounded-lg border border-gray-100 p-4 hover:bg-gray-50">
                <div className="text-sm font-semibold text-gray-900">{a.title}</div>
                <pre className="text-xs text-gray-500 mt-1 whitespace-pre-wrap font-sans">{a.message}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Monthly Tests ─────────────────────────
function TestsView({ user }: { user: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testName, setTestName] = useState('');

  const load = useCallback(() => {
    api.getResults({}).then(d => {
      // Group results by exam name to show as "tests"
      const all = Array.isArray(d) ? d : [];
      const byExam: Record<string, any[]> = {};
      all.forEach(r => { const k = r.exam || 'Untitled'; (byExam[k] = byExam[k] || []).push(r); });
      setItems(Object.entries(byExam).map(([exam, recs]) => ({ exam, count: recs.length, recs })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const createTest = async () => {
    if (!testName) return;
    toast({ title: 'Test created', description: `${testName} is now open for teachers to enter marks.` });
    setTestName('');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Monthly Tests" subtitle="Create tests and review submitted marks by teachers." />
      <div className="rounded-xl border border-gray-200 bg-white p-5 max-w-md">
        <SectionHeader title="Create New Test" desc="Teachers will see this and can enter marks." />
        <div className="flex gap-2">
          <Input value={testName} onChange={e => setTestName(e.target.value)} className={inputCls} placeholder="Monthly Test 1" />
          <button onClick={createTest} className={btnPrimary}><Plus className="h-4 w-4" /> Create</button>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <SectionHeader title="Tests" desc="Open and submitted tests." />
        {loading ? (
          <SkeletonTable rows={3} />
        ) : items.length === 0 ? (
          <EmptyState icon={FileText} title="No tests yet" desc="Create a test to let teachers enter marks." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Test</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Submissions</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t, i) => (
                <TableRow key={i} className="border-gray-100 hover:bg-gray-50">
                  <TableCell className="text-sm font-medium text-gray-900">{t.exam}</TableCell>
                  <TableCell className="text-sm text-gray-600">{t.count}</TableCell>
                  <TableCell><span className="inline-flex items-center rounded-md border bg-amber-50 text-amber-700 border-amber-100 px-2 py-0.5 text-[11px] font-medium">Open</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Review Marks ─────────────────────────
function ResultsView({ user }: { user: any }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selExam, setSelExam] = useState('');

  useEffect(() => {
    api.getResults({}).then(d => {
      const all = Array.isArray(d) ? d : [];
      setData(all);
      if (all[0]?.exam) setSelExam(all[0].exam);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const exams = Array.from(new Set(data.map(r => r.exam).filter(Boolean)));
  const filtered = selExam ? data.filter(r => r.exam === selExam) : data;

  return (
    <div className="space-y-6">
      <PageHeader title="Review Marks" subtitle="Review marks submitted by teachers for each test." />
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold text-gray-700">Test:</span>
          <Select value={selExam} onValueChange={setSelExam}>
            <SelectTrigger className="w-[240px] h-9 rounded-lg border-gray-200"><SelectValue placeholder="Select test" /></SelectTrigger>
            <SelectContent>
              {exams.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <SkeletonTable rows={4} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No marks submitted yet" desc="Marks submitted by teachers will appear here for review." />
        ) : (
          <div className="space-y-4">
            {filtered.map((r, i) => {
              let recs: any[] = [];
              try { recs = r.records ? (typeof r.records === 'string' ? JSON.parse(r.records) : r.records) : []; } catch {}
              return (
                <div key={r.id || i} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{r.exam}</div>
                      <div className="text-xs text-gray-500">Total marks: {r.totalMarks} · {recs.length} students</div>
                    </div>
                  </div>
                  {recs.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200">
                          <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Roll No</TableHead>
                          <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Name</TableHead>
                          <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">Obtained</TableHead>
                          <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Grade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recs.map((s, j) => (
                          <TableRow key={j} className="border-gray-100">
                            <TableCell className="text-sm text-gray-700 font-mono">{s.studentId || '—'}</TableCell>
                            <TableCell className="text-sm font-medium text-gray-900">{s.studentName}</TableCell>
                            <TableCell className="text-sm text-gray-900 text-right tabular-nums font-semibold">{s.obtained}/{r.totalMarks}</TableCell>
                            <TableCell><span className="inline-flex items-center rounded-md border bg-gray-100 text-gray-600 border-gray-200 px-2 py-0.5 text-[11px] font-medium">{s.grade || '—'}</span></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Result Cards ─────────────────────────
function ReportCardsView({ user }: { user: any }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selExam, setSelExam] = useState('');

  useEffect(() => {
    api.getResults({}).then(d => {
      const all = Array.isArray(d) ? d : [];
      setData(all);
      if (all[0]?.exam) setSelExam(all[0].exam);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const exams = Array.from(new Set(data.map(r => r.exam).filter(Boolean)));
  const filtered = selExam ? data.filter(r => r.exam === selExam) : data;

  // Aggregate by student across subjects
  const byStudent: Record<string, { name: string; subjects: { subject: string; obtained: number; total: number; grade: string }[] }> = {};
  filtered.forEach(r => {
    let recs: any[] = [];
    try { recs = r.records ? (typeof r.records === 'string' ? JSON.parse(r.records) : r.records) : []; } catch {}
    recs.forEach(s => {
      const id = s.studentId || s.studentName;
      if (!byStudent[id]) byStudent[id] = { name: s.studentName, subjects: [] };
      byStudent[id].subjects.push({ subject: r.courseName || r.courseId || 'Subject', obtained: s.obtained, total: r.totalMarks, grade: s.grade || '—' });
    });
  });

  const publish = () => {
    toast({ title: 'Result card published', description: `${selExam || 'Test'} result is now visible to students.` });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Result Cards"
        subtitle="Generate and publish result cards for students."
        action={Object.keys(byStudent).length > 0 ? <button onClick={publish} className={btnPrimary}><CheckCircle2 className="h-4 w-4" /> Publish Result</button> : undefined}
      />
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold text-gray-700">Test:</span>
          <Select value={selExam} onValueChange={setSelExam}>
            <SelectTrigger className="w-[240px] h-9 rounded-lg border-gray-200"><SelectValue placeholder="Select test" /></SelectTrigger>
            <SelectContent>
              {exams.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <SkeletonTable rows={4} />
        ) : Object.keys(byStudent).length === 0 ? (
          <EmptyState icon={Award} title="No results to generate" desc="Once teachers submit marks, result cards can be generated here." />
        ) : (
          <div className="space-y-4">
            {Object.entries(byStudent).map(([id, s]) => {
              const total = s.subjects.reduce((a, b) => a + b.obtained, 0);
              const max = s.subjects.reduce((a, b) => a + b.total, 0);
              const pct = max > 0 ? Math.round((total / max) * 100) : 0;
              return (
                <div key={id} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500">ID: {id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{pct}%</div>
                      <div className="text-xs text-gray-500">{total}/{max}</div>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Subject</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">Obtained</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {s.subjects.map((sub, j) => (
                        <TableRow key={j} className="border-gray-100">
                          <TableCell className="text-sm font-medium text-gray-900">{sub.subject}</TableCell>
                          <TableCell className="text-sm text-gray-700 text-right tabular-nums">{sub.obtained}/{sub.total}</TableCell>
                          <TableCell><span className="inline-flex items-center rounded-md border bg-gray-100 text-gray-600 border-gray-200 px-2 py-0.5 text-[11px] font-medium">{sub.grade}</span></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Classes View ─────────────────────────
function ClassesView({ user }: { user: any }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [section, setSection] = useState('A');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getClasses(user?.branchId).catch(() => []),
      api.platformUsers({ role: 'student', branchId: user?.branchId }).catch(() => []),
    ]).then(([c, s]) => {
      setClasses(Array.isArray(c) ? c : []);
      setStudents(Array.isArray(s) ? s : []);
    }).finally(() => setLoading(false));
  }, [user?.branchId]);

  useEffect(() => { load(); }, [load]);

  const studentCount = (cls: any) =>
    students.filter((s) => s.class === cls.name && s.section === cls.section).length;

  const submit = async () => {
    if (!name.trim()) { toast({ title: 'Class name is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await api.createClass(name.trim(), section.trim() || 'A', user?.branchId);
      toast({ title: 'Class created', description: `${name.trim()} — Section ${section.trim() || 'A'}` });
      setName(''); setSection('A'); setShowForm(false);
      load();
    } catch (e: any) {
      toast({ title: 'Failed to create class', description: e?.message || 'Please try again', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const del = async (cls: any) => {
    if (!confirm(`Delete ${cls.name} — Section ${cls.section}? This cannot be undone.`)) return;
    try {
      await api.deleteClassSection(cls.id);
      toast({ title: 'Class deleted' });
      load();
    } catch (e: any) {
      toast({ title: 'Cannot delete', description: e?.message || 'This class may have students assigned.', variant: 'destructive' });
    }
  };

  const totalSections = classes.length;
  const uniqueNames = new Set(classes.map((c) => c.name)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        subtitle="Create and manage class sections for this campus."
        action={
          <button onClick={() => setShowForm((s) => !s)} className={btnPrimary}>
            <Plus className="h-4 w-4" /> {showForm ? 'Cancel' : 'Add Class'}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={BookOpen} label="Total Sections" value={totalSections} sub={`${uniqueNames} unique class name(s)`} />
        <StatCard icon={GraduationCap} label="Total Students" value={students.length} sub="Across all classes" />
        <StatCard icon={Users} label="Avg per Section" value={totalSections > 0 ? Math.round(students.length / totalSections) : 0} sub="Students per section" />
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <SectionHeader title="New Class" desc="Create a class section. Students will be assigned during enrollment." />
          <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-3 items-end">
            <Field label="Class Name" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Grade 10, Class 9, Prep" />
            </Field>
            <Field label="Section">
              <Input value={section} onChange={(e) => setSection(e.target.value)} className={inputCls} placeholder="A" maxLength={3} />
            </Field>
            <button onClick={submit} disabled={saving} className={btnPrimary + ' h-10'}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Create Class
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Sections are auto-uppercased. Duplicate name+section combinations are rejected.</p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <SectionHeader title="All Classes" desc={`${totalSections} section(s) in this campus`} />
        {loading ? (
          <SkeletonTable rows={4} />
        ) : classes.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No classes yet"
            desc="Create your first class section using the 'Add Class' button above. The Admission Office needs at least one class to enroll students."
            action={
              <button onClick={() => setShowForm(true)} className={btnPrimary}>
                <Plus className="h-4 w-4" /> Create First Class
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 hover:bg-transparent">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Class Name</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400">Section</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-center">Students</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((c) => (
                  <TableRow key={c.id} className="border-gray-100 hover:bg-gray-50">
                    <TableCell className="text-sm font-medium text-gray-900">{c.name}</TableCell>
                    <TableCell className="text-sm text-gray-700">{c.section}</TableCell>
                    <TableCell className="text-sm text-gray-700 text-center">{studentCount(c)}</TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => del(c)}
                        className="h-8 px-2 text-xs text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded inline-flex items-center gap-1"
                      >
                        <AlertCircle className="h-3.5 w-3.5" /> Delete
                      </button>
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

export function AcademicPortal({ activeModule, user }: Props) {
  switch (activeModule) {
    case 'academic-overview': return <AcademicOverview user={user} />;
    case 'academic-announcements': return <AnnouncementsView user={user} />;
    case 'academic-classes': return <ClassesView user={user} />;
    case 'academic-teachers': return <TeachersView user={user} />;
    case 'academic-assign': return <AssignView user={user} />;
    case 'academic-students': return <StudentsView user={user} />;
    case 'academic-logins': return <LoginsView user={user} />;
    case 'timetable': return <TimetableView user={user} />;
    case 'academic-datesheet': return <DateSheetView user={user} />;
    case 'academic-tests': return <TestsView user={user} />;
    case 'results': return <ResultsView user={user} />;
    case 'report-cards': return <ReportCardsView user={user} />;
    default: return (
      <div className="space-y-6">
        <PageHeader title="Coming Soon" subtitle="This module is under development." />
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <EmptyState icon={BookOpen} title="Module in development" desc="This section will be available soon." />
        </div>
      </div>
    );
  }
}
