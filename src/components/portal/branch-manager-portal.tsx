'use client';

import { Fragment, lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users, GraduationCap, DollarSign, CalendarCheck, Plus, CheckCircle2, UserPlus, BookOpen,
  Network, Inbox, Eye, Edit, Lock, Unlock, Megaphone, Send, BookCopy,
  FileText, Wallet, Loader2, Banknote, AlertCircle, Scale, Calendar, X,
  CalendarPlus, MessageSquare, Smartphone, ChevronDown, ChevronRight, MapPin, MailCheck,
  Award, Save, Search, Hash, ChevronUp, BookCheck, RefreshCw, AlertTriangle, Sparkles,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AddUserModal } from './add-user-modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ReportCardDocument, ReportCardActions, type ReportCardData } from './report-card-view';

// Lazy-loaded v1.5.0 unique modules
const LiveTransportModule = lazy(() => import('@/components/dashboard/modules/live-transport'));
const DigitalIdModule = lazy(() => import('@/components/dashboard/modules/digital-id'));
const PtmSchedulingModule = lazy(() => import('@/components/dashboard/modules/ptm-scheduling'));
const HealthRecordsModule = lazy(() => import('@/components/dashboard/modules/health-records'));
const OnlineAdmissionsModule = lazy(() => import('@/components/dashboard/modules/online-admissions').then(m => ({ default: m.OnlineAdmissions })));
const ELearningModule = lazy(() => import('@/components/dashboard/modules/e-learning-hub').then(m => ({ default: m.ELearningHub })));
const ExamPortalModule = lazy(() => import('@/components/dashboard/modules/exam-portal').then(m => ({ default: m.ExamPortal })));
const ComplaintPortalModule = lazy(() => import('@/components/dashboard/modules/complaint-portal').then(m => ({ default: m.ComplaintPortal })));

function ModuleFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

const fmtMoney = (n: number) => 'PKR ' + Number(n || 0).toLocaleString('en-PK');
const NAVY = '#1a365d';
const ROSE = '#e11d48';
const EMERALD = '#059669';

export function BranchManagerPortal({ activeModule, user }: { activeModule: string; user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addRole, setAddRole] = useState<'teacher' | 'student'>('teacher');
  // New clean UX modals (teacher-focused):
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [assignCoursesFor, setAssignCoursesFor] = useState<any | null>(null);

  // Fetch teachers from the API. No synchronous setState — only setState inside
  // promise callbacks. This makes it safe to call from useEffect.
  const fetchTeachers = () => {
    if (!user?.branchId) return;
    api.platformUsers({ branchId: user.branchId, role: 'teacher' })
      .then(r => { setTeachers(Array.isArray(r) ? r : []); setTeachersError(null); })
      .catch(e => { setTeachersError(e.message || 'Failed to load teachers'); })
      .finally(() => setTeachersLoading(false));
  };

  const refresh = () => {
    if (user?.branchId) {
      api.scopedStats(user.instituteId, user.branchId).then(setStats).catch(() => {});
      fetchTeachers();
      api.platformUsers({ branchId: user.branchId, role: 'student' }).then(setStudents).catch(() => {});
      api.getBranchFinance(user.branchId)
        .then((d) => setFinance(d))
        .catch(() => setFinance(null))
        .finally(() => setFinanceLoading(false));
    }
  };
  useEffect(() => { refresh(); }, [user?.branchId]);

  const openAdd = (role: 'teacher' | 'student') => { setAddRole(role); setShowAdd(true); };
  const openAddTeacher = () => setShowAddTeacher(true);
  const openAssignCourses = (teacher: any) => setAssignCoursesFor(teacher);

  // Click handler for the "Refresh" button on the teachers list. Sync setState
  // is fine here because this runs in a click handler, not an effect.
  const handleRefreshTeachersClick = () => {
    setTeachersLoading(true);
    fetchTeachers();
  };

  let content: React.ReactNode;
  if (activeModule === 'teachers') content = <TeachersView teachers={teachers} loading={teachersLoading} error={teachersError} onRefresh={handleRefreshTeachersClick} onAdd={openAddTeacher} onAssignCourses={openAssignCourses} />;
  else if (activeModule === 'branch-students') content = <StudentsView students={students} onRefresh={refresh} onAdd={() => openAdd('student')} />;
  else if (activeModule === 'announcements') content = <AnnouncementsView user={user} />;
  else if (activeModule === 'class-courses') content = <ClassCoursesView user={user} />;
  else if (activeModule === 'fees') content = <FeeManagement user={user} />;
  else if (activeModule === 'report-cards') content = <ReportCardManager user={user} students={students} />;
  else if (activeModule === 'timetable') content = <TimetableManager user={user} />;
  else if (activeModule === 'attendance') content = <BMAttendanceView user={user} />;
  else if (activeModule === 'results') content = <BMResultsView user={user} />;
  else if (activeModule === 'complaints') content = <BMComplaintsView user={user} />;
  else if (activeModule === 'events') content = <BMEventsView user={user} />;
  else if (activeModule === 'sms') content = <BMSmsView user={user} />;
  else if (activeModule === 'live-transport') content = <Suspense fallback={<ModuleFallback />}><LiveTransportModule /></Suspense>;
  else if (activeModule === 'digital-id') content = <Suspense fallback={<ModuleFallback />}><DigitalIdModule /></Suspense>;
  else if (activeModule === 'ptm-scheduling') content = <Suspense fallback={<ModuleFallback />}><PtmSchedulingModule /></Suspense>;
  else if (activeModule === 'health-records') content = <Suspense fallback={<ModuleFallback />}><HealthRecordsModule /></Suspense>;
  else if (activeModule === 'online-admissions') content = <Suspense fallback={<ModuleFallback />}><OnlineAdmissionsModule user={user} /></Suspense>;
  else if (activeModule === 'e-learning') content = <Suspense fallback={<ModuleFallback />}><ELearningModule user={user} /></Suspense>;
  else if (activeModule === 'exam-portal') content = <Suspense fallback={<ModuleFallback />}><ExamPortalModule user={user} /></Suspense>;
  else if (activeModule === 'complaint-portal') content = <Suspense fallback={<ModuleFallback />}><ComplaintPortalModule user={user} /></Suspense>;
  else content = <BranchOverview user={user} stats={stats} teachers={teachers} students={students} finance={finance} financeLoading={financeLoading} onAddTeacher={openAddTeacher} onAddStudent={() => openAdd('student')} />;

  return (
    <>
      {content}
      {/* Student flow still uses the shared AddUserModal (out of scope for this redesign). */}
      <AddUserModal open={showAdd} onClose={() => setShowAdd(false)} role={addRole} instituteId={user?.instituteId} branchId={user?.branchId} onCreated={refresh} />
      {/* New clean Add Teacher flow — focused, sectioned, with inline validation.
          Conditionally rendered so useState initial values apply on each open. */}
      {showAddTeacher && (
        <AddTeacherModal onClose={() => setShowAddTeacher(false)} instituteId={user?.instituteId} branchId={user?.branchId} onCreated={refresh} />
      )}
      {/* New clean Assign Courses flow — toggle courses per class for an existing teacher.
          Conditionally rendered so useState initial values apply on each open. */}
      {assignCoursesFor && (
        <AssignCoursesModal teacher={assignCoursesFor} onClose={() => setAssignCoursesFor(null)} branchId={user?.branchId} onSaved={refresh} />
      )}
    </>
  );
}

function ModuleHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground mt-1">{subtitle}</p></div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action }: any) {
  return (
    <Card className="p-10 text-center">
      <div className="inline-flex h-14 w-14 rounded-2xl bg-muted/60 items-center justify-center mb-4"><Icon className="h-7 w-7 text-muted-foreground" /></div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

function BranchOverview({ user, stats, teachers, students, finance, financeLoading, onAddTeacher, onAddStudent }: any) {
  const kpi = finance?.kpi || {};
  const monthly = Array.isArray(finance?.monthlyRevenue) ? finance.monthlyRevenue : [];
  const recentTx = Array.isArray(finance?.recentTransactions) ? finance.recentTransactions : [];
  const feeStatus = finance?.feeStatus || { paid: 0, unpaid: 0, paidAmount: 0, unpaidAmount: 0 };

  const feePieData = [
    { name: 'Paid', value: Number(feeStatus.paid || 0), amount: Number(feeStatus.paidAmount || 0), color: EMERALD },
    { name: 'Unpaid', value: Number(feeStatus.unpaid || 0), amount: Number(feeStatus.unpaidAmount || 0), color: ROSE },
  ];

  const netPositive = (kpi.netBalance || 0) >= 0;
  const kpiCards = [
    { label: 'Total Revenue', value: fmtMoney(kpi.totalRevenue), icon: DollarSign, tone: 'default' as const, iconTone: 'primary' as const },
    { label: 'Pending Fees', value: fmtMoney(kpi.pendingFees), icon: AlertCircle, tone: 'default' as const, iconTone: 'rose' as const },
    { label: 'Salary Paid', value: fmtMoney(kpi.totalSalaryPaid), icon: Wallet, tone: 'default' as const, iconTone: 'primary' as const },
    { label: 'Net Balance', value: fmtMoney(kpi.netBalance), icon: Scale, tone: (netPositive ? 'positive' : 'negative'), iconTone: (netPositive ? 'emerald' : 'rose') },
    { label: 'Attendance Rate', value: (kpi.attendanceRate || 0) + '%', icon: CalendarCheck, tone: 'default' as const, iconTone: 'primary' as const },
    { label: 'Total Invoices', value: String(kpi.totalInvoices || 0), icon: FileText, tone: 'default', iconTone: 'primary' },
  ];

  const sCount = kpi.students ?? stats?.students ?? 0;
  const tCount = kpi.teachers ?? stats?.teachers ?? 0;
  const totalRev = Number(kpi.totalRevenue ?? 0);
  const bannerSub = (sCount || tCount || totalRev)
    ? `${sCount} students · ${tCount} teachers · PKR ${totalRev.toLocaleString('en-PK')} collected`
    : 'Add your first teacher or student to get started.';

  return (
    <div className="space-y-6">
      {/* Welcome banner — clean navy gradient, no decorative overlays */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15"><Network className="h-3 w-3 text-primary/70" /> Branch Manager · {user?.branchName}</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">Welcome, {user?.name?.split(' ')[0]}</h1>
            <p className="text-white/80 text-sm mt-1.5 max-w-lg">{bannerSub}</p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-white text-primary hover:bg-white/90" size="sm" onClick={onAddTeacher}><UserPlus className="h-4 w-4 mr-1.5" /> Add Teacher</Button>
            <Button className="bg-white/10 text-white border border-white/30 hover:bg-white/20" size="sm" onClick={onAddStudent}><Plus className="h-4 w-4 mr-1.5" /> Add Student</Button>
          </div>
        </div>
      </motion.div>

      {/* Financial KPI cards / charts / transactions (loading-aware) */}
      {financeLoading ? (
        <FinanceSkeleton />
      ) : !finance ? (
        <EmptyState icon={Wallet} title="No financial data yet" desc="Branch financial analytics will appear here once fee invoices and salary payouts are recorded." />
      ) : (
        <>
          {/* KPI cards — compact: p-4, h-9 w-9 icons, text-lg/xl values */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            {kpiCards.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-2.5 sm:p-3 border border-border rounded-lg shadow-sm hover:shadow-md transition">
                  <div className={`h-8 w-8 rounded-lg grid place-items-center mb-2 ${c.iconTone === 'rose' ? 'bg-rose-500/10' : c.iconTone === 'emerald' ? 'bg-emerald-500/10' : 'bg-primary/10'}`}>
                    <c.icon className={`h-4 w-4 ${c.iconTone === 'rose' ? 'text-rose-600' : c.iconTone === 'emerald' ? 'text-emerald-600' : 'text-primary'}`} />
                  </div>
                  <div className={`text-base font-bold tabular-nums leading-tight ${c.tone === 'positive' ? 'text-emerald-600' : c.tone === 'negative' ? 'text-rose-600' : 'text-foreground'}`}>{c.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
                  {c.sub && <div className="text-[11px] text-muted-foreground mt-0.5">{c.sub}</div>}
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-5 border border-border rounded-lg shadow-sm">
              <div className="mb-4">
                <h3 className="font-bold text-base">Revenue vs Salary (Last 12 Months)</h3>
                <p className="text-xs text-muted-foreground">Monthly fee collection vs salary payout</p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthly} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: number) => (v / 1000) + 'k'} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                    formatter={(v: any, name: any) => [fmtMoney(v), name === 'revenue' ? 'Revenue' : 'Salary']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => (v === 'revenue' ? 'Revenue' : 'Salary')} />
                  <Bar dataKey="revenue" fill={NAVY} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="salary" fill={ROSE} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5 border border-border rounded-lg shadow-sm">
              <div className="mb-4">
                <h3 className="font-bold text-base">Fee Status</h3>
                <p className="text-xs text-muted-foreground">Paid vs unpaid invoices</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={feePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                      {feePieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: any, _n: any, p: any) => [`${v} invoices · ${fmtMoney(p?.payload?.amount)}`, p?.payload?.name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1 w-full">
                  {feePieData.map((d) => (
                    <div key={d.name} className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-sm font-semibold">{d.name}</span>
                      </div>
                      <div className="mt-1 text-lg font-extrabold tabular-nums">{d.value} invoices</div>
                      <div className="text-xs text-muted-foreground">{fmtMoney(d.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="p-5 border border-border rounded-lg shadow-sm">
            <div className="mb-4">
              <h3 className="font-bold text-base">Recent Transactions</h3>
              <p className="text-xs text-muted-foreground">Latest fee payments and salary payouts</p>
            </div>
            {recentTx.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No transactions yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Party</TableHead>
                    <TableHead className="text-xs">Method</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTx.slice(0, 8).map((t: any) => {
                    const isSalary = t.type === 'Salary Payout';
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${isSalary ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20'}`}>
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{t.party}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.method}</TableCell>
                        <TableCell className={`text-sm font-bold tabular-nums text-right ${isSalary ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {isSalary ? '-' : '+'}{fmtMoney(t.amount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      )}

      {/* Compact Teachers + Students lists */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base">Teachers ({teachers.length})</h3>
            <Button size="sm" variant="outline" onClick={onAddTeacher}><UserPlus className="h-4 w-4 mr-1.5" /> Add</Button>
          </div>
          {teachers.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No teachers yet. Click "Add" to create one.</div>
          ) : (
            <div className="space-y-2">
              {teachers.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                  <div className="h-9 w-9 rounded-full bg-primary/10 grid place-items-center"><Users className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">{t.name}</div><div className="text-[11px] text-muted-foreground truncate">{t.subjects?.join(', ') || t.email}</div></div>
                </div>
              ))}
              {teachers.length > 5 && (
                <Button size="sm" variant="ghost" className="w-full text-xs">View all {teachers.length} teachers</Button>
              )}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base">Students ({students.length})</h3>
            <Button size="sm" variant="outline" onClick={onAddStudent}><Plus className="h-4 w-4 mr-1.5" /> Add</Button>
          </div>
          {students.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No students yet. Click "Add" to create one.</div>
          ) : (
            <div className="space-y-2">
              {students.slice(0, 5).map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                  <div className="h-9 w-9 rounded-full bg-primary/10 grid place-items-center"><GraduationCap className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">{s.name}</div><div className="text-[11px] text-muted-foreground truncate">{s.class} {s.section} · {s.rollNo}</div></div>
                </div>
              ))}
              {students.length > 5 && (
                <Button size="sm" variant="ghost" className="w-full text-xs">View all {students.length} students</Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function FinanceSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 border border-border rounded-lg">
            <div className="h-9 w-9 rounded-lg bg-muted animate-pulse mb-3" />
            <div className="h-5 w-20 rounded bg-muted animate-pulse" />
            <div className="h-3 w-16 rounded bg-muted animate-pulse mt-2" />
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 border border-border rounded-lg">
          <div className="h-4 w-48 bg-muted animate-pulse rounded mb-4" />
          <div className="h-[280px] bg-muted/50 animate-pulse rounded" />
        </Card>
        <Card className="p-5 border border-border rounded-lg">
          <div className="h-4 w-32 bg-muted animate-pulse rounded mb-4" />
          <div className="h-[280px] bg-muted/50 animate-pulse rounded" />
        </Card>
      </div>
      <Card className="p-5 border border-border rounded-lg">
        <div className="h-4 w-40 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted/50 animate-pulse rounded" />
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============ User row actions: View Password / Edit / Block ============
function UserRowActions({ u, onRefresh }: { u: any; onRefresh: () => void }) {
  const [showPass, setShowPass] = useState(false);
  const [pass, setPass] = useState('');
  const [mustChange, setMustChange] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [busy, setBusy] = useState(false);

  const viewPassword = async () => {
    setBusy(true);
    try {
      const r = await api.getUserPassword(u.id);
      setPass(r.password || '—');
      setMustChange(r.mustChangePassword === true);
      setShowPass(true);
    } catch (e: any) { toast({ title: 'Could not fetch password', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const toggleBlock = async () => {
    setBusy(true);
    try {
      await api.blockUser(u.id, !u.blocked, !u.blocked ? 'Blocked by Branch Manager' : '');
      toast({ title: u.blocked ? 'User unblocked' : 'User blocked', description: u.blocked ? 'Access restored' : 'Their session was invalidated' });
      onRefresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={viewPassword} disabled={busy} title="View Password" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-50"><Eye className="h-4 w-4" /></button>
      <button onClick={() => setShowEdit(true)} title="Edit" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"><Edit className="h-4 w-4" /></button>
      <button onClick={toggleBlock} disabled={busy} title={u.blocked ? 'Unblock' : 'Block'} className={`h-8 w-8 grid place-items-center rounded-lg ${u.blocked ? 'text-rose-600 hover:bg-rose-500/10' : 'text-primary hover:bg-accent0/10'} disabled:opacity-50`}>{u.blocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</button>
      {showPass && (
        <div className="ml-2 px-2 py-1 rounded-md bg-accent dark:bg-[oklch(0.12_0.03_260)_/_0.4] border border-accent dark:border-[oklch(0.25_0.04_260)] text-xs">
          <span className="text-primary dark:text-primary/70 font-mono">{pass}</span>
          {mustChange && <span className="text-primary dark:text-[oklch(0.6_0.04_260)] ml-1">· must change</span>}
        </div>
      )}
      {showEdit && <EditUserModal u={u} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onRefresh(); }} />}
    </div>
  );
}

function EditUserModal({ u, onClose, onSaved }: { u: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: u.name || '', email: u.email || '', password: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const body: any = { name: form.name };
      if (form.email) body.email = form.email;
      if (form.password) body.password = form.password;
      await api.editUser(u.id, body);
      toast({ title: 'User updated', description: form.password ? 'Password changed — user must change it on next sign-in' : 'Profile saved' });
      onSaved();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md my-4">
        <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
          <h3 className="font-bold text-lg mb-1">Edit {u.role === 'teacher' ? 'Teacher' : 'Student'}</h3>
          <p className="text-sm text-muted-foreground mb-4">Update profile details or assign a new password.</p>
          <div className="space-y-3">
            <div><Label>Full name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="optional" className="mt-1" /></div>
            <div>
              <Label>New password</Label>
              <Input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="leave blank to keep current" className="mt-1" />
              <p className="text-[11px] text-muted-foreground mt-1">If changed, the user must set a new password on next sign-in.</p>
            </div>
            {u.class && <div className="text-xs text-muted-foreground pt-1 border-t border-border/40">Class: <span className="font-medium text-foreground">{u.class} · {u.section || 'A'}</span></div>}
          </div>
          <div className="flex gap-2 mt-5">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save Changes'}</Button>
            <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// New clean Add Teacher flow — focused, sectioned, with inline validation.
// Replaces the legacy AddUserModal for the teacher case.
// Conditionally rendered by the parent so useState initial values apply on each open.
// ============================================================
function AddTeacherModal({ onClose, instituteId, branchId, onCreated }: {
  onClose: () => void; instituteId?: string; branchId?: string; onCreated: () => void;
}) {
  // Required fields
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [password, setPassword] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState('');
  // Optional (collapsible)
  const [email, setEmail] = useState('');
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [showClassCourses, setShowClassCourses] = useState(false);
  // Loaded data
  const [classes, setClasses] = useState<any[]>([]);
  const [classCourses, setClassCourses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  // Submission state
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<any>(null);

  // Load classes for the optional class picker (runs once on mount).
  // No sync setState in the effect body — loadingClasses starts as `true`,
  // and is set to `false` in the .finally() callback.
  useEffect(() => {
    if (!branchId) { setLoadingClasses(false); return; }
    let cancelled = false;
    api.getClasses(branchId)
      .then(r => { if (!cancelled) setClasses(Array.isArray(r) ? r : []); })
      .catch(() => { if (!cancelled) setClasses([]); })
      .finally(() => { if (!cancelled) setLoadingClasses(false); });
    return () => { cancelled = true; };
  }, [branchId]);

  // Load courses for the selected class (only when class is picked inside the optional section)
  useEffect(() => {
    if (!classId) { setClassCourses([]); setSelectedCourseIds([]); return; }
    let cancelled = false;
    setLoadingCourses(true);
    setSelectedCourseIds([]);
    api.getCourses({ classId })
      .then(r => { if (!cancelled) setClassCourses(Array.isArray(r) ? r : []); })
      .catch(() => { if (!cancelled) setClassCourses([]); })
      .finally(() => { if (!cancelled) setLoadingCourses(false); });
    return () => { cancelled = true; };
  }, [classId]);

  const addSubject = () => {
    const v = subjectInput.trim();
    if (!v) return;
    if (subjects.some(s => s.toLowerCase() === v.toLowerCase())) { setSubjectInput(''); return; }
    setSubjects([...subjects, v]);
    setSubjectInput('');
    setErrors(e => ({ ...e, subjects: '' }));
  };
  const removeSubject = (s: string) => setSubjects(subjects.filter(x => x !== s));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!rollNo.trim()) e.rollNo = 'Teacher ID is required';
    if (!password) e.password = 'Password is required';
    else if (password.length < 4) e.password = 'Password must be at least 4 characters';
    if (subjects.length === 0) e.subjects = 'Add at least one subject (e.g. Mathematics)';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setCreating(true);
    try {
      const selectedClass = classes.find((c: any) => c.id === classId);
      const body: any = {
        name: name.trim(),
        rollNo: rollNo.trim(),
        password,
        role: 'teacher',
        instituteId,
        branchId,
        subjects,
      };
      if (email.trim()) body.email = email.trim();
      if (classId) {
        body.classId = classId;
        if (selectedClass?.name) body.class = selectedClass.name;
        body.section = (section || '').trim() || selectedClass?.section || 'A';
      }
      if (classId && selectedCourseIds.length > 0) body.courseIds = selectedCourseIds;

      const res = await api.createPlatformUser(body);
      setCreated(res);
      onCreated();
      toast({ title: 'Teacher added!', description: `${res.user.name} can now sign in to the Teacher portal.` });
    } catch (err: any) {
      const msg = err.message || 'Something went wrong';
      if (msg.includes('Email already in use')) {
        setErrors(e => ({ ...e, email: 'This email is already in use' }));
        toast({ title: 'Email already registered', description: 'Use a different email or leave it blank — email is optional.', variant: 'destructive' });
      } else if (msg.includes('Roll Number already exists')) {
        setErrors(e => ({ ...e, rollNo: 'A teacher with this ID already exists in your branch' }));
        toast({ title: 'Teacher ID already exists', description: 'Please use a different Teacher ID.', variant: 'destructive' });
      } else if (msg.includes('Authentication required') || msg.includes('session')) {
        toast({ title: 'Session expired', description: 'Please sign out and sign in again, then retry.', variant: 'destructive' });
      } else {
        toast({ title: 'Failed to add teacher', description: msg, variant: 'destructive' });
      }
    } finally { setCreating(false); }
  };

  const close = () => { onClose(); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/50 overflow-y-auto"
      onClick={close}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg my-4">
        <Card className="max-h-[92vh] overflow-y-auto scroll-fancy rounded-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Add Teacher</h3>
                <p className="text-xs text-muted-foreground mt-0.5">A login will be created. They must change their password on first sign-in.</p>
              </div>
            </div>
            <button onClick={close} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          {created ? (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500/15 grid place-items-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Teacher added!</h4>
                  <p className="text-sm text-muted-foreground">{created.user.name}</p>
                </div>
              </div>
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-2 text-sm">
                <div className="font-semibold text-emerald-700 dark:text-emerald-300">Login credentials</div>
                {created.user.email && (
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span className="font-mono text-xs">{created.user.email}</span></div>
                )}
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Teacher ID</span><span className="font-mono text-xs">{created.user.rollNo || '—'}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Password</span><span className="font-mono">{created.defaultPassword}</span></div>
                <p className="text-[11px] text-muted-foreground pt-1 border-t border-emerald-500/10 mt-2">
                  The teacher will be asked to set a new password on first sign-in. You can assign courses to them now from the teacher list.
                </p>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" onClick={close}>Done</Button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-5">
              {/* Section 1: Personal Info */}
              <section>
                <SectionLabel icon={Users} label="Personal info" />
                <div className="space-y-3 mt-2">
                  <div>
                    <Label className="text-xs font-medium">Full name <span className="text-rose-500">*</span></Label>
                    <Input value={name} onChange={e => { setName(e.target.value); setErrors(er => ({ ...er, name: '' })); }}
                      placeholder="e.g. Ms. Olivia Davis" className="mt-1" autoFocus />
                    {errors.name && <FieldError msg={errors.name} />}
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Teacher ID <span className="text-rose-500">*</span></Label>
                    <div className="relative mt-1">
                      <Hash className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input value={rollNo} onChange={e => { setRollNo(e.target.value); setErrors(er => ({ ...er, rollNo: '' })); }}
                        placeholder="e.g. TCH-001" className="pl-9" />
                    </div>
                    {errors.rollNo ? <FieldError msg={errors.rollNo} /> : (
                      <p className="text-[11px] text-muted-foreground mt-1">Used by the teacher to sign in. Must be unique in your branch.</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Section 2: Account */}
              <section>
                <SectionLabel icon={Lock} label="Account" />
                <div className="mt-2">
                  <Label className="text-xs font-medium">Temporary password <span className="text-rose-500">*</span></Label>
                  <Input type="text" value={password} onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: '' })); }}
                    placeholder="At least 4 characters" className="mt-1" />
                  {errors.password ? <FieldError msg={errors.password} /> : (
                    <p className="text-[11px] text-muted-foreground mt-1">The teacher must change this on first sign-in.</p>
                  )}
                </div>
              </section>

              {/* Section 3: Subjects */}
              <section>
                <SectionLabel icon={BookOpen} label="Subjects taught" />
                <div className="mt-2">
                  <Label className="text-xs font-medium">Add subjects <span className="text-rose-500">*</span></Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={subjectInput}
                      onChange={e => setSubjectInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSubject(); } }}
                      placeholder="Type a subject and press Enter (e.g. Mathematics)"
                    />
                    <Button type="button" size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={addSubject} disabled={!subjectInput.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {subjects.map(s => (
                        <Badge key={s} variant="secondary" className="font-normal text-xs bg-primary/5 text-primary border border-primary/15 pl-2.5 pr-1 py-1 flex items-center gap-1.5">
                          {s}
                          <button onClick={() => removeSubject(s)} className="h-4 w-4 grid place-items-center rounded hover:bg-primary/15">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  {errors.subjects && <FieldError msg={errors.subjects} />}
                </div>
              </section>

              {/* Collapsible: More details */}
              <section>
                <button type="button" onClick={() => setShowMore(v => !v)}
                  className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Plus className="h-4 w-4 text-primary" /> More details (optional)
                  </span>
                  {showMore ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {showMore && (
                  <div className="mt-3 space-y-3 pl-1">
                    <div>
                      <Label className="text-xs font-medium">Email (optional)</Label>
                      <Input type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email: '' })); }}
                        placeholder="teacher.davis@school.edu" className="mt-1" />
                      {errors.email ? <FieldError msg={errors.email} /> : (
                        <p className="text-[11px] text-muted-foreground mt-1">If provided, the teacher can also sign in with this email.</p>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Collapsible: Assign to a class & courses (optional at creation) */}
              <section>
                <button type="button" onClick={() => setShowClassCourses(v => !v)}
                  className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <BookCheck className="h-4 w-4 text-primary" /> Assign to a class & courses (optional)
                  </span>
                  {showClassCourses ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {showClassCourses && (
                  <div className="mt-3 space-y-3 pl-1">
                    <p className="text-[11px] text-muted-foreground -mt-1">
                      You can assign courses now or skip and do it later from the teacher list. Either way, the teacher can sign in immediately.
                    </p>
                    <div>
                      <Label className="text-xs font-medium">Class</Label>
                      <Select value={classId} onValueChange={v => setClassId(v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder={loadingClasses ? 'Loading classes…' : 'Select a class (optional)'} /></SelectTrigger>
                        <SelectContent>
                          {classes.length === 0 && !loadingClasses && (
                            <div className="px-3 py-2 text-xs text-muted-foreground">No classes found in this branch.</div>
                          )}
                          {classes.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}{c.section ? ` — ${c.section}` : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {classId && loadingCourses && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading courses…
                      </div>
                    )}
                    {classId && !loadingCourses && classCourses.length === 0 && (
                      <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                        <strong>No courses assigned to this class yet.</strong> You can assign courses to the class first in <em>Classes &amp; Courses</em>, or skip this step.
                      </div>
                    )}
                    {classId && !loadingCourses && classCourses.length > 0 && (
                      <div>
                        <Label className="text-xs font-medium">Courses to assign</Label>
                        <div className="mt-1 rounded-xl border border-border max-h-44 overflow-y-auto scroll-fancy p-2 space-y-1">
                          {classCourses.map((c: any) => {
                            const checked = selectedCourseIds.includes(c.id);
                            return (
                              <button key={c.id} type="button" onClick={() => toggleCourseHelper(selectedCourseIds, setSelectedCourseIds, c.id)}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition ${checked ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-foreground'}`}>
                                <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition ${checked ? 'bg-primary border-primary' : 'border-input bg-background'}`}>
                                  {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
                                </span>
                                <span className="font-medium">{c.name}</span>
                                {c.code && <span className="text-[10px] text-muted-foreground uppercase ml-auto">{c.code}</span>}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">{selectedCourseIds.length} of {classCourses.length} course{classCourses.length === 1 ? '' : 's'} selected.</p>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Footer */}
              <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-3 bg-card border-t border-border flex gap-2">
                <Button size="sm" variant="outline" onClick={close} disabled={creating} className="flex-1">Cancel</Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={creating} onClick={submit}>
                  {creating ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Creating…</> : <><UserPlus className="h-4 w-4 mr-1.5" /> Create Teacher</>}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

function toggleCourseHelper(current: string[], setter: (v: string[]) => void, id: string) {
  setter(current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
}

function SectionLabel({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">{label}</span>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
      <AlertCircle className="h-3 w-3 shrink-0" /> {msg}
    </p>
  );
}

// ============================================================
// New clean Assign Courses flow — toggle courses per class for an existing teacher.
// Calls api.editUser(id, { classId, addCourseIds }) which is the existing API
// for attaching courses to a teacher. (The backend doesn't yet expose removal
// or a per-teacher listing endpoint, so this modal is honest about being
// an "assign additional" experience.)
// Conditionally rendered by the parent so useState initial values apply on each open.
// ============================================================
function AssignCoursesModal({ teacher, onClose, branchId, onSaved }: {
  teacher: any; onClose: () => void; branchId?: string; onSaved: () => void;
}) {
  const [classes, setClasses] = useState<any[]>([]);
  const [coursesByClass, setCoursesByClass] = useState<Record<string, any[]>>({});
  // loading starts true (the modal opens in a loading state); set to false in .finally()
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  // selectedByClass: { [classId]: courseId[] }
  const [selectedByClass, setSelectedByClass] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [expandedClassIds, setExpandedClassIds] = useState<Set<string>>(new Set());

  // Load all classes + their courses on mount. No sync setState in the effect body —
  // loading starts as `true` from useState, error is only set in .catch().
  // (If branchId is missing, the server falls back to the user's own branch — see
  // GET /api/classes handler — so we just call api.getClasses(branchId) unconditionally.)
  useEffect(() => {
    let cancelled = false;
    api.getClasses(branchId)
      .then(async (rows) => {
        if (cancelled) return;
        const classRows = Array.isArray(rows) ? rows : [];
        // Group classes by name (the API returns one row per section). For course assignment,
        // all sections of the same class share the same course list, so dedupe by name and
        // use the first section's id.
        const seen = new Set<string>();
        const deduped: any[] = [];
        for (const c of classRows) {
          if (c.name && !seen.has(c.name)) { seen.add(c.name); deduped.push(c); }
        }
        // Fetch courses for each class in parallel
        const entries: Record<string, any[]> = {};
        await Promise.all(deduped.map(c =>
          api.getCourses({ classId: c.id })
            .then(r => { entries[c.id] = Array.isArray(r) ? r : []; })
            .catch(() => { entries[c.id] = []; })
        ));
        if (cancelled) return;
        setClasses(deduped);
        setCoursesByClass(entries);
        // Auto-expand classes that have courses
        setExpandedClassIds(new Set(deduped.filter(c => (entries[c.id] || []).length > 0).map(c => c.id)));
      })
      .catch(e => { if (!cancelled) setError(e.message || 'Failed to load classes'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [branchId]);

  const initials = (teacher.name || '?').split(' ').map((s: string) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
  const toggleCourse = (classId: string, courseId: string) => {
    setSelectedByClass(prev => {
      const cur = prev[classId] || [];
      return { ...prev, [classId]: cur.includes(courseId) ? cur.filter(x => x !== courseId) : [...cur, courseId] };
    });
  };
  const toggleClassExpanded = (classId: string) => {
    setExpandedClassIds(prev => {
      const next = new Set(prev);
      if (next.has(classId)) next.delete(classId); else next.add(classId);
      return next;
    });
  };
  const selectAllInClass = (classId: string) => {
    const courses = coursesByClass[classId] || [];
    setSelectedByClass(prev => ({ ...prev, [classId]: courses.map((c: any) => c.id) }));
  };
  const clearAllInClass = (classId: string) => {
    setSelectedByClass(prev => ({ ...prev, [classId]: [] }));
  };

  const totalSelected = Object.values(selectedByClass).reduce((acc, arr) => acc + (arr?.length || 0), 0);
  const filteredClasses = classes.map(c => {
    const courses = (coursesByClass[c.id] || []).filter(course => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (course.name || '').toLowerCase().includes(q) || (course.code || '').toLowerCase().includes(q);
    });
    return { ...c, _filteredCourses: courses };
  }).filter(c => (c._filteredCourses.length > 0) || !search.trim());

  const save = async () => {
    const classesWithSelections = Object.entries(selectedByClass).filter(([, ids]) => ids && ids.length > 0);
    if (classesWithSelections.length === 0) {
      toast({ title: 'No courses selected', description: 'Toggle on at least one course to assign.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    let successCount = 0;
    let failedCount = 0;
    let lastError = '';
    // The existing PATCH endpoint accepts one (classId, addCourseIds) pair per call, so iterate.
    for (const [classId, courseIds] of classesWithSelections) {
      try {
        await api.editUser(teacher.id, { classId, addCourseIds: courseIds });
        successCount += courseIds.length;
      } catch (e: any) {
        failedCount += courseIds.length;
        lastError = e.message || 'Unknown error';
      }
    }
    setSaving(false);
    if (successCount > 0 && failedCount === 0) {
      toast({ title: 'Courses assigned', description: `${successCount} course${successCount === 1 ? '' : 's'} assigned to ${teacher.name}.` });
      onSaved();
      onClose();
    } else if (successCount > 0 && failedCount > 0) {
      toast({ title: 'Partially saved', description: `${successCount} assigned, ${failedCount} failed. Last error: ${lastError}`, variant: 'destructive' });
      onSaved();
      onClose();
    } else {
      toast({ title: 'Failed to assign courses', description: lastError || 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/50 overflow-y-auto"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl my-4">
        <Card className="max-h-[92vh] overflow-y-auto scroll-fancy rounded-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-primary grid place-items-center text-white font-bold text-sm shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg leading-tight truncate">Assign Courses</h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Select courses to assign to <span className="font-semibold text-foreground">{teacher.name}</span>
                </p>
              </div>
            </div>
            <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading classes and courses…</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="inline-flex h-14 w-14 rounded-2xl bg-rose-500/10 items-center justify-center mb-4">
                <AlertCircle className="h-7 w-7 text-rose-600" />
              </div>
              <h4 className="font-bold text-base">Couldn't load courses</h4>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{error}</p>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white mt-4" onClick={onClose}>Close</Button>
            </div>
          ) : classes.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex h-14 w-14 rounded-2xl bg-amber-500/10 items-center justify-center mb-4">
                <BookOpen className="h-7 w-7 text-amber-600" />
              </div>
              <h4 className="font-bold text-base">No classes in your branch yet</h4>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Classes are auto-created when your branch is provisioned. If you don't see them, ask your Institute Admin.
              </p>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white mt-4" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search courses by name or code…" className="pl-9" />
              </div>

              {/* Info banner */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-primary flex items-start gap-2">
                <BookCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <strong>How this works:</strong> Toggle on courses to assign them to {teacher.name}. Already-assigned courses will not be duplicated. Each class shows its own course list — a teacher can be assigned to courses across multiple classes.
                </div>
              </div>

              {/* Classes with courses */}
              <div className="space-y-2">
                {filteredClasses.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No courses match &ldquo;{search}&rdquo;. Try a different search term.
                  </div>
                )}
                {filteredClasses.map(c => {
                  const courses = c._filteredCourses;
                  const selected = selectedByClass[c.id] || [];
                  const isExpanded = expandedClassIds.has(c.id);
                  const allSelected = courses.length > 0 && selected.length === courses.length;
                  return (
                    <div key={c.id} className="rounded-xl border border-border overflow-hidden">
                      {/* Class header row */}
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40">
                        <button type="button" onClick={() => toggleClassExpanded(c.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                          <div className="h-7 w-7 rounded-md bg-primary/10 grid place-items-center text-primary font-bold text-xs shrink-0">
                            {(c.name || '').replace(/[^0-9]/g, '').slice(-2) || '—'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">{c.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {courses.length} course{courses.length === 1 ? '' : 's'} available
                              {selected.length > 0 && <span className="text-primary"> · {selected.length} selected</span>}
                            </div>
                          </div>
                        </button>
                        {courses.length > 0 && (
                          <button type="button" onClick={() => allSelected ? clearAllInClass(c.id) : selectAllInClass(c.id)}
                            className="text-[11px] font-medium text-primary hover:underline shrink-0">
                            {allSelected ? 'Clear' : 'Select all'}
                          </button>
                        )}
                      </div>
                      {/* Courses list */}
                      {isExpanded && (
                        <div className="p-2 space-y-1 bg-card">
                          {courses.length === 0 ? (
                            <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                              No courses assigned to this class. Visit <em>Classes &amp; Courses</em> to add some.
                            </div>
                          ) : courses.map((course: any) => {
                            const checked = selected.includes(course.id);
                            return (
                              <button key={course.id} type="button" onClick={() => toggleCourse(c.id, course.id)}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition text-left ${checked ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-foreground'}`}>
                                <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition ${checked ? 'bg-primary border-primary' : 'border-input bg-background'}`}>
                                  {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
                                </span>
                                <span className="font-medium flex-1 truncate">{course.name}</span>
                                {course.code && <span className="text-[10px] text-muted-foreground uppercase shrink-0">{course.code}</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-3 bg-card border-t border-border flex items-center gap-3">
                <div className="text-xs text-muted-foreground">
                  {totalSelected > 0 ? (
                    <span className="text-primary font-semibold">{totalSelected} course{totalSelected === 1 ? '' : 's'} selected</span>
                  ) : 'Toggle on courses to assign'}
                </div>
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={saving || totalSelected === 0} onClick={save}>
                    {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving…</> : <><Save className="h-4 w-4 mr-1.5" /> Save Assignment</>}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

function TeachersView({ teachers, loading, error, onAdd, onRefresh, onAssignCourses }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Teachers" subtitle={`${teachers.length} teacher${teachers.length === 1 ? '' : 's'} in your branch`}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading} title="Refresh">
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={onAdd}>
              <UserPlus className="h-4 w-4 mr-1.5" /> Add Teacher
            </Button>
          </>
        } />

      {loading ? (
        <TeachersSkeleton />
      ) : error ? (
        <Card className="p-8 text-center">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-rose-500/10 items-center justify-center mb-4">
            <AlertCircle className="h-7 w-7 text-rose-600" />
          </div>
          <h3 className="font-bold text-lg">Couldn't load teachers</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{error}</p>
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white mt-4" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Try again
          </Button>
        </Card>
      ) : teachers.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No teachers yet"
          desc="Add your first teacher to get started. A login will be auto-created so they can sign in to their Teacher portal — then you can assign courses to them."
          action={<Button className="bg-primary hover:bg-primary/90 text-white" onClick={onAdd}><UserPlus className="h-4 w-4 mr-1.5" /> Add your first teacher</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {teachers.map((t: any) => (
            <TeacherCard key={t.id} teacher={t} onRefresh={onRefresh} onAssignCourses={() => onAssignCourses(t)} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeachersSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-5 border border-border rounded-xl">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="mt-4 flex gap-1.5">
            <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
            <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
          </div>
          <div className="mt-4 flex gap-1.5">
            <div className="h-8 w-8 bg-muted animate-pulse rounded-lg" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-lg" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-lg" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function TeacherCard({ teacher: t, onRefresh, onAssignCourses }: { teacher: any; onRefresh: () => void; onAssignCourses: () => void }) {
  const initials = (t.name || '?').split(' ').map((s: string) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
  const subjects: string[] = Array.isArray(t.subjects) ? t.subjects : [];
  const isBlocked = !!t.blocked;
  const [showPass, setShowPass] = useState(false);
  const [pass, setPass] = useState('');
  const [mustChange, setMustChange] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const viewPassword = async () => {
    if (showPass) { setShowPass(false); return; }
    setBusy(true);
    try {
      const r = await api.getUserPassword(t.id);
      setPass(r.password || '—');
      setMustChange(r.mustChangePassword === true);
      setShowPass(true);
    } catch (e: any) { toast({ title: 'Could not fetch password', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const toggleBlock = async () => {
    setBusy(true);
    try {
      await api.blockUser(t.id, !isBlocked, !isBlocked ? 'Blocked by Branch Manager' : '');
      toast({ title: isBlocked ? 'Teacher unblocked' : 'Teacher blocked', description: isBlocked ? 'Access restored' : 'Their session was invalidated' });
      onRefresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  return (
    <Card className="p-5 border border-border rounded-xl shadow-sm hover:shadow-md transition flex flex-col">
      {/* Header: avatar + name + status */}
      <div className="flex items-start gap-3">
        <div className={`h-11 w-11 rounded-full grid place-items-center text-white font-bold text-sm shrink-0 ${isBlocked ? 'bg-rose-500' : 'bg-primary'}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate" title={t.name}>{t.name}</div>
          <div className="text-[11px] text-muted-foreground font-mono truncate flex items-center gap-1">
            <Hash className="h-3 w-3" />{t.rollNo || '—'}
          </div>
        </div>
        <Badge variant="outline" className={isBlocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20 shrink-0' : 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20 shrink-0'}>
          {isBlocked ? 'Blocked' : (t.status || 'Active')}
        </Badge>
      </div>

      {/* Subjects */}
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Subjects</div>
        {subjects.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {subjects.slice(0, 4).map((s: string) => (
              <Badge key={s} variant="secondary" className="font-normal text-[11px] bg-primary/5 text-primary border border-primary/15">
                {s}
              </Badge>
            ))}
            {subjects.length > 4 && (
              <Badge variant="secondary" className="font-normal text-[11px] bg-muted text-muted-foreground">+{subjects.length - 4}</Badge>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">No subjects assigned</div>
        )}
      </div>

      {/* Email + classes */}
      {(t.email || (Array.isArray(t.classes) && t.classes.length > 0)) && (
        <div className="mt-3 text-[11px] text-muted-foreground space-y-0.5">
          {t.email && <div className="truncate" title={t.email}>✉ {t.email}</div>}
          {Array.isArray(t.classes) && t.classes.length > 0 && (
            <div className="truncate">🏫 {t.classes.join(', ')}</div>
          )}
        </div>
      )}

      {/* Password reveal */}
      {showPass && (
        <div className="mt-3 px-2.5 py-1.5 rounded-md bg-accent border border-border text-xs flex items-center gap-2">
          <span className="text-muted-foreground">Password:</span>
          <span className="font-mono font-semibold text-primary">{pass}</span>
          {mustChange && <span className="text-amber-600">· must change</span>}
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto pt-4 flex items-center gap-1.5 flex-wrap">
        <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs" onClick={viewPassword} disabled={busy} title="View password">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
          <span className="ml-1 hidden sm:inline">View</span>
        </Button>
        <Button size="sm" className="h-8 px-2.5 text-xs bg-primary hover:bg-primary/90 text-white" onClick={onAssignCourses} title="Assign courses">
          <BookCheck className="h-3.5 w-3.5" />
          <span className="ml-1 hidden sm:inline">Courses</span>
        </Button>
        <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs" onClick={() => setShowEdit(true)} title="Edit">
          <Edit className="h-3.5 w-3.5" />
          <span className="ml-1 hidden sm:inline">Edit</span>
        </Button>
        <Button size="sm" variant="outline" className={`h-8 px-2.5 text-xs ${isBlocked ? 'text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700' : 'text-rose-600 hover:bg-rose-500/10 hover:text-rose-600'}`} onClick={toggleBlock} disabled={busy} title={isBlocked ? 'Unblock' : 'Block'}>
          {isBlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          <span className="ml-1 hidden sm:inline">{isBlocked ? 'Unblock' : 'Block'}</span>
        </Button>
      </div>

      {showEdit && <EditUserModal u={t} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onRefresh(); }} />}
    </Card>
  );
}

function StudentsView({ students, onAdd, onRefresh }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Students" subtitle={`${students.length} students in your branch`}
        actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={onAdd}><Plus className="h-4 w-4 mr-1.5" /> Add Student</Button>} />
      {students.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No students yet" desc="Add your first student. A login will be auto-created so they (or their parents) can sign in to their portal."
          action={<Button className="bg-primary hover:bg-primary/90 text-white" onClick={onAdd}><Plus className="h-4 w-4 mr-1.5" /> Add Student</Button>} />
      ) : (
        <Card className="p-4">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead className="hidden sm:table-cell">Roll No</TableHead><TableHead className="hidden md:table-cell">Guardian</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {students.map((s:any) => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell><div className="font-medium text-sm">{s.name}</div><div className="text-[11px] text-muted-foreground">{s.email || '—'}</div></TableCell>
                  <TableCell><Badge variant="outline" className="font-normal">{s.class}{s.section ? ` · ${s.section}` : ''}</Badge></TableCell>
                  <TableCell className="hidden sm:table-cell font-mono text-sm">{s.rollNo || '—'}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{s.guardian || '—'}</TableCell>
                  <TableCell><Badge variant="outline" className={s.blocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]'}>{s.blocked ? 'Blocked' : (s.status || 'Active')}</Badge></TableCell>
                  <TableCell className="text-right"><UserRowActions u={s} onRefresh={onRefresh} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ============ Class & Course Management ============
// Extract the numeric portion of a class name (e.g. "Class 5" → 5, "Class 12" → 12) for sorting.
function classNumber(name: string): number {
  const m = String(name || '').match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

type ClassGroup = { name: string; primary: any; sections: any[] };

function groupClassesByName(rows: any[]): ClassGroup[] {
  const map: Record<string, any[]> = {};
  for (const c of rows) {
    const key = c.name || 'Class';
    if (!map[key]) map[key] = [];
    map[key].push(c);
  }
  return Object.entries(map).map(([name, sections]) => {
    const sorted = [...sections].sort((a, b) => (a.section || 'A').localeCompare(b.section || 'A'));
    return { name, primary: sorted[0], sections: sorted };
  }).sort((a, b) => classNumber(a.name) - classNumber(b.name));
}

function ClassCoursesView({ user }: { user: any }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClassName, setActiveClassName] = useState<string>('');
  const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAssignCourses, setShowAssignCourses] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: '', code: '' });
  const [creating, setCreating] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionLetter, setNewSectionLetter] = useState('');
  const [creatingSection, setCreatingSection] = useState(false);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      api.getClasses(user.branchId).then(r => Array.isArray(r) ? r : []).catch(() => []),
      api.getCourses({ branchId: user.branchId }).then(r => Array.isArray(r) ? r : []).catch(() => []),
      api.platformUsers({ branchId: user.branchId, role: 'student' }).then(r => Array.isArray(r) ? r : []).catch(() => []),
    ]).then(([cls, crs, stu]) => {
      setClasses(cls);
      setAllCourses(crs);
      setStudents(stu);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [user.branchId]);

  // When the active class changes, fetch its assigned courses (uses the primary section's classId).
  useEffect(() => {
    if (!activeClassName) { setAssignedCourseIds([]); return; }
    const groups = groupClassesByName(classes);
    const grp = groups.find(g => g.name === activeClassName);
    if (!grp) { setAssignedCourseIds([]); return; }
    let cancelled = false;
    setLoadingAssigned(true);
    api.getCourses({ classId: grp.primary.id })
      .then(r => { if (!cancelled) setAssignedCourseIds((Array.isArray(r) ? r : []).map((c: any) => c.id)); })
      .catch(() => { if (!cancelled) setAssignedCourseIds([]); })
      .finally(() => { if (!cancelled) setLoadingAssigned(false); });
    return () => { cancelled = true; };
  }, [activeClassName, classes]);

  const grouped = groupClassesByName(classes);
  const activeGroup = grouped.find(g => g.name === activeClassName) || null;

  const toggleCourse = (id: string) => {
    setAssignedCourseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const saveAssignment = async () => {
    if (!activeGroup) return;
    setSaving(true);
    try {
      // Assign to the primary (section A) class row. Sections created later will inherit these courses.
      await api.assignClassCourses(activeGroup.primary.id, assignedCourseIds);
      toast({ title: 'Courses assigned', description: `${assignedCourseIds.length} course(s) linked to ${activeGroup.name}` });
      setShowAssignCourses(false);
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const createCourse = async () => {
    if (!newCourse.name) { toast({ title: 'Course name required', variant: 'destructive' }); return; }
    setCreating(true);
    try {
      const res = await api.createCourse({ name: newCourse.name, code: newCourse.code, branchId: user.branchId });
      toast({ title: 'Course created', description: `${res.name} is now available to assign` });
      setNewCourse({ name: '', code: '' });
      setShowCreateCourse(false);
      refresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setCreating(false); }
  };

  const createSection = async () => {
    if (!activeGroup) return;
    setCreatingSection(true);
    try {
      const letter = newSectionLetter.trim().toUpperCase();
      const res = await api.createClassSection(activeGroup.primary.id, letter || undefined);
      toast({ title: 'Section created', description: `${activeGroup.name} ${res.section} is now available` });
      setNewSectionLetter('');
      setShowAddSection(false);
      refresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setCreatingSection(false); }
  };

  const deleteSection = async (classId: string, label: string) => {
    if (!confirm(`Delete section ${label}? This cannot be undone.`)) return;
    try {
      await api.deleteClassSection(classId);
      toast({ title: 'Section deleted', description: `${label} was removed` });
      refresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };

  const studentsInSection = (className: string, section: string) =>
    students.filter(s => s.class === className && (s.section || 'A') === (section || 'A'));

  // -------- Detail view (one class selected) --------
  if (activeGroup) {
    const assignedCourses = allCourses.filter(c => assignedCourseIds.includes(c.id));
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <button onClick={() => { setActiveClassName(''); setShowAssignCourses(false); setShowCreateCourse(false); setShowAddSection(false); }}
              className="mt-1 h-9 w-9 grid place-items-center rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition"
              title="Back to all classes">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </button>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> {activeGroup.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {activeGroup.sections.length} section{activeGroup.sections.length === 1 ? '' : 's'} · {assignedCourses.length} course{assignedCourses.length === 1 ? '' : 's'} assigned
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setShowCreateCourse(v => !v)}><BookCopy className="h-4 w-4 mr-1.5" /> New Course</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowAssignCourses(v => !v)}><CheckCircle2 className="h-4 w-4 mr-1.5" /> {showAssignCourses ? 'Hide Course List' : 'Assign Courses'}</Button>
          </div>
        </div>

        {/* Create course form (collapsible) */}
        {showCreateCourse && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><BookCopy className="h-4 w-4 text-primary" /><h3 className="font-bold text-base">Create New Course</h3></div>
            <div className="grid sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2"><Label>Course name *</Label><Input value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} placeholder="e.g. Mathematics" className="mt-1" /></div>
              <div><Label>Code</Label><Input value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} placeholder="e.g. MATH-101" className="mt-1" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={creating} onClick={createCourse}>{creating ? 'Creating…' : 'Create Course'}</Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreateCourse(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        {/* Assigned courses + assign checklist */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Assigned Courses</h3>
              <p className="text-xs text-muted-foreground mt-0.5">These courses are taught in {activeGroup.name}. New sections inherit this list automatically.</p>
            </div>
            <Badge variant="outline" className="text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]">{assignedCourseIds.length} assigned</Badge>
          </div>

          {loadingAssigned ? (
            <div className="text-sm text-muted-foreground py-4 text-center">Loading assigned courses…</div>
          ) : assignedCourses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[oklch(0.6_0.04_260)] dark:border-blue-700 bg-accent dark:bg-[oklch(0.12_0.03_260)_/_0.4] px-4 py-4 text-sm text-primary dark:text-[oklch(0.8_0.03_260)]">
              <strong>No courses assigned yet.</strong> Click <em>Assign Courses</em> above to select the subjects taught in this class. You must assign courses before you can add teachers for this class.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignedCourses.map(c => (
                <Badge key={c.id} variant="secondary" className="px-3 py-1.5 font-normal text-sm bg-accent0/10 text-primary dark:text-primary/70 border border-[oklch(0.5_0.04_260)_/_0.2]">
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" /> {c.name}{c.code ? <span className="ml-1.5 text-[10px] uppercase opacity-70">{c.code}</span> : null}
                </Badge>
              ))}
            </div>
          )}

          {showAssignCourses && (
            <div className="mt-5 pt-5 border-t border-border/40">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">All branch courses — toggle to assign</h4>
                <span className="text-xs text-muted-foreground">{assignedCourseIds.length} of {allCourses.length} selected</span>
              </div>
              {allCourses.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No courses created in this branch yet. <button onClick={() => setShowCreateCourse(true)} className="text-primary hover:underline font-medium">Create one now</button>.
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto scroll-fancy pr-1">
                    {allCourses.map(c => {
                      const checked = assignedCourseIds.includes(c.id);
                      return (
                        <button key={c.id} type="button" onClick={() => toggleCourse(c.id)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition ${
                            checked ? 'border-[oklch(0.5_0.04_260)_/_0.4] bg-accent0/10' : 'border-border bg-background hover:bg-muted/50'
                          }`}>
                          <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-primary border-blue-700' : 'border-input bg-background'}`}>
                            {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm font-medium truncate ${checked ? 'text-primary dark:text-primary/70' : ''}`}>{c.name}</div>
                            {c.code && <div className="text-[10px] text-muted-foreground uppercase">{c.code}</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end mt-4 pt-3 border-t border-border/40 gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAssignCourses(false)}>Cancel</Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={saving} onClick={saveAssignment}>
                      {saving ? 'Saving…' : 'Save Assignment'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>

        {/* Sections */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2"><Network className="h-4 w-4 text-primary" /> Sections</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Each section can have its own students. New sections inherit this class's course list.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAddSection(v => !v)}><Plus className="h-4 w-4 mr-1.5" /> Add Section</Button>
          </div>

          {showAddSection && (
            <div className="mb-4 rounded-lg border border-[oklch(0.5_0.04_260)_/_0.3] bg-accent0/5 p-4">
              <div className="grid sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <Label>Section letter (optional)</Label>
                  <Input value={newSectionLetter} onChange={e => setNewSectionLetter(e.target.value)} placeholder="e.g. C — leave blank for the next available letter" className="mt-1" maxLength={2} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={creatingSection} onClick={createSection}>{creatingSection ? 'Creating…' : 'Create Section'}</Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowAddSection(false); setNewSectionLetter(''); }}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeGroup.sections.map(sec => {
              const secStudents = studentsInSection(activeGroup.name, sec.section);
              const canDelete = activeGroup.sections.length > 1 && secStudents.length === 0;
              return (
                <div key={sec.id} className="rounded-xl border border-border bg-card p-4 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-primary grid place-items-center text-white font-bold">{(sec.section || 'A').toUpperCase()}</div>
                      <div>
                        <div className="font-bold text-sm">{activeGroup.name} {(sec.section || 'A').toUpperCase()}</div>
                        <div className="text-[11px] text-muted-foreground">{secStudents.length} student{secStudents.length === 1 ? '' : 's'}</div>
                      </div>
                    </div>
                    {canDelete && (
                      <button onClick={() => deleteSection(sec.id, `${activeGroup.name} ${sec.section}`)} title="Delete this section" className="h-8 w-8 grid place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex-1 min-h-0">
                    {secStudents.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border/60 rounded-lg">No students assigned</div>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto scroll-fancy">
                        {secStudents.map(s => (
                          <div key={s.id} className="flex items-center gap-2 text-xs">
                            <div className="h-6 w-6 rounded-full bg-accent0/15 grid place-items-center text-primary"><GraduationCap className="h-3 w-3" /></div>
                            <div className="min-w-0 flex-1"><div className="font-medium truncate">{s.name}</div></div>
                            <div className="font-mono text-[10px] text-muted-foreground">{s.rollNo}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  // -------- Grid view (no class selected) --------
  return (
    <div className="space-y-6">
      <ModuleHeader title="Classes & Courses" subtitle="Click a class to manage its courses and sections"
        actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowCreateCourse(v => !v)}><BookCopy className="h-4 w-4 mr-1.5" /> New Course</Button>} />

      {showCreateCourse && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3"><BookCopy className="h-4 w-4 text-primary" /><h3 className="font-bold text-base">Create New Course</h3></div>
          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2"><Label>Course name *</Label><Input value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} placeholder="e.g. Mathematics" className="mt-1" /></div>
            <div><Label>Code</Label><Input value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} placeholder="e.g. MATH-101" className="mt-1" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={creating} onClick={createCourse}>{creating ? 'Creating…' : 'Create Course'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreateCourse(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Loading classes…</Card>
      ) : grouped.length === 0 ? (
        <EmptyState icon={BookOpen} title="No classes found" desc="Classes (Class 1 – Class 12) are auto-created when your branch is provisioned. If you don't see them, ask your Institute Admin." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {grouped.map((g, idx) => {
            const studentCount = g.sections.reduce((acc: number, s: any) => acc + studentsInSection(g.name, s.section).length, 0);
            return (
              <button key={g.name} onClick={() => { setActiveClassName(g.name); setShowCreateCourse(false); }}
                className="text-left p-4 rounded-xl border border-border bg-card hover:border-[oklch(0.5_0.04_260)_/_0.4] hover:bg-muted/40 hover:shadow-md transition group">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center text-primary font-bold">
                    {classNumber(g.name) || (idx + 1)}
                  </div>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">{g.sections.length} sec{g.sections.length === 1 ? '' : 's'}</Badge>
                </div>
                <div className="mt-3 font-bold text-sm">{g.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{studentCount} student{studentCount === 1 ? '' : 's'} enrolled</div>
                <div className="mt-2 text-[11px] text-primary dark:text-[oklch(0.6_0.04_260)] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <BookOpen className="h-3 w-3" /> Click to manage
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ Announcements ============
function AnnouncementsView({ user }: { user: any }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', message: '', targetScope: 'all', selectedClasses: [] as string[] });
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const refresh = () => {
    api.getAnnouncements().then(r => setAnnouncements(Array.isArray(r) ? r : [])).catch(() => {});
    api.getClasses(user.branchId).then(r => setClasses(Array.isArray(r) ? r : [])).catch(() => {});
  };
  useEffect(() => { refresh(); }, [user.branchId]);

  const send = async () => {
    if (!form.title || !form.message) { toast({ title: 'Title and message required', variant: 'destructive' }); return; }
    setSending(true);
    try {
      const body: any = {
        title: form.title,
        message: form.message,
        targetScope: form.targetScope,
        targetRole: 'student',
      };
      if (form.targetScope === 'specific') {
        body.targetIds = form.selectedClasses;
        // Also pass the first classId for filtering convenience
        if (form.selectedClasses.length > 0) body.classId = form.selectedClasses[0];
      }
      await api.createAnnouncement(body);
      toast({ title: 'Announcement sent!', description: form.targetScope === 'all' ? 'Sent to all classes' : `Sent to ${form.selectedClasses.length} class(es)` });
      setForm({ title: '', message: '', targetScope: 'all', selectedClasses: [] });
      setShowForm(false);
      refresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Announcements" subtitle="Send messages to all classes or specific ones"
        actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowForm(v => !v)}><Megaphone className="h-4 w-4 mr-1.5" /> New Announcement</Button>} />

      {showForm && (
        <Card className="p-5">
          <h3 className="font-bold text-base mb-4">New Announcement</h3>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Annual exams schedule" className="mt-1" /></div>
            <div><Label>Message</Label><Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Type your announcement…" className="mt-1 resize-none" /></div>
            <div>
              <Label>Recipients</Label>
              <Select value={form.targetScope} onValueChange={v => setForm({ ...form, targetScope: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="specific">Specific Classes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.targetScope === 'specific' && (
              <div>
                <Label>Select Classes</Label>
                <div className="mt-2 max-h-48 overflow-y-auto scroll-fancy space-y-1.5 border border-border/60 rounded-lg p-3">
                  {classes.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-3">No classes available in your branch.</div>
                  ) : classes.map(cls => (
                    <label key={cls.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-accent">
                      <input type="checkbox" checked={form.selectedClasses.includes(cls.id)} onChange={e => {
                        if (e.target.checked) setForm({ ...form, selectedClasses: [...form.selectedClasses, cls.id] });
                        else setForm({ ...form, selectedClasses: form.selectedClasses.filter((id: string) => id !== cls.id) });
                      }} className="w-4 h-4 rounded" />
                      <span className="text-sm">{cls.name}{cls.section ? ` · ${cls.section}` : ''}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={sending} onClick={send}>{sending ? 'Sending…' : <><Send className="h-4 w-4 mr-1.5" /> Send Announcement</>}</Button>
          </div>
        </Card>
      )}

      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" desc="Send messages to all or specific classes in your branch."
          action={<Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowForm(true)}><Megaphone className="h-4 w-4 mr-1.5" /> New Announcement</Button>} />
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-rose-500" />
                  <div className="font-medium text-sm">{a.title}</div>
                </div>
                <span className="text-[11px] text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">{a.message}</p>
              <div className="text-[11px] text-muted-foreground mt-2 ml-6">
                To: {a.targetScope === 'all' ? 'All Classes' : `Specific Classes${a.targetIds ? ` (${JSON.parse(a.targetIds).length})` : ''}`}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Fee Management ============
const FEE_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmtPKR = (n: number) => 'Rs. ' + (Number(n) || 0).toLocaleString('en-PK');

function FeeManagement({ user }: { user: any }) {
  const [tab, setTab] = useState<'structure' | 'invoices'>('structure');
  const tabs = [
    { id: 'structure' as const, label: 'Fee Structure', icon: BookOpen },
    { id: 'invoices' as const, label: 'Invoices', icon: FileText },
  ];
  return (
    <div className="space-y-6">
      <ModuleHeader title="Fee Management" subtitle={`Set class fees and generate monthly invoices · ${user?.branchName || ''}`} />
      <div className="flex gap-1 p-1 rounded-xl bg-muted/60 overflow-x-auto scroll-fancy max-w-md">
        {tabs.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'structure' && <FeeStructureTab user={user} />}
      {tab === 'invoices' && <FeeInvoicesTab user={user} />}
    </div>
  );
}

function FeeStructureTab({ user }: { user: any }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [structure, setStructure] = useState<Record<string, any>>({});
  const [edits, setEdits] = useState<Record<string, { monthly: string; admission: string }>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      api.getClasses(user.branchId).then(r => Array.isArray(r) ? r : []).catch(() => []),
      api.getFeeStructure().then(r => Array.isArray(r) ? r : []).catch(() => []),
    ]).then(([cls, struct]) => {
      setClasses(cls);
      const map: Record<string, any> = {};
      for (const s of struct) map[s.classId] = s;
      setStructure(map);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [user?.branchId]);

  // Group class sections by name — one fee entry per class group (uses the primary section's classId)
  const grouped = useMemo(() => {
    const map: Record<string, any> = {};
    for (const c of classes) {
      const key = c.name || 'Class';
      if (!map[key]) map[key] = c; // first section wins (sections are usually sorted A → Z)
    }
    return Object.values(map).sort((a: any, b: any) => classNumber(a.name) - classNumber(b.name));
  }, [classes]);

  const getEdits = (cls: any) => {
    const existing = structure[cls.id];
    const e = edits[cls.id];
    return {
      monthly: e?.monthly ?? (existing?.monthlyFee != null ? String(existing.monthlyFee) : ''),
      admission: e?.admission ?? (existing?.admissionFee != null ? String(existing.admissionFee) : ''),
    };
  };

  const save = async (cls: any) => {
    const { monthly, admission } = getEdits(cls);
    const monthlyNum = Number(monthly);
    if (!monthlyNum || monthlyNum <= 0) {
      toast({ title: 'Invalid amount', description: 'Enter a valid monthly fee greater than 0.', variant: 'destructive' });
      return;
    }
    setSavingId(cls.id);
    try {
      await api.setFeeStructure(cls.id, monthlyNum, admission ? Number(admission) : undefined);
      toast({ title: 'Fee saved', description: `${cls.name} monthly fee set to ${fmtPKR(monthlyNum)}` });
      refresh();
    } catch (e: any) { toast({ title: 'Failed to save', description: e.message, variant: 'destructive' }); }
    finally { setSavingId(null); }
  };

  if (loading) {
    return <Card className="p-10 text-center text-sm text-muted-foreground">Loading fee structure…</Card>;
  }

  if (grouped.length === 0) {
    return <EmptyState icon={DollarSign} title="No classes found" desc="Classes (Class 1 – Class 12) are auto-created when your branch is provisioned. Ask your Institute Admin if you don't see them." />;
  }

  // Summary stats
  const setCount = grouped.filter(g => structure[g.id]?.monthlyFee != null).length;
  const avgMonthly = setCount > 0
    ? Math.round(grouped.reduce((acc, g) => acc + (Number(structure[g.id]?.monthlyFee) || 0), 0) / setCount)
    : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total Classes</div>
          <div className="text-2xl font-extrabold mt-1">{grouped.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Fees Configured</div>
          <div className="text-2xl font-extrabold mt-1 text-primary">{setCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Avg Monthly Fee</div>
          <div className="text-2xl font-extrabold mt-1">{fmtPKR(avgMonthly)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Pending Setup</div>
          <div className="text-2xl font-extrabold mt-1 text-sky-700">{grouped.length - setCount}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-base">Monthly Fee Structure</h3>
          <span className="text-xs text-muted-foreground ml-1">Edit each class's monthly fee and save.</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {grouped.map((cls: any) => {
            const e = getEdits(cls);
            const isSaving = savingId === cls.id;
            const isSet = structure[cls.id]?.monthlyFee != null;
            return (
              <div key={cls.id} className={`p-4 rounded-xl border ${isSet ? 'border-[oklch(0.5_0.04_260)_/_0.3] bg-accent0/5' : 'border-dashed border-border'} hover:shadow-sm transition`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary font-bold text-xs">
                      {classNumber(cls.name) || '—'}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{cls.name}</div>
                      <div className="text-[10px] text-muted-foreground">{isSet ? 'Configured' : 'Not set'}</div>
                    </div>
                  </div>
                  {isSet && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <div className="space-y-2">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Monthly Fee (Rs.)</Label>
                    <div className="relative mt-0.5">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">Rs.</span>
                      <Input
                        type="number"
                        value={e.monthly}
                        onChange={ev => setEdits(prev => ({ ...prev, [cls.id]: { ...e, monthly: ev.target.value } }))}
                        placeholder="0"
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Admission Fee (Rs.)</Label>
                    <div className="relative mt-0.5">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">Rs.</span>
                      <Input
                        type="number"
                        value={e.admission}
                        onChange={ev => setEdits(prev => ({ ...prev, [cls.id]: { ...e, admission: ev.target.value } }))}
                        placeholder="0"
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isSaving} onClick={() => save(cls)}>
                    {isSaving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving…</> : <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Save</>}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function FeeInvoicesTab({ user }: { user: any }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genMonth, setGenMonth] = useState<string>(FEE_MONTHS[new Date().getMonth()]);
  const [genYear, setGenYear] = useState<string>(String(new Date().getFullYear()));
  const [payingId, setPayingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const refresh = () => {
    setLoading(true);
    api.getBranchInvoices()
      .then(r => setInvoices(Array.isArray(r) ? r : []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const generate = async () => {
    if (!genMonth || !genYear) { toast({ title: 'Month and year required', variant: 'destructive' }); return; }
    setGenerating(true);
    try {
      const res = await api.generateInvoices(genMonth, Number(genYear));
      const created = res?.generated ?? res?.created ?? res?.count ?? (Array.isArray(res?.invoices) ? res.invoices.length : null);
      toast({ title: 'Invoices generated', description: created != null ? `${created} invoice(s) created for ${genMonth} ${genYear}` : (res?.message || `Invoices for ${genMonth} ${genYear} generated`) });
      setShowGenerate(false);
      refresh();
    } catch (e: any) { toast({ title: 'Failed to generate', description: e.message, variant: 'destructive' }); }
    finally { setGenerating(false); }
  };

  const markPaid = async (inv: any) => {
    setPayingId(inv.id);
    try {
      await api.markInvoicePaid(inv.id, Number(inv.amount) || 0, 'Cash');
      toast({ title: 'Invoice paid', description: `${inv.studentName}'s ${inv.month} invoice marked as paid` });
      refresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setPayingId(null); }
  };

  const filtered = invoices.filter(inv => {
    if (filter === 'paid') return String(inv.status).toLowerCase() === 'paid';
    if (filter === 'unpaid') return String(inv.status).toLowerCase() !== 'paid';
    return true;
  });

  const stats = useMemo(() => {
    const total = invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const paid = invoices.filter(i => String(i.status).toLowerCase() === 'paid').reduce((acc, i) => acc + (Number(i.paidAmount || i.amount) || 0), 0);
    const pending = total - paid;
    return { total, paid, pending, count: invoices.length };
  }, [invoices]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total Invoices</div>
          <div className="text-2xl font-extrabold mt-1">{stats.count}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Collected</div>
          <div className="text-xl font-extrabold mt-1 text-primary">{fmtPKR(stats.paid)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Pending</div>
          <div className="text-xl font-extrabold mt-1 text-rose-600">{fmtPKR(stats.pending)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total Amount</div>
          <div className="text-xl font-extrabold mt-1">{fmtPKR(stats.total)}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-base">Branch Invoices</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1 p-1 rounded-lg bg-muted/60 text-xs">
              {([['all', 'All'], ['unpaid', 'Unpaid'], ['paid', 'Paid']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setFilter(id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${filter === id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {label}
                </button>
              ))}
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowGenerate(v => !v)}>
              <Plus className="h-4 w-4 mr-1.5" /> Generate Invoices
            </Button>
          </div>
        </div>

        {showGenerate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden mb-4">
            <div className="p-4 rounded-xl border border-[oklch(0.5_0.04_260)_/_0.3] bg-accent0/5">
              <div className="flex items-center gap-2 mb-3"><Banknote className="h-4 w-4 text-primary" /><span className="font-bold text-sm">Generate Monthly Invoices</span></div>
              <p className="text-xs text-muted-foreground mb-3">This creates one invoice per active student for the selected month and year, based on their class's monthly fee.</p>
              <div className="grid sm:grid-cols-3 gap-3 items-end">
                <div>
                  <Label className="text-xs">Month</Label>
                  <Select value={genMonth} onValueChange={setGenMonth}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select month" /></SelectTrigger>
                    <SelectContent>
                      {FEE_MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Year</Label>
                  <Input type="number" value={genYear} onChange={e => setGenYear(e.target.value)} className="mt-1" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={generating} onClick={generate}>
                    {generating ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating…</> : 'Generate'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="text-center py-10 text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <div className="inline-flex h-12 w-12 rounded-xl bg-muted/60 items-center justify-center mb-3"><FileText className="h-4 w-4 text-muted-foreground" /></div>
            <div className="font-bold text-sm">{invoices.length === 0 ? 'No invoices yet' : 'No invoices match this filter'}</div>
            <div className="text-xs text-muted-foreground mt-1">{invoices.length === 0 ? 'Click "Generate Invoices" to create monthly invoices for all students.' : 'Try changing the filter above.'}</div>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto scroll-fancy -mx-4 px-4">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40 sticky top-0">
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map(inv => {
                  const isPaid = String(inv.status).toLowerCase() === 'paid';
                  return (
                    <TableRow key={inv.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-medium text-sm">{inv.studentName || '—'}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{inv.challanNo || inv.id?.slice(-8)}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="font-normal text-[11px]">{inv.className || '—'}</Badge></TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{inv.month || '—'}{inv.year ? ` ${inv.year}` : ''}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{fmtPKR(Number(inv.amount) || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={isPaid ? 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.3]' : 'text-rose-700 bg-rose-500/10 border-rose-500/30'}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </Badge>
                        {isPaid && inv.paidDate && <div className="text-[10px] text-muted-foreground mt-0.5">{inv.paidDate}</div>}
                      </TableCell>
                      <TableCell className="text-right">
                        {isPaid ? (
                          <span className="text-[11px] text-primary inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Settled</span>
                        ) : (
                          <Button size="sm" variant="outline" className="h-8 text-xs border-[oklch(0.5_0.04_260)_/_0.4] text-primary hover:bg-accent0/10" disabled={payingId === inv.id} onClick={() => markPaid(inv)}>
                            {payingId === inv.id ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Marking…</> : 'Mark Paid'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

function ScopedBranchModule({ activeModule, user, stats }: any) {
  const titles: Record<string,string> = {
    attendance:'Attendance', results:'Results', timetable:'Timetable', fees:'Fees',
    complaints:'Complaints', events:'Events', sms:'SMS Portal',
  };
  return (
    <div className="space-y-6">
      <ModuleHeader title={titles[activeModule] || activeModule} subtitle={`Scoped to ${user?.branchName}`} />
      <EmptyState icon={Inbox} title="No records yet" desc="Records for this module are created by teachers and staff in your branch. Once they start using their portals, data will appear here." />
    </div>
  );
}

// ============ Branch Manager — Attendance View ============
function BMAttendanceView({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = () => {
    if (!user?.branchId) return;
    Promise.all([
      api.getAttendance().then(r => Array.isArray(r) ? r : []).catch(() => []),
      api.platformUsers({ branchId: user.branchId, role: 'student' }).then(r => Array.isArray(r) ? r : []).catch(() => []),
    ]).then(([att, stu]) => {
      setStudents(stu);
      const studentIds = new Set(stu.map((s: any) => s.id));
      // Keep only sessions for this branch OR sessions that include at least one of our students
      const branchSessions = att.filter((a: any) =>
        a.branchId === user.branchId ||
        (Array.isArray(a.records) && a.records.some((r: any) => studentIds.has(r.studentId)))
      );
      setSessions(branchSessions);
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { refresh(); }, [user?.branchId]);

  const stats = useMemo(() => {
    let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalRecords = 0;
    const studentStats: Record<string, { name: string; class?: string; rollNo?: string; absences: number }> = {};
    for (const s of sessions) {
      for (const r of (Array.isArray(s.records) ? s.records : [])) {
        const stu = students.find(x => x.id === r.studentId);
        if (!stu) continue;
        if (!studentStats[r.studentId]) studentStats[r.studentId] = { name: stu.name, class: stu.class, rollNo: stu.rollNo, absences: 0 };
        if (r.status === 'Present') totalPresent++;
        else if (r.status === 'Absent') { totalAbsent++; studentStats[r.studentId].absences++; }
        else if (r.status === 'Late') totalLate++;
        totalRecords++;
      }
    }
    const avgRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
    const mostAbsentArr = Object.values(studentStats).sort((a, b) => b.absences - a.absences);
    return { totalPresent, totalAbsent, totalLate, totalRecords, avgRate, mostAbsent: mostAbsentArr[0] };
  }, [sessions, students]);

  const kpis = [
    { label: 'Total Sessions', value: String(sessions.length), sub: `${stats.totalRecords} student records`, icon: CalendarCheck, rose: false },
    { label: 'Average Attendance Rate', value: stats.avgRate + '%', sub: `${stats.totalPresent} present · ${stats.totalAbsent} absent · ${stats.totalLate} late`, icon: CheckCircle2, rose: false },
    { label: 'Most Absent Student', value: stats.mostAbsent?.name || '—', sub: stats.mostAbsent ? `${stats.mostAbsent.absences} absence(s)${stats.mostAbsent.class ? ` · ${stats.mostAbsent.class}` : ''}` : 'No absences recorded', icon: AlertCircle, rose: stats.mostAbsent?.absences > 0 },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <ModuleHeader title="Attendance" subtitle={`Attendance sessions recorded in your branch · ${user?.branchName || ''}`} />
        <Card className="p-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading attendance…
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader title="Attendance" subtitle={`Attendance sessions recorded in your branch · ${user?.branchName || ''}`} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border border-border rounded-lg shadow-sm p-3 sm:p-4">
            <div className={`h-10 w-10 rounded-lg grid place-items-center mb-3 ${k.rose ? 'bg-rose-500/10' : 'bg-primary/10'}`}>
              <k.icon className={`h-4 w-4 ${k.rose ? 'text-rose-600' : 'text-primary'}`} />
            </div>
            <div className="text-xl font-extrabold tabular-nums leading-tight truncate">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
            {k.sub && <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>}
          </Card>
        ))}
      </div>

      {sessions.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No attendance recorded yet" desc="Once teachers start marking attendance from their portal, session summaries will appear here." />
      ) : (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-base">Attendance Sessions</h3>
            <span className="text-xs text-muted-foreground ml-1">{sessions.length} session(s)</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto scroll-fancy -mx-4 px-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 sticky top-0">
                  <TableHead className="w-10" />
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Absent</TableHead>
                  <TableHead className="text-right">Late</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s: any) => {
                  const records = Array.isArray(s.records) ? s.records : [];
                  const present = records.filter((r: any) => r.status === 'Present').length;
                  const absent = records.filter((r: any) => r.status === 'Absent').length;
                  const late = records.filter((r: any) => r.status === 'Late').length;
                  const rate = records.length > 0 ? Math.round((present / records.length) * 100) : 0;
                  const isOpen = expanded === s.id;
                  const firstStu = students.find((x: any) => x.id === records[0]?.studentId);
                  return (
                    <Fragment key={s.id}>
                      <TableRow className="hover:bg-muted/30 cursor-pointer" onClick={() => setExpanded(isOpen ? null : s.id)}>
                        <TableCell className="text-muted-foreground">
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{s.date ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</TableCell>
                        <TableCell><Badge variant="outline" className="font-normal">{firstStu?.class || '—'}</Badge></TableCell>
                        <TableCell className="text-right font-mono text-sm">{records.length}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-emerald-700">{present}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-rose-600">{absent}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-amber-700">{late}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={`font-mono ${rate >= 75 ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20' : rate >= 50 ? 'text-amber-700 bg-amber-500/10 border-amber-500/20' : 'text-rose-600 bg-rose-500/10 border-rose-500/20'}`}>{rate}%</Badge>
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell />
                          <TableCell colSpan={7}>
                            <div className="py-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {records.map((r: any, i: number) => {
                                const stu = students.find((x: any) => x.id === r.studentId);
                                const tone = r.status === 'Present' ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20'
                                  : r.status === 'Absent' ? 'text-rose-600 bg-rose-500/10 border-rose-500/20'
                                  : 'text-amber-700 bg-amber-500/10 border-amber-500/20';
                                return (
                                  <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
                                    <div className="min-w-0">
                                      <div className="font-medium text-sm truncate">{stu?.name || 'Unknown student'}</div>
                                      <div className="text-[10px] text-muted-foreground">{stu?.class || '—'}{stu?.section ? ` · ${stu.section}` : ''}{stu?.rollNo ? ` · ${stu.rollNo}` : ''}</div>
                                    </div>
                                    <Badge variant="outline" className={`text-[10px] ${tone}`}>{r.status}</Badge>
                                  </div>
                                );
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============ Branch Manager — Results View ============
function BMResultsView({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = () => {
    if (!user?.branchId) return;
    Promise.all([
      api.getResults().then(r => Array.isArray(r) ? r : []).catch(() => []),
      api.platformUsers({ branchId: user.branchId, role: 'student' }).then(r => Array.isArray(r) ? r : []).catch(() => []),
      api.getCourses({ branchId: user.branchId }).then(r => Array.isArray(r) ? r : []).catch(() => []),
    ]).then(([res, stu, crs]) => {
      setStudents(stu);
      setCourses(crs);
      // Filter to results posted in this branch
      const branchResults = res.filter((r: any) => r.branchId === user.branchId);
      setResults(branchResults);
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { refresh(); }, [user?.branchId]);

  const stats = useMemo(() => {
    let totalMarksSum = 0, marksObtainedSum = 0, evaluatedStudents = new Set<string>();
    for (const r of results) {
      const records = Array.isArray(r.records) ? r.records : [];
      for (const rec of records) {
        evaluatedStudents.add(rec.studentId);
        totalMarksSum += Number(r.totalMarks) || 0;
        marksObtainedSum += Number(rec.marks) || 0;
      }
    }
    const avgScore = totalMarksSum > 0 ? Math.round((marksObtainedSum / totalMarksSum) * 100) : 0;
    return { totalExams: results.length, evaluatedCount: evaluatedStudents.size, avgScore };
  }, [results]);

  const courseName = (id?: string) => courses.find((c: any) => c.id === id)?.name || '—';

  const kpis = [
    { label: 'Total Exams', value: String(stats.totalExams), sub: 'Exams posted by teachers', icon: GraduationCap, rose: false },
    { label: 'Students Evaluated', value: String(stats.evaluatedCount), sub: 'Unique students with marks', icon: Users, rose: false },
    { label: 'Average Score', value: stats.avgScore + '%', sub: 'Across all posted exams', icon: CheckCircle2, rose: false },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <ModuleHeader title="Results" subtitle={`Exam results posted by your teachers · ${user?.branchName || ''}`} />
        <Card className="p-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading results…
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader title="Results" subtitle={`Exam results posted by your teachers · ${user?.branchName || ''}`} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border border-border rounded-lg shadow-sm p-3 sm:p-4">
            <div className="h-10 w-10 rounded-lg grid place-items-center mb-3 bg-primary/10">
              <k.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-extrabold tabular-nums leading-tight">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
            {k.sub && <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>}
          </Card>
        ))}
      </div>

      {results.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No results posted yet" desc="When teachers post exam results from their portal, they will appear here with student-by-student marks." />
      ) : (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-base">Posted Exams</h3>
            <span className="text-xs text-muted-foreground ml-1">{results.length} exam(s)</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto scroll-fancy -mx-4 px-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 sticky top-0">
                  <TableHead className="w-10" />
                  <TableHead>Exam</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total Marks</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Avg Marks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r: any) => {
                  const records = Array.isArray(r.records) ? r.records : [];
                  const avg = records.length > 0 ? Math.round(records.reduce((a: number, x: any) => a + (Number(x.marks) || 0), 0) / records.length) : 0;
                  const pct = (Number(r.totalMarks) || 0) > 0 ? Math.round((avg / Number(r.totalMarks)) * 100) : 0;
                  const isOpen = expanded === r.id;
                  return (
                    <Fragment key={r.id}>
                      <TableRow className="hover:bg-muted/30 cursor-pointer" onClick={() => setExpanded(isOpen ? null : r.id)}>
                        <TableCell className="text-muted-foreground">
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </TableCell>
                        <TableCell><div className="font-medium text-sm">{r.exam || '—'}</div></TableCell>
                        <TableCell><Badge variant="outline" className="font-normal">{courseName(r.courseId)}</Badge></TableCell>
                        <TableCell className="text-sm whitespace-nowrap text-muted-foreground">{r.date ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{r.totalMarks || 100}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{records.length}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={`font-mono ${pct >= 50 ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-600 bg-rose-500/10 border-rose-500/20'}`}>{avg} / {r.totalMarks || 100}</Badge>
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell />
                          <TableCell colSpan={6}>
                            <div className="py-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {records.map((rec: any, i: number) => {
                                const stu = students.find((x: any) => x.id === rec.studentId);
                                const tm = Number(r.totalMarks) || 100;
                                const mp = tm > 0 ? Math.round((Number(rec.marks) / tm) * 100) : 0;
                                const tone = mp >= 50 ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-600 bg-rose-500/10 border-rose-500/20';
                                return (
                                  <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
                                    <div className="min-w-0">
                                      <div className="font-medium text-sm truncate">{stu?.name || 'Unknown student'}</div>
                                      <div className="text-[10px] text-muted-foreground">{stu?.class || '—'}{stu?.section ? ` · ${stu.section}` : ''}{stu?.rollNo ? ` · ${stu.rollNo}` : ''}</div>
                                    </div>
                                    <div className="text-right">
                                      <Badge variant="outline" className={`font-mono text-[10px] ${tone}`}>{rec.marks} / {tm}</Badge>
                                      {rec.grade && <div className="text-[10px] text-muted-foreground mt-0.5">Grade: {rec.grade}</div>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============ Branch Manager — Complaints View ============
function BMComplaintsView({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [responding, setResponding] = useState<any | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => {
    if (!user?.branchId) return;
    setLoading(true);
    Promise.all([
      api.getComplaints({ branchId: user.branchId }).then(r => Array.isArray(r) ? r : []).catch(() => []),
      api.platformUsers({ branchId: user.branchId, role: 'student' }).then(r => Array.isArray(r) ? r : []).catch(() => []),
    ]).then(([cmp, stu]) => {
      setComplaints(cmp);
      setStudents(stu);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { refresh(); }, [user?.branchId]);

  const stats = useMemo(() => {
    const open = complaints.filter((c: any) => String(c.status || 'Open').toLowerCase() !== 'resolved').length;
    const resolved = complaints.filter((c: any) => String(c.status || '').toLowerCase() === 'resolved').length;
    return { total: complaints.length, open, resolved };
  }, [complaints]);

  const studentName = (sid?: string) => sid ? (students.find((s: any) => s.id === sid)?.name || 'Student') : '';

  const submit = async () => {
    if (!responding) return;
    if (!responseText.trim()) { toast({ title: 'Response is empty', variant: 'destructive' }); return; }
    setSubmitting(true);
    try {
      await api.respondToComplaint(responding.id, responseText.trim());
      toast({ title: 'Response sent', description: 'Complaint marked as Resolved.' });
      setResponding(null);
      setResponseText('');
      refresh();
    } catch (e: any) { toast({ title: 'Failed to respond', description: e.message, variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const kpis = [
    { label: 'Total Complaints', value: String(stats.total), icon: MessageSquare, rose: false },
    { label: 'Open', value: String(stats.open), icon: AlertCircle, rose: stats.open > 0 },
    { label: 'Resolved', value: String(stats.resolved), icon: MailCheck, rose: false },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <ModuleHeader title="Complaints" subtitle={`Parent & student complaints for ${user?.branchName || 'your branch'}`} />
        <Card className="p-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading complaints…
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader title="Complaints" subtitle={`Parent & student complaints for ${user?.branchName || 'your branch'}`} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border border-border rounded-lg shadow-sm p-3 sm:p-4">
            <div className={`h-10 w-10 rounded-lg grid place-items-center mb-3 ${k.rose ? 'bg-rose-500/10' : 'bg-primary/10'}`}>
              <k.icon className={`h-4 w-4 ${k.rose ? 'text-rose-600' : 'text-primary'}`} />
            </div>
            <div className="text-xl font-extrabold tabular-nums leading-tight">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
          </Card>
        ))}
      </div>

      {complaints.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No complaints received" desc="When parents or students raise a concern via their portal, it will appear here for you to respond to." />
      ) : (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-base">All Complaints</h3>
            <span className="text-xs text-muted-foreground ml-1">{complaints.length} total</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto scroll-fancy -mx-4 px-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 sticky top-0">
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((c: any) => {
                  const isResolved = String(c.status || '').toLowerCase() === 'resolved';
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/30 align-top">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</TableCell>
                      <TableCell className="text-sm">{studentName(c.studentId) || '—'}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{c.subject || '—'}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2 max-w-md">{c.message || ''}</div>
                        {c.response && (
                          <div className="mt-1 text-[11px] text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-1 inline-block">
                            <strong>Reply:</strong> {c.response}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={isResolved ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-600 bg-rose-500/10 border-rose-500/20'}>
                          {isResolved ? 'Resolved' : 'Open'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="h-8 text-xs" disabled={isResolved}
                          onClick={() => { setResponding(c); setResponseText(c.response || ''); }}>
                          {isResolved ? 'Resolved' : <><MessageSquare className="h-3.5 w-3.5 mr-1" /> Respond</>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {responding && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/50 overflow-y-auto" onClick={() => { setResponding(null); setResponseText(''); }}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg my-4">
            <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
              <h3 className="font-bold text-lg mb-1">Respond to Complaint</h3>
              <p className="text-sm text-muted-foreground mb-3">Your reply will be saved and the complaint will be marked as Resolved.</p>
              <div className="rounded-lg border border-border bg-muted/40 p-3 mb-4">
                <div className="text-xs text-muted-foreground">Subject</div>
                <div className="font-medium text-sm">{responding.subject}</div>
                <div className="text-xs text-muted-foreground mt-2">Original message</div>
                <div className="text-sm mt-0.5">{responding.message}</div>
              </div>
              <Label>Your Response</Label>
              <Textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={4} placeholder="Type your response to the parent/student…" className="mt-1 resize-none" />
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={submitting} onClick={submit}>
                  {submitting ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Sending…</> : <><Send className="h-3.5 w-3.5 mr-1.5" /> Send Response</>}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setResponding(null); setResponseText(''); }}>Cancel</Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// ============ Branch Manager — Events View ============
function BMEventsView({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', location: '', type: 'Event' });
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => {
    if (!user?.branchId) return;
    setLoading(true);
    api.getEvents({ branchId: user.branchId })
      .then(r => setEvents(Array.isArray(r) ? r : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { refresh(); }, [user?.branchId]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const upcoming = events.filter((e: any) => (e.startDate || '') >= todayStr).length;
    return { total: events.length, upcoming };
  }, [events]);

  const submit = async () => {
    if (!form.title.trim()) { toast({ title: 'Title is required', variant: 'destructive' }); return; }
    setSubmitting(true);
    try {
      await api.createEvent({
        title: form.title.trim(),
        description: form.description.trim(),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        location: form.location.trim(),
        type: form.type,
        instituteId: user.instituteId,
        branchId: user.branchId,
      });
      toast({ title: 'Event created', description: `"${form.title.trim()}" was added to your branch calendar.` });
      setForm({ title: '', description: '', startDate: '', endDate: '', location: '', type: 'Event' });
      setShowCreate(false);
      refresh();
    } catch (e: any) { toast({ title: 'Failed to create event', description: e.message, variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const typeTone = (t?: string) => {
    const v = String(t || '').toLowerCase();
    if (v.includes('exam')) return 'text-rose-600 bg-rose-500/10 border-rose-500/20';
    if (v.includes('holiday')) return 'text-amber-700 bg-amber-500/10 border-amber-500/20';
    if (v.includes('meeting')) return 'text-primary bg-primary/10 border-primary/20';
    return 'text-primary bg-primary/10 border-primary/20';
  };

  const kpis = [
    { label: 'Total Events', value: String(stats.total), sub: 'In your branch calendar', icon: Calendar, rose: false },
    { label: 'Upcoming Events', value: String(stats.upcoming), sub: 'Scheduled today or later', icon: CalendarPlus, rose: false },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <ModuleHeader title="Events" subtitle={`Branch calendar & announcements · ${user?.branchName || ''}`}
          actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowCreate(true)}><CalendarPlus className="h-4 w-4 mr-1.5" /> Create Event</Button>} />
        <Card className="p-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading events…
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader title="Events" subtitle={`Branch calendar & announcements · ${user?.branchName || ''}`}
        actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowCreate(v => !v)}><CalendarPlus className="h-4 w-4 mr-1.5" /> Create Event</Button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border border-border rounded-lg shadow-sm p-3 sm:p-4">
            <div className="h-10 w-10 rounded-lg grid place-items-center mb-3 bg-primary/10">
              <k.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-extrabold tabular-nums leading-tight">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
            {k.sub && <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>}
          </Card>
        ))}
      </div>

      {events.length === 0 ? (
        <EmptyState icon={Calendar} title="No events yet" desc="Create your first branch event — exams, holidays, meetings, or any announcement parents and students should know about."
          action={<Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowCreate(true)}><CalendarPlus className="h-4 w-4 mr-1.5" /> Create Event</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((e: any) => (
            <Card key={e.id} className="p-5 border border-border rounded-lg shadow-sm hover:shadow-md transition flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-base truncate">{e.title}</h3>
                  <Badge variant="outline" className={`text-[10px] mt-1 ${typeTone(e.type)}`}>{e.type || 'Event'}</Badge>
                </div>
                <Calendar className="h-4 w-4 text-primary shrink-0" />
              </div>
              {e.description && <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{e.description}</p>}
              <div className="mt-auto space-y-1.5 text-xs">
                {(e.startDate || e.endDate) && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {e.startDate ? new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      {e.endDate ? ` → ${new Date(e.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                    </span>
                  </div>
                )}
                {e.location && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{e.location}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/50 overflow-y-auto" onClick={() => setShowCreate(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg my-4">
            <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
              <h3 className="font-bold text-lg mb-1">Create Event</h3>
              <p className="text-sm text-muted-foreground mb-4">Add an event to your branch calendar.</p>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Midterm Exams" className="mt-1" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Short description of the event…" className="mt-1 resize-none" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1" /></div>
                  <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Main Hall" className="mt-1" /></div>
                  <div>
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Event">Event</SelectItem>
                        <SelectItem value="Exam">Exam</SelectItem>
                        <SelectItem value="Holiday">Holiday</SelectItem>
                        <SelectItem value="Meeting">Meeting</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                        <SelectItem value="Notice">Notice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={submitting} onClick={submit}>
                  {submitting ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Creating…</> : <><CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> Create Event</>}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// ============ Branch Manager — SMS Portal View ============
function BMSmsView({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [senders, setSenders] = useState<any[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ text: '', type: 'Notice', classId: '' });
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => {
    if (!user?.branchId) return;
    setLoading(true);
    Promise.all([
      api.getSms({ branchId: user.branchId }).then(r => Array.isArray(r) ? r : []).catch(() => []),
      api.getClasses(user.branchId).then(r => Array.isArray(r) ? r : []).catch(() => []),
      api.platformUsers({ branchId: user.branchId, role: 'teacher' }).then(r => Array.isArray(r) ? r : []).catch(() => []),
    ]).then(([msg, cls, tch]) => {
      setMessages(msg);
      setClasses(cls);
      // Build a sender lookup that includes the branch manager themselves
      setSenders([...tch, { id: user.id, name: user.name, role: 'branch-manager' }]);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { refresh(); }, [user?.branchId]);

  const senderName = (id?: string) => {
    if (!id) return '—';
    if (id === user.id) return user.name || 'You';
    return senders.find((s: any) => s.id === id)?.name || 'Sender';
  };
  const senderRoleLabel = (role?: string) => {
    const r = String(role || '').toLowerCase();
    if (r === 'teacher') return 'Teacher';
    if (r === 'branch-manager') return 'Branch Manager';
    if (r === 'institute-admin') return 'Institute Admin';
    return role || '';
  };
  const className = (id?: string) => id ? (classes.find((c: any) => c.id === id)?.name || 'Class') : 'All';

  const submit = async () => {
    if (!form.text.trim()) { toast({ title: 'Message text is required', variant: 'destructive' }); return; }
    setSubmitting(true);
    try {
      await api.sendSms({
        text: form.text.trim(),
        recipients: 0,
        type: form.type,
        classId: form.classId || null,
        instituteId: user.instituteId,
        branchId: user.branchId,
      });
      toast({ title: 'SMS logged', description: 'Your message was saved to the SMS log. (Messages are logged, not actually sent.)' });
      setForm({ text: '', type: 'Notice', classId: '' });
      setShowCompose(false);
      refresh();
    } catch (e: any) { toast({ title: 'Failed to send', description: e.message, variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const kpis = [
    { label: 'Total Messages Sent', value: String(messages.length), sub: 'All-time SMS log', icon: Smartphone },
    { label: 'Total Recipients Reached', value: String(messages.reduce((a: number, m: any) => a + (Number(m.recipients) || 0), 0)), sub: 'Sum across all messages', icon: Send },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <ModuleHeader title="SMS Portal" subtitle={`Message log & composer · ${user?.branchName || ''}`}
          actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowCompose(true)}><Send className="h-4 w-4 mr-1.5" /> Compose SMS</Button>} />
        <Card className="p-10 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader title="SMS Portal" subtitle={`Message log & composer · ${user?.branchName || ''}`}
        actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowCompose(v => !v)}><Send className="h-4 w-4 mr-1.5" /> Compose SMS</Button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border border-border rounded-lg shadow-sm p-3 sm:p-4">
            <div className="h-10 w-10 rounded-lg grid place-items-center mb-3 bg-primary/10">
              <k.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-extrabold tabular-nums leading-tight">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
            {k.sub && <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>}
          </Card>
        ))}
      </div>

      {messages.length === 0 ? (
        <EmptyState icon={Smartphone} title="No messages yet" desc="Compose your first SMS to parents or students. Messages are logged here for your records."
          action={<Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowCompose(true)}><Send className="h-4 w-4 mr-1.5" /> Compose SMS</Button>} />
      ) : (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-base">SMS Log</h3>
            <span className="text-xs text-muted-foreground ml-1">{messages.length} message(s)</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto scroll-fancy -mx-4 px-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 sticky top-0">
                  <TableHead>Date</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Recipients</TableHead>
                  <TableHead>Sender</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((m: any) => (
                  <TableRow key={m.id} className="hover:bg-muted/30 align-top">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{m.createdAt ? new Date(m.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}</TableCell>
                    <TableCell><div className="text-sm line-clamp-2 max-w-md">{m.text}</div></TableCell>
                    <TableCell><Badge variant="outline" className="font-normal text-[11px]">{m.type || 'Notice'}</Badge></TableCell>
                    <TableCell className="text-sm">{className(m.classId)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{Number(m.recipients) || 0}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{senderName(m.senderId)}</div>
                      <div className="text-[10px] text-muted-foreground">{senderRoleLabel(m.senderRole)}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {showCompose && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/50 overflow-y-auto" onClick={() => setShowCompose(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg my-4">
            <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
              <h3 className="font-bold text-lg mb-1">Compose SMS</h3>
              <p className="text-sm text-muted-foreground mb-4">Write your message — it will be saved to the SMS log. (Messages are logged for record-keeping, not actually transmitted.)</p>
              <div className="space-y-3">
                <div>
                  <Label>Message</Label>
                  <Textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} rows={4} placeholder="Type your SMS message…" className="mt-1 resize-none" maxLength={500} />
                  <div className="text-[11px] text-muted-foreground mt-1 text-right">{form.text.length} / 500</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Notice">Notice</SelectItem>
                        <SelectItem value="Reminder">Reminder</SelectItem>
                        <SelectItem value="Alert">Alert</SelectItem>
                        <SelectItem value="Announcement">Announcement</SelectItem>
                        <SelectItem value="Fee Reminder">Fee Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Target Class</Label>
                    <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="All classes" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Classes</SelectItem>
                        {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}{c.section ? ` · ${c.section}` : ''}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={submitting} onClick={submit}>
                  {submitting ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Sending…</> : <><Send className="h-3.5 w-3.5 mr-1.5" /> Send SMS</>}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// ============ Timetable Builder ============
const TIMETABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMETABLE_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

function TimetableManager({ user }: { user: any }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);
  const [editing, setEditing] = useState<{ day: string; period: number; entry?: any } | null>(null);

  // Load classes & teachers when branch is known
  useEffect(() => {
    if (!user?.branchId) return;
    
    api.getClasses(user.branchId)
      .then(r => {
        const arr = Array.isArray(r) ? r : [];
        setClasses(arr);
        if (arr.length > 0) setSelectedClassId(prev => prev || arr[0].id);
      })
      .catch(() => setClasses([]))
      .finally(() => setClassesLoading(false));
    api.platformUsers({ branchId: user.branchId, role: 'teacher' })
      .then(r => setTeachers(Array.isArray(r) ? r : []))
      .catch(() => setTeachers([]));
  }, [user?.branchId]);

  // Load timetable entries whenever the selected class changes
  useEffect(() => {
    if (!selectedClassId) { return; }
    api.getTimetable({ classId: selectedClassId })
      .then(r => setEntries(Array.isArray(r) ? r : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [selectedClassId]);

  // Build a quick lookup map: `${day}-${period}` → entry
  const entryMap = useMemo(() => {
    const m = new Map<string, any>();
    entries.forEach(e => { if (e?.day && e?.period) m.set(`${e.day}-${e.period}`, e); });
    return m;
  }, [entries]);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const refresh = () => {
    if (!selectedClassId) return;
    api.getTimetable({ classId: selectedClassId })
      .then(r => setEntries(Array.isArray(r) ? r : []))
      .catch(() => {});
  };

  const handleSave = async (body: any) => {
    await api.saveTimetableEntry(body);
    toast({ title: 'Timetable updated', description: `${body.subject || 'Entry'} · ${body.day} · P${body.period}` });
    setEditing(null);
    refresh();
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTimetableEntry(id);
      toast({ title: 'Entry cleared' });
      refresh();
    } catch (e: any) {
      toast({ title: 'Failed to delete', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Timetable"
        subtitle={`Build the weekly schedule for your classes · ${user?.branchName || ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary hidden sm:block" />
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}{c.section ? ` · ${c.section}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {classesLoading ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Loading classes…</Card>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No classes yet"
          desc="Classes are auto-created when your branch is provisioned. If you don't see them, ask your Institute Admin."
        />
      ) : !selectedClassId ? (
        <EmptyState icon={Calendar} title="Select a class" desc="Pick a class from the dropdown above to start building its weekly timetable." />
      ) : (
        <Card className="p-0 overflow-hidden border border-border rounded-lg shadow-sm">
          <div className="overflow-x-auto scroll-fancy">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="bg-primary text-primary-foreground font-semibold p-2 text-left sticky left-0 z-10 w-20 min-w-[80px]">Period</th>
                  {TIMETABLE_DAYS.map(d => (
                    <th key={d} className="bg-primary text-primary-foreground font-semibold p-2 text-left min-w-[160px]">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIMETABLE_PERIODS.map(p => (
                  <tr key={p}>
                    <td className="bg-muted/40 font-bold text-primary p-2 sticky left-0 z-10 border-r border-border text-center">P{p}</td>
                    {TIMETABLE_DAYS.map(d => {
                      const e = entryMap.get(`${d}-${p}`);
                      return (
                        <td key={d} className="border border-border p-0 align-top">
                          {loading ? (
                            <div className="h-[72px] grid place-items-center text-[11px] text-muted-foreground">…</div>
                          ) : e ? (
                            <div className="p-2 relative group h-[72px]">
                              <button
                                className="absolute top-1 right-1 h-4 w-4 rounded grid place-items-center text-rose-600 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                                onClick={() => handleDelete(e.id)}
                                title="Clear entry"
                                aria-label={`Clear ${d} period ${p}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                              <button
                                className="text-left w-full pr-5"
                                onClick={() => setEditing({ day: d, period: p, entry: e })}
                              >
                                <div className="font-semibold text-primary text-[13px] truncate">{e.subject || '(no subject)'}</div>
                                <div className="text-[11px] text-muted-foreground truncate">{e.teacherName || '—'}</div>
                                <div className="text-[10px] text-muted-foreground truncate">
                                  {e.roomName ? `Room ${e.roomName}` : ''}
                                  {e.startTime && e.endTime ? `${e.roomName ? ' · ' : ''}${e.startTime}–${e.endTime}` : ''}
                                </div>
                              </button>
                            </div>
                          ) : (
                            <button
                              className="w-full h-[72px] grid place-items-center text-muted-foreground/40 hover:bg-primary/5 hover:text-primary transition"
                              onClick={() => setEditing({ day: d, period: p })}
                              aria-label={`Add entry for ${d} period ${p}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 text-[11px] text-muted-foreground border-t border-border bg-muted/20">
            Click any cell to add or edit · hover an entry to reveal the clear (×) button · {entries.length} entr{entries.length === 1 ? 'y' : 'ies'} for {selectedClass?.name || 'this class'}{selectedClass?.section ? ` · ${selectedClass.section}` : ''}
          </div>
        </Card>
      )}

      {editing && (
        <TimetableEntryModal
          day={editing.day}
          period={editing.period}
          entry={editing.entry}
          teachers={teachers}
          classId={selectedClassId}
          className={selectedClass?.name || ''}
          section={selectedClass?.section || 'A'}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function TimetableEntryModal({ day, period, entry, teachers, classId, className, section, onClose, onSave }: {
  day: string;
  period: number;
  entry?: any;
  teachers: any[];
  classId: string;
  className: string;
  section: string;
  onClose: () => void;
  onSave: (body: any) => Promise<void>;
}) {
  const [subject, setSubject] = useState(entry?.subject || '');
  const [teacherId, setTeacherId] = useState(entry?.teacherId || '');
  const [startTime, setStartTime] = useState(entry?.startTime || '');
  const [endTime, setEndTime] = useState(entry?.endTime || '');
  const [roomName, setRoomName] = useState(entry?.roomName || '');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!subject.trim()) {
      toast({ title: 'Subject is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const teacher = teachers.find(t => t.id === teacherId);
    try {
      await onSave({
        classId,
        className,
        section,
        day,
        period,
        startTime,
        endTime,
        subject: subject.trim(),
        teacherId: teacherId || null,
        teacherName: teacher?.name || '',
        roomName: roomName.trim(),
      });
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md my-4">
        <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-lg">{entry ? 'Edit Entry' : 'Add Entry'}</h3>
            <Badge variant="outline" className="text-primary bg-primary/10 border-primary/20 font-medium">{day} · P{period}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Set the subject, teacher, time and room for this slot.</p>
          <div className="space-y-3">
            <div>
              <Label>Subject *</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Mathematics" className="mt-1" />
            </div>
            <div>
              <Label>Teacher</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-2 text-center">No teachers added yet.</div>
                  ) : teachers.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start time</Label>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>End time</Label>
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Room</Label>
              <Input value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="e.g. 101 / Lab-A" className="mt-1" />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={saving} onClick={submit}>
              {saving ? 'Saving…' : entry ? 'Update Entry' : 'Add Entry'}
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ============== Report Card Manager ==============
function ReportCardManager({ user, students }: { user: any; students: any[] }) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [term, setTerm] = useState<string>('Current Term');
  const [report, setReport] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);

  const refreshSaved = () => {
    if (!user?.branchId) { setSavedLoading(false); return; }
    setSavedLoading(true);
    api.getReportCards({ branchId: user.branchId })
      .then(r => setSavedCards(Array.isArray(r) ? r : []))
      .catch(() => setSavedCards([]))
      .finally(() => setSavedLoading(false));
  };

  useEffect(() => { refreshSaved(); }, [user?.branchId]);

  const generate = async () => {
    if (!selectedId) {
      toast({ title: 'Select a student', description: 'Choose a student to generate their report card.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const r: any = await api.generateReportCard(selectedId, term || 'Current Term');
      setReport(r as ReportCardData);
      const subs = Array.isArray(r?.subjects) ? r.subjects : [];
      if (subs.length === 0) {
        toast({ title: 'No results found', description: 'This student has no posted exam results yet.' });
      } else {
        toast({ title: 'Report card generated', description: `${r.student?.name || 'Student'} · ${r.percentage}% · Grade ${r.grade}` });
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to generate report card');
      toast({ title: 'Failed', description: e?.message || 'Could not generate report card.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!report || !report.student?.id) {
      toast({ title: 'Nothing to save', description: 'Generate a report card first.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.saveReportCard({
        studentId: report.student.id,
        studentName: report.student.name,
        class: report.student.class,
        section: report.student.section,
        term: report.term || 'Current Term',
        examName: report.examName || 'All Exams',
        totalMarks: Number(report.totalMarks) || 0,
        obtainedMarks: Number(report.obtainedMarks) || 0,
        percentage: Number(report.percentage) || 0,
        grade: report.grade || '',
        remarks: report.remarks || '',
      });
      toast({ title: 'Report card saved', description: `${report.student.name || 'Student'} · ${report.term || 'Current Term'}` });
      refreshSaved();
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Could not save report card.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const instituteName = user?.instituteName;
  const subjects = Array.isArray(report?.subjects) ? (report?.subjects || []) : [];
  const isEmpty = !loading && !error && report && subjects.length === 0;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Report Cards"
        subtitle={`Generate & save student report cards · ${user?.branchName || ''}`}
      />

      {/* Student + term selector */}
      <Card className="p-5 border border-border rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-base">Generate Report Card</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Student</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={students.length === 0 ? 'No students in branch' : 'Select student'} /></SelectTrigger>
              <SelectContent>
                {students.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{s.class ? ` · ${s.class}` : ''}{s.rollNo ? ` · ${s.rollNo}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Term</Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Current Term">Current Term</SelectItem>
                <SelectItem value="First Term">First Term</SelectItem>
                <SelectItem value="Mid Term">Mid Term</SelectItem>
                <SelectItem value="Final Term">Final Term</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button onClick={generate} disabled={loading || !selectedId} className="bg-primary hover:bg-primary/90 text-white">
            {loading ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Generating…</> : <><Award className="h-4 w-4 mr-1.5" /> Generate Report Card</>}
          </Button>
          <Button onClick={save} disabled={saving || !report || isEmpty} variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
            {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving…</> : <><Save className="h-4 w-4 mr-1.5" /> Save Report Card</>}
          </Button>
          <ReportCardActions report={report} instituteName={instituteName} busy={loading} disabled={loading || !report || isEmpty} />
        </div>
      </Card>

      {/* Generated report card */}
      {loading && (
        <Card className="p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2 border border-border rounded-lg shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Generating report card…
        </Card>
      )}

      {!loading && error && (
        <EmptyState icon={AlertCircle} title="Couldn't generate report card" desc={error || 'Please try again.'} />
      )}

      {!loading && !error && isEmpty && (
        <EmptyState
          icon={Award}
          title="No results published yet"
          desc="This student has no posted exam results. Teachers need to post exam results before a report card can be generated."
        />
      )}

      {!loading && !error && report && subjects.length > 0 && (
        <ReportCardDocument report={report} instituteName={instituteName} />
      )}

      {/* Saved report cards list */}
      <Card className="p-4 border border-border rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-base">Saved Report Cards</h3>
            <span className="text-xs text-muted-foreground ml-1">{savedCards.length} saved</span>
          </div>
          <Button size="sm" variant="outline" onClick={refreshSaved} disabled={savedLoading}>
            {savedLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
            Refresh
          </Button>
        </div>
        {savedLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading saved report cards…
          </div>
        ) : savedCards.length === 0 ? (
          <EmptyState icon={Award} title="No saved report cards yet" desc="Generate a report card above and click 'Save Report Card' to keep a permanent copy." />
        ) : (
          <div className="max-h-96 overflow-y-auto scroll-fancy -mx-4 px-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 sticky top-0">
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden sm:table-cell">Class</TableHead>
                  <TableHead className="hidden md:table-cell">Term</TableHead>
                  <TableHead className="text-right">Obtained</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedCards.map((rc: any) => {
                  const tone = String(rc.grade || '').toUpperCase() === 'F'
                    ? 'text-rose-700 bg-rose-500/10 border-rose-500/30'
                    : String(rc.grade || '').toUpperCase() === 'A+' || String(rc.grade || '').toUpperCase() === 'A'
                      ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30'
                      : 'text-primary bg-primary/10 border-primary/30';
                  return (
                    <TableRow key={rc.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">{rc.studentName || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{rc.class || '—'}{rc.section ? ` · ${rc.section}` : ''}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{rc.term || '—'}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{rc.obtainedMarks}/{rc.totalMarks}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{rc.percentage}%</TableCell>
                      <TableCell><Badge variant="outline" className={tone}>{rc.grade || '—'}</Badge></TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{rc.generatedAt ? String(rc.generatedAt).slice(0, 10) : '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
