'use client';

import { useEffect, lazy, Suspense, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Building2, Network, Users, Plus, MapPin, CheckCircle2, Lock, Unlock, Edit,
  Trash2, Megaphone, Send, Loader2, ChevronRight,
  ArrowLeft, BookOpen, GraduationCap, DollarSign,
  Wallet, TrendingUp, TrendingDown, Scale, FileText, AlertCircle,
  Search, Crown, Calendar, Download,
  CreditCard, CalendarCheck, Award, MessageCircleWarning, MailCheck,
  Trophy, CalendarPlus, MessageSquare,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/lib/store';
import { BranchManagerPortal } from './branch-manager-portal';

// Lazy-loaded v1.6.0 modules
const OnlineAdmissionsModule = lazy(() => import('@/components/dashboard/modules/online-admissions').then(m => ({ default: m.OnlineAdmissions })));
const ComplaintPortalModule = lazy(() => import('@/components/dashboard/modules/complaint-portal').then(m => ({ default: m.ComplaintPortal })));

function ModuleFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// ============== Shared helpers ==============
const formatPKR = (n: any) => 'PKR ' + Number(n || 0).toLocaleString('en-PK');
const NAVY = '#1a365d';
const ROSE = '#e11d48';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// CSV export helper — converts an array of rows to a CSV string and triggers a browser download
function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: any) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast({ title: 'CSV exported', description: `${filename} downloaded successfully` });
}

// ============== Main portal ==============
export function InstituteAdminPortal({ activeModule, user }: { activeModule: string; user: any }) {
  const setActiveModule = useApp(s => s.setActiveModule);
  const [finance, setFinance] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [lastCreated, setLastCreated] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const refresh = async () => {
    if (!user?.instituteId) return;
    setLoading(true);
    try {
      const [f, b] = await Promise.all([
        api.getInstituteFinance(user.instituteId).catch(() => null),
        api.branches(user.instituteId).catch(() => []),
      ]);
      setFinance(f);
      setBranches(Array.isArray(b) ? b : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (user?.instituteId) {
      Promise.all([
        api.getInstituteFinance(user.instituteId).catch(() => null),
        api.branches(user.instituteId).catch(() => []),
      ]).then(([f, b]) => {
        if (active) {
          setFinance(f);
          setBranches(Array.isArray(b) ? b : []);
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }
    return () => { active = false; };
  }, [user?.instituteId]);

  const selectedBranch = useMemo(
    () => (selectedBranchId ? branches.find(b => b.id === selectedBranchId) || null : null),
    [selectedBranchId, branches]
  );

  if (activeModule === 'announcements') return <AnnouncementsView user={user} />;
  if (activeModule === 'settings') return null;

  // New Institute Admin modules — fee management, academics, complaints, events
  if (activeModule === 'institute-fees') return <InstituteFeeManagement finance={finance} branches={branches} loading={loading} />;
  if (activeModule === 'institute-academics') return <InstituteAcademics user={user} branches={branches} />;
  if (activeModule === 'institute-complaints') return <InstituteComplaints user={user} />;
  if (activeModule === 'institute-events') return <InstituteEvents user={user} />;
  if (activeModule === 'online-admissions') return <Suspense fallback={<ModuleFallback />}><OnlineAdmissionsModule user={user} /></Suspense>;
  if (activeModule === 'complaint-portal') return <Suspense fallback={<ModuleFallback />}><ComplaintPortalModule user={user} /></Suspense>;

  if (selectedBranch) {
    return (
      <BranchManagementView
        branch={selectedBranch}
        user={user}
        onBack={() => setSelectedBranchId(null)}
        onRefresh={refresh}
      />
    );
  }

  const viewProps = {
    finance,
    branches,
    loading,
    user,
    onRefresh: refresh,
    onAddBranch: () => setShowAddBranch(true),
    onSelectBranch: (br: any) => setSelectedBranchId(br.id),
    setActiveModule,
  };

  return (
    <div className="space-y-6">
      {activeModule === 'institute-overview' && <InstituteDashboard {...viewProps} />}
      {activeModule === 'branches' && (
        <BranchesView
          user={user}
          branches={branches}
          loading={loading}
          onAddBranch={() => setShowAddBranch(true)}
          onSelectBranch={(br: any) => setSelectedBranchId(br.id)}
          onRefresh={refresh}
          showAddBranch={showAddBranch}
          setShowAddBranch={setShowAddBranch}
          lastCreated={lastCreated}
          setLastCreated={setLastCreated}
        />
      )}
      {activeModule === 'institute-royalty' && <InstituteRoyaltyView finance={finance} branches={branches} loading={loading} user={user} onRefresh={refresh} />}
      {activeModule === 'institute-teachers' && <InstituteTeachersView {...viewProps} />}
      {activeModule === 'institute-students' && <InstituteStudentsView {...viewProps} />}
      {activeModule === 'institute-reports' && <InstituteReportsView {...viewProps} />}
    </div>
  );
}

// ============== Loading & Empty states ==============
function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">{label}</span>
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

// ============== Reusable KPI card ==============
function KPICard({ icon: Icon, label, value, sub, tone = 'default' }: {
  icon: any; label: string; value: string; sub?: string; tone?: 'default' | 'positive' | 'negative';
}) {
  const valueColor = tone === 'positive' ? 'text-emerald-600' : tone === 'negative' ? 'text-rose-600' : 'text-foreground';
  return (
    <Card className="p-2.5 sm:p-3 border border-border rounded-lg shadow-sm hover:shadow-md transition">
      <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center mb-2">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className={`text-base font-bold tabular-nums ${valueColor} leading-tight`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </Card>
  );
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

// ============== 1. Institute Dashboard ==============
function InstituteDashboard({ finance, branches, loading, user, onRefresh, onAddBranch, onSelectBranch, setActiveModule }: any) {
  const kpi = finance?.kpi || {};
  const [royaltyCollected, setRoyaltyCollected] = useState(0);

  // Fetch total royalty collected from royalty invoices (paid invoices only)
  useEffect(() => {
    let active = true;
    if (!user?.instituteId) return;
    api.getRoyaltyInvoices(user.instituteId)
      .then((invoices: any[]) => {
        if (!active || !Array.isArray(invoices)) return;
        const total = invoices
          .filter((inv: any) => inv.status === 'paid')
          .reduce((sum: number, inv: any) => sum + Number(inv.royaltyAmount || 0), 0);
        setRoyaltyCollected(total);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [user?.instituteId]);

  if (loading) {
    return (
      <Card className="p-6"><LoadingState label="Loading dashboard…" /></Card>
    );
  }

  // 4 high-level summary KPI cards — "Royalty Collected" replaces the old "Total Revenue"
  // (manual revenue entry has been removed; revenue now comes from royalty invoices)
  const summaryCards = [
    { label: 'Branches', value: String(kpi.branches || branches?.length || 0), icon: Network, sub: 'Active campuses' },
    { label: 'Students', value: String(kpi.students || 0), icon: GraduationCap, sub: 'Across all branches' },
    { label: 'Teachers', value: String(kpi.teachers || 0), icon: Users, sub: 'Teaching staff' },
    { label: 'Royalty Collected', value: formatPKR(royaltyCollected), icon: Crown, sub: 'From paid royalty invoices' },
  ];

  // Quick action shortcuts — "Royalty Management" replaces "Fees & Revenue"
  const quickActions = [
    { title: 'Royalty Management', sub: 'Set royalty, generate invoices', icon: Crown, target: 'institute-royalty' },
    { title: 'Teachers & Salaries', sub: 'Manage salaries & payouts', icon: Users, target: 'institute-teachers' },
    { title: 'Students', sub: 'Student records & analytics', icon: GraduationCap, target: 'institute-students' },
    { title: 'Reports', sub: 'Analytics & insights', icon: TrendingUp, target: 'institute-reports' },
  ];

  return (
    <>
      {/* Welcome banner — navy gradient */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 sm:p-8 text-white"
      >
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15">
              <Crown className="h-3 w-3" /> Institute Admin · {user?.instituteName || 'eSM Institute'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
            </h1>
            <p className="text-white/80 text-sm mt-1.5 max-w-lg">
              {kpi.branches || 0} branches · {kpi.students || 0} students · {kpi.teachers || 0} teachers
            </p>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </motion.div>

      {/* Core summary KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {summaryCards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <KPICard icon={c.icon} label={c.label} value={c.value} sub={c.sub} />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions — shortcut cards to detailed pages */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Quick Actions</h2>
          <p className="text-xs text-muted-foreground">Jump straight to the detailed management pages</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {quickActions.map((a, i) => (
            <motion.div
              key={a.target}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
              onClick={() => setActiveModule?.(a.target)}
              className="group border border-border rounded-lg shadow-sm hover:shadow-md transition cursor-pointer p-3 sm:p-4"
            >
              <div className="flex items-start justify-between">
                <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary">
                  <a.icon className="h-5 w-5" />
                </div>
                <ChevronRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition" />
              </div>
              <h3 className="font-bold text-sm mt-2">{a.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{a.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Branches overview — compact */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Branches</h2>
            <p className="text-xs text-muted-foreground">Quick view of all campuses in your institute</p>
          </div>
          {branches?.length > 0 && (
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={() => setActiveModule?.('branches')}>
              View all <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
        {!branches || branches.length === 0 ? (
          <EmptyState
            icon={Network}
            title="No branches yet"
            desc="Add your first branch. You'll set the Branch Manager's email and password."
            action={<Button className="bg-primary hover:bg-primary/90 text-white" onClick={onAddBranch}><Plus className="h-4 w-4 mr-1.5" /> Add Branch</Button>}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            {branches.slice(0, 6).map((br: any) => (
              <BranchCard key={br.id} br={br} instituteId={user?.instituteId} onRefresh={onRefresh} onSelectBranch={onSelectBranch} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ============== 2. Branches View ==============
function BranchesView({ user, branches, loading, onAddBranch, onSelectBranch, onRefresh, showAddBranch, setShowAddBranch, lastCreated, setLastCreated }: any) {
  const active = branches.filter((b: any) => !(b.blocked === 1 || b.blocked === true)).length;
  const blocked = branches.filter((b: any) => b.blocked === 1 || b.blocked === true).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        subtitle="Manage all campuses under your institute"
        action={<Button className="bg-primary hover:bg-primary/90 text-white" onClick={onAddBranch}><Plus className="h-4 w-4 mr-1.5" /> Add Branch</Button>}
      />

      {/* Small KPI strip */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <KPICard icon={Network} label="Total Branches" value={String(branches.length)} />
        <KPICard icon={CheckCircle2} label="Active Branches" value={String(active)} sub="Operational" />
        <KPICard icon={Lock} label="Blocked Branches" value={String(blocked)} sub="Access suspended" tone={blocked > 0 ? 'negative' : 'default'} />
      </div>

      {/* Branch cards grid */}
      {loading ? (
        <Card className="p-6"><LoadingState label="Loading branches…" /></Card>
      ) : branches.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No branches yet"
          desc="Add your first branch. You'll set the Branch Manager's email and password."
          action={<Button className="bg-primary hover:bg-primary/90 text-white" onClick={onAddBranch}><Plus className="h-4 w-4 mr-1.5" /> Add Branch</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {branches.map((br: any) => (
            <BranchCard key={br.id} br={br} instituteId={user?.instituteId} onRefresh={onRefresh} onSelectBranch={onSelectBranch} />
          ))}
        </div>
      )}

      <BranchModal
        show={showAddBranch}
        setShow={setShowAddBranch}
        instituteId={user?.instituteId}
        onRefresh={onRefresh}
        lastCreated={lastCreated}
        setLastCreated={setLastCreated}
      />
    </div>
  );
}

// ============== 3. Royalty Management View ==============
// Replaces the old "Fees & Revenue" page. Manual revenue entry has been removed —
// the Institute Admin now sets a royalty method per branch (per_student | fixed |
// percentage), auto-generates royalty invoices each month, and tracks collection.
function InstituteRoyaltyView({ branches, loading, user, onRefresh }: any) {
  const [settings, setSettings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState<string>(MONTHS[now.getMonth()]);
  const [year, setYear] = useState<string>(String(now.getFullYear()));

  const refreshRoyalty = async () => {
    if (!user?.instituteId) { setDataLoading(false); return; }
    setDataLoading(true);
    try {
      const [s, inv] = await Promise.all([
        api.getRoyaltySettings(user.instituteId).catch(() => []),
        api.getRoyaltyInvoices(user.instituteId).catch(() => []),
      ]);
      setSettings(Array.isArray(s) ? s : []);
      setInvoices(Array.isArray(inv) ? inv : []);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { refreshRoyalty(); }, [user?.instituteId]);

  // Summary calculations from royalty invoices (NOT manual revenue)
  const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
  const pendingInvoices = invoices.filter((i: any) => i.status !== 'paid');
  const totalCollected = paidInvoices.reduce((sum: number, i: any) => sum + Number(i.royaltyAmount || 0), 0);
  const totalPending = pendingInvoices.reduce((sum: number, i: any) => sum + Number(i.royaltyAmount || 0), 0);
  const branchesWithRoyalty = settings.length;
  const thisMonthRoyalty = invoices
    .filter((i: any) => i.month === month && Number(i.year) === Number(year))
    .reduce((sum: number, i: any) => sum + Number(i.royaltyAmount || 0), 0);

  const handleGenerate = async () => {
    const y = Number(year);
    if (!y || y < 2000) { toast({ title: 'Enter a valid year', variant: 'destructive' }); return; }
    setGenerating(true);
    try {
      await api.generateRoyaltyInvoices(month, y);
      toast({ title: 'Royalty invoices generated', description: `${month} ${y} — calculated from each branch's settings, student count, and fee collections.` });
      refreshRoyalty();
      onRefresh?.();
    } catch (e: any) {
      toast({ title: 'Failed to generate', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handlePay = async (id: string) => {
    setPayingId(id);
    try {
      await api.payRoyaltyInvoice(id);
      toast({ title: 'Invoice marked as paid' });
      refreshRoyalty();
      onRefresh?.();
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setPayingId(null);
    }
  };

  if (loading || dataLoading) return <Card className="p-6"><LoadingState label="Loading royalty data…" /></Card>;

  // Merge branch list with their royalty settings for the settings table
  const settingsByBranchId = new Map(settings.map((s: any) => [s.branchId, s]));
  const branchesWithSettings = (branches || []).map((b: any) => ({
    branch: b,
    setting: settingsByBranchId.get(b.id) || null,
  }));

  const methodLabel = (m: string) => m === 'per_student' ? 'Per Student' : m === 'fixed' ? 'Fixed' : m === 'percentage' ? 'Percentage' : m || '—';
  const methodValue = (s: any) => {
    if (!s) return '—';
    if (s.method === 'per_student') return formatPKR(s.amount) + ' / student';
    if (s.method === 'fixed') return formatPKR(s.amount) + ' / month';
    if (s.method === 'percentage') return (s.percentage || 0) + '% of revenue';
    return '—';
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Royalty Management" subtitle="Set royalty methods, generate invoices, and track collections per branch" />

      {/* D. Summary KPIs — 4 compact cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <KPICard icon={CheckCircle2} label="Total Royalty Collected" value={formatPKR(totalCollected)} sub={`${paidInvoices.length} paid invoices`} tone="positive" />
        <KPICard icon={AlertCircle} label="Pending Royalty" value={formatPKR(totalPending)} sub={`${pendingInvoices.length} pending invoices`} tone="negative" />
        <KPICard icon={Network} label="Branches with Royalty" value={String(branchesWithRoyalty)} sub={`${(branches || []).length} total branches`} />
        <KPICard icon={Crown} label="This Month's Royalty" value={formatPKR(thisMonthRoyalty)} sub={`${month} ${year}`} />
      </div>

      {/* A. Royalty Settings — table of branches with their current royalty method */}
      <Card className="border border-border rounded-lg shadow-sm p-3 sm:p-4">
        <div className="mb-4">
          <h3 className="font-bold text-base">Royalty Settings</h3>
          <p className="text-xs text-muted-foreground">Set the royalty method for each branch</p>
        </div>
        {branchesWithSettings.length === 0 ? (
          <EmptyState icon={Crown} title="No branches yet" desc="Add branches first to configure royalty methods." />
        ) : (
          <div className="max-h-96 overflow-y-auto scroll-fancy">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Branch</TableHead>
                  <TableHead className="text-xs">Method</TableHead>
                  <TableHead className="text-xs">Amount / Percentage</TableHead>
                  <TableHead className="text-xs">Effective From</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchesWithSettings.map(({ branch, setting }: any) => (
                  <TableRow key={branch.id}>
                    <TableCell className="text-sm font-medium">{branch.name}</TableCell>
                    <TableCell>
                      {setting ? (
                        <Badge variant="outline" className="text-[10px] text-primary bg-primary/10 border-primary/20">{methodLabel(setting.method)}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted border-border">Not set</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{methodValue(setting)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{setting?.effectiveFrom ? new Date(setting.effectiveFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setEditingBranch(branch)}>
                        <Edit className="h-3 w-3 mr-1" /> {setting ? 'Edit' : 'Set Royalty'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* B. Generate Royalty Invoices — auto-calculates from settings + branch data */}
      <Card className="border border-border rounded-lg shadow-sm p-3 sm:p-4">
        <div className="mb-4">
          <h3 className="font-bold text-base">Generate Royalty Invoices</h3>
          <p className="text-xs text-muted-foreground">This auto-calculates royalty for each branch based on their settings, student count, and fee collections.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Year</Label>
            <Input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. 2026" />
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-white h-9"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
            Generate Invoices
          </Button>
        </div>
      </Card>

      {/* C. Royalty Collection Report — invoices table */}
      <Card className="border border-border rounded-lg shadow-sm p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base">Royalty Collection Report</h3>
            <p className="text-xs text-muted-foreground">All generated royalty invoices across branches</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => {
            const rows = invoices.map((i: any) => [i.branchName, i.month, i.year, methodLabel(i.method), i.studentCount ?? 0, i.branchRevenue ?? 0, i.royaltyAmount ?? 0, i.status, i.paidDate ? new Date(i.paidDate).toLocaleDateString() : '—']);
            exportToCSV(`royalty-collection-${new Date().toISOString().slice(0, 10)}`, ['Branch', 'Month', 'Year', 'Method', 'Students', 'Branch Revenue (PKR)', 'Royalty Amount (PKR)', 'Status', 'Paid Date'], rows);
          }}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
          </Button>
        </div>
        {invoices.length === 0 ? (
          <EmptyState icon={FileText} title="No royalty invoices yet" desc="Generate invoices for a month/year using the section above." />
        ) : (
          <div className="max-h-96 overflow-y-auto scroll-fancy">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Branch</TableHead>
                  <TableHead className="text-xs">Month/Year</TableHead>
                  <TableHead className="text-xs">Method</TableHead>
                  <TableHead className="text-xs text-center">Students</TableHead>
                  <TableHead className="text-xs text-right">Branch Revenue</TableHead>
                  <TableHead className="text-xs text-right">Royalty Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-sm font-medium">{inv.branchName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{inv.month} {inv.year}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] text-primary bg-primary/10 border-primary/20">{methodLabel(inv.method)}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-center tabular-nums">{inv.studentCount ?? 0}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{formatPKR(inv.branchRevenue)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums font-semibold">{formatPKR(inv.royaltyAmount)}</TableCell>
                    <TableCell>
                      {inv.status === 'paid' ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-500/10 border-emerald-500/20">Paid</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-rose-600 bg-rose-500/10 border-rose-500/20">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.status === 'paid' ? (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{inv.paidDate ? new Date(inv.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => handlePay(inv.id)} disabled={payingId === inv.id}>
                          {payingId === inv.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                          Mark Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {editingBranch && (
        <SetRoyaltyModal
          branch={editingBranch}
          existing={settingsByBranchId.get(editingBranch.id)}
          onClose={() => setEditingBranch(null)}
          onSaved={() => { setEditingBranch(null); refreshRoyalty(); }}
        />
      )}
    </div>
  );
}

// ============== Set Royalty Modal — choose method (per_student | fixed | percentage) ==============
function SetRoyaltyModal({ branch, existing, onClose, onSaved }: { branch: any; existing: any; onClose: () => void; onSaved: () => void }) {
  const [method, setMethod] = useState<string>(existing?.method || 'per_student');
  const [amount, setAmount] = useState<string>(existing?.amount ? String(existing.amount) : '');
  const [percentage, setPercentage] = useState<string>(existing?.percentage ? String(existing.percentage) : '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (method === 'percentage') {
      const p = Number(percentage);
      if (!p || p <= 0 || p > 100) { toast({ title: 'Enter a valid percentage (1-100)', variant: 'destructive' }); return; }
    } else {
      const a = Number(amount);
      if (!a || a <= 0) { toast({ title: 'Enter a valid amount', variant: 'destructive' }); return; }
    }
    setSaving(true);
    try {
      const body: any = { branchId: branch.id, method };
      if (method === 'percentage') body.percentage = Number(percentage);
      else body.amount = Number(amount);
      await api.setRoyaltySettings(body);
      toast({ title: 'Royalty settings saved', description: `${branch.name} — ${method === 'per_student' ? 'Per Student' : method === 'fixed' ? 'Fixed' : 'Percentage'}` });
      onSaved();
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md">
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-1">Set Royalty Method</h3>
          <p className="text-sm text-muted-foreground mb-4">{branch.name}</p>
          <div className="space-y-3">
            <div>
              <Label>Royalty Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_student">Per Student (PKR per student / month)</SelectItem>
                  <SelectItem value="fixed">Fixed (PKR fixed per month)</SelectItem>
                  <SelectItem value="percentage">Percentage (% of branch revenue)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {method === 'percentage' ? (
              <div>
                <Label>Percentage (%)</Label>
                <Input type="number" value={percentage} onChange={e => setPercentage(e.target.value)} placeholder="e.g. 5" className="mt-1" autoFocus />
                <p className="text-[11px] text-muted-foreground mt-1">Branch pays this % of its monthly revenue as royalty.</p>
              </div>
            ) : (
              <div>
                <Label>Amount (PKR {method === 'per_student' ? 'per student per month' : 'fixed per month'})</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={method === 'per_student' ? 'e.g. 200' : 'e.g. 25000'} className="mt-1" autoFocus />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {method === 'per_student' ? 'Royalty = amount × number of students in branch.' : 'Fixed monthly royalty regardless of student count.'}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-5">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={saving} onClick={save}>
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Saving…</> : 'Save Royalty'}
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ============== 4. Teachers & Salaries View ==============
function InstituteTeachersView({ finance, loading, onRefresh }: any) {
  const kpi = finance?.kpi || {};
  const teachers = Array.isArray(finance?.teacherSalarySummary) ? finance.teacherSalarySummary : [];
  const [query, setQuery] = useState('');
  const [salaryModal, setSalaryModal] = useState<any>(null); // teacher or null
  const [payModal, setPayModal] = useState<any>(null); // teacher or null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t: any) =>
      t.name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.branch?.toLowerCase().includes(q)
    );
  }, [teachers, query]);

  const avgSalary = teachers.length > 0
    ? Math.round(teachers.reduce((s: number, t: any) => s + (t.monthlySalary || 0), 0) / teachers.length)
    : 0;

  if (loading) return <Card className="p-6"><LoadingState label="Loading teachers…" /></Card>;
  if (!finance) return <EmptyState icon={Users} title="No teacher data" desc="Teacher salary information will appear here once teachers are added to branches." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Teachers & Salaries" subtitle="Manage teacher monthly salaries and record payouts" action={
        <Button size="sm" variant="outline" onClick={() => {
          const rows = (finance?.teacherSalarySummary || []).map((t: any) => [t.name, t.email, t.branch, t.monthlySalary, t.totalPaid, t.lastPaidDate || 'Never', t.paymentsCount, t.status]);
          exportToCSV(`teachers-salaries-${new Date().toISOString().slice(0, 10)}`, ['Teacher', 'Email', 'Branch', 'Monthly Salary (PKR)', 'Total Paid (PKR)', 'Last Paid Date', 'Payments Count', 'Status'], rows);
        }}><Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV</Button>
      } />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <KPICard icon={Users} label="Total Teachers" value={String(kpi.teachers || 0)} sub="Across all branches" />
        <KPICard icon={TrendingDown} label="Monthly Salary Expense" value={formatPKR(kpi.monthlySalaryExpense)} sub="Recurring / month" />
        <KPICard icon={Wallet} label="Total Salary Paid" value={formatPKR(kpi.totalSalaryPaid)} sub="All-time payouts" />
        <KPICard icon={Scale} label="Avg Salary" value={formatPKR(avgSalary)} sub="Per teacher / month" />
      </div>

      {/* Teachers salary table */}
      <Card className="p-5 border border-border rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base">Teacher Salary Management</h3>
            <p className="text-xs text-muted-foreground">Set monthly salaries and record payouts</p>
          </div>
          <div className="relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search teacher, email, branch…"
              className="pl-8 h-9 w-64"
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No teachers found" desc="No teachers match your search." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Teacher</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Branch</TableHead>
                <TableHead className="text-xs text-right">Monthly Salary</TableHead>
                <TableHead className="text-xs text-right">Total Paid</TableHead>
                <TableHead className="text-xs">Last Paid</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm font-medium">{t.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.email}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.branch}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums font-semibold">{t.monthlySalary > 0 ? formatPKR(t.monthlySalary) : '—'}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums text-emerald-700">{formatPKR(t.totalPaid)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {t.lastPaidDate ? new Date(t.lastPaidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                  </TableCell>
                  <TableCell>
                    {t.status === 'Blocked' ? (
                      <Badge variant="outline" className="text-[10px] text-rose-600 bg-rose-500/10 border-rose-500/20">Blocked</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-primary bg-primary/10 border-primary/20">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setSalaryModal(t)}>
                        <Wallet className="h-3 w-3 mr-1" /> Set Salary
                      </Button>
                      <Button size="sm" className="h-7 px-2 text-xs bg-primary hover:bg-primary/90 text-white" onClick={() => setPayModal(t)}>
                        <DollarSign className="h-3 w-3 mr-1" /> Pay
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Recent salary payments */}
      <RecentSalaryPayments finance={finance} />

      {salaryModal && (
        <SetSalaryModal
          teacher={salaryModal}
          onClose={() => setSalaryModal(null)}
          onSaved={() => { setSalaryModal(null); onRefresh(); }}
        />
      )}
      {payModal && (
        <PaySalaryModal
          teacher={payModal}
          onClose={() => setPayModal(null)}
          onSaved={() => { setPayModal(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

function RecentSalaryPayments({ finance }: { finance: any }) {
  const recentTx = Array.isArray(finance?.recentTransactions) ? finance.recentTransactions : [];
  const salaries = recentTx.filter((t: any) => t.type === 'Salary Payout').slice(0, 8);
  return (
    <Card className="p-5 border border-border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base">Recent Salary Payments</h3>
          <p className="text-xs text-muted-foreground">Latest recorded payouts to teachers</p>
        </div>
      </div>
      {salaries.length === 0 ? (
        <EmptyState icon={Wallet} title="No payouts yet" desc="Recorded salary payments will appear here." />
      ) : (
        <div className="space-y-2">
          {salaries.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-accent/30 transition">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
                  <Wallet className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{s.party}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {s.date ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} · {s.method}
                  </div>
                </div>
              </div>
              <div className="text-sm font-bold tabular-nums text-rose-600">-{formatPKR(s.amount)}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SetSalaryModal({ teacher, onClose, onSaved }: { teacher: any; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState(String(teacher?.monthlySalary || ''));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const n = Number(amount);
    if (!n || n <= 0) {
      toast({ title: 'Enter a valid salary amount', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.setTeacherSalary(teacher.id, n);
      toast({ title: 'Salary updated', description: `${teacher.name} — ${formatPKR(n)}/month` });
      onSaved();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md">
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-1">Set Monthly Salary</h3>
          <p className="text-sm text-muted-foreground mb-4">{teacher.name} · {teacher.branch}</p>
          <div className="space-y-3">
            <div>
              <Label>Monthly Salary (PKR)</Label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 45000"
                className="mt-1"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground mt-1">Enter the gross monthly salary for this teacher.</p>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={saving} onClick={save}>
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Saving…</> : 'Save Salary'}
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function PaySalaryModal({ teacher, onClose, onSaved }: { teacher: any; onClose: () => void; onSaved: () => void }) {
  const now = new Date();
  const [month, setMonth] = useState(MONTHS[now.getMonth()]);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [amount, setAmount] = useState(String(teacher?.monthlySalary || ''));
  const [method, setMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const n = Number(amount);
    const y = Number(year);
    if (!n || n <= 0) { toast({ title: 'Enter a valid amount', variant: 'destructive' }); return; }
    if (!y || y < 2000) { toast({ title: 'Enter a valid year', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await api.payTeacherSalary({
        teacherId: teacher.id,
        month,
        year: y,
        amount: n,
        paymentMethod: method,
        notes: notes || undefined,
      });
      toast({ title: 'Payment recorded', description: `${teacher.name} — ${formatPKR(n)} for ${month} ${y}` });
      onSaved();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md my-8">
        <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
          <h3 className="font-bold text-lg mb-1">Record Salary Payment</h3>
          <p className="text-sm text-muted-foreground mb-4">{teacher.name} · {teacher.branch}</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Month</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year</Label>
                <Input type="number" value={year} onChange={e => setYear(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Amount (PKR)</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 45000" className="mt-1" />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Reference number, remarks…" className="mt-1 resize-none" />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={saving} onClick={save}>
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Recording…</> : 'Record Payment'}
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ============== 5. Students View ==============
function InstituteStudentsView({ finance, loading }: any) {
  const kpi = finance?.kpi || {};
  const students = Array.isArray(finance?.studentFeeSummary) ? finance.studentFeeSummary : [];
  const classDist = Array.isArray(finance?.classDistribution) ? finance.classDistribution : [];
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s: any) =>
      s.name?.toLowerCase().includes(q) ||
      s.class?.toLowerCase().includes(q) ||
      s.branch?.toLowerCase().includes(q)
    );
  }, [students, query]);

  const withPending = students.filter((s: any) => s.pending > 0).length;
  const avgFee = students.length > 0
    ? Math.round(students.reduce((sum: number, s: any) => sum + (s.total || 0), 0) / students.length)
    : 0;

  const pieColors = [NAVY, '#2c5282', '#4a7ba8', '#6b9cc4', '#8fb6d6', ROSE, '#f59e0b', '#10b981'];

  if (loading) return <Card className="p-6"><LoadingState label="Loading students…" /></Card>;
  if (!finance) return <EmptyState icon={GraduationCap} title="No student data" desc="Students will appear here once they are enrolled in branches." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Students" subtitle="Institute-wide student records and fee analytics" action={
        <Button size="sm" variant="outline" onClick={() => {
          const rows = (finance?.studentFeeSummary || []).map((s: any) => [s.name, s.class, s.section, s.branch, s.invoices, s.paid, s.pending, s.total, s.status]);
          exportToCSV(`students-${new Date().toISOString().slice(0, 10)}`, ['Student', 'Class', 'Section', 'Branch', 'Invoices', 'Paid (PKR)', 'Pending (PKR)', 'Total (PKR)', 'Status'], rows);
        }}><Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV</Button>
      } />

      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard icon={GraduationCap} label="Total Students" value={String(kpi.students || 0)} sub="Across all branches" />
        <KPICard icon={AlertCircle} label="Pending Fees" value={String(withPending)} sub="Students with unpaid invoices" tone={withPending > 0 ? 'negative' : 'default'} />
        <KPICard icon={Scale} label="Avg Fee / Student" value={formatPKR(avgFee)} sub="Across all invoices" />
      </div>

      {/* Class distribution + table */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 border border-border rounded-lg shadow-sm">
          <h3 className="font-bold text-base mb-1">Class Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Students per class</p>
          {classDist.length === 0 ? (
            <LoadingState label="No class data" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={classDist}
                    dataKey="students"
                    nameKey="class"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {classDist.map((_: any, i: number) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto scroll-fancy">
                {classDist.slice(0, 8).map((c: any, i: number) => (
                  <div key={c.class} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                      {c.class}
                    </span>
                    <span className="font-semibold tabular-nums">{c.students}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="p-5 border border-border rounded-lg shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-base">All Students</h3>
              <p className="text-xs text-muted-foreground">Fee status per student</p>
            </div>
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search name, class, branch…"
                className="pl-8 h-9 w-64"
              />
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No students found" desc="No students match your search." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Class</TableHead>
                  <TableHead className="text-xs">Section</TableHead>
                  <TableHead className="text-xs">Branch</TableHead>
                  <TableHead className="text-xs text-right">Paid</TableHead>
                  <TableHead className="text-xs text-right">Pending</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm font-medium">{s.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.class}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.section}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.branch}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-emerald-700">{formatPKR(s.paid)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-rose-600">{formatPKR(s.pending)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums font-semibold">{formatPKR(s.total)}</TableCell>
                    <TableCell>
                      {s.pending > 0 ? (
                        <Badge variant="outline" className="text-[10px] text-rose-600 bg-rose-500/10 border-rose-500/20">Pending</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-500/10 border-emerald-500/20">Settled</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filtered.length > 100 && (
            <div className="text-xs text-muted-foreground text-center mt-3">Showing first 100 of {filtered.length} students</div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ============== 6. Reports & Analytics View ==============
function InstituteReportsView({ finance, branches, loading }: any) {
  const yearly = Array.isArray(finance?.yearlyRevenue) ? finance.yearlyRevenue : [];
  const branchPerf = Array.isArray(finance?.branchPerformance) ? finance.branchPerformance : [];
  const classDist = Array.isArray(finance?.classDistribution) ? finance.classDistribution : [];
  const studentFees = Array.isArray(finance?.studentFeeSummary) ? finance.studentFeeSummary : [];

  if (loading) return <Card className="p-6"><LoadingState label="Loading reports…" /></Card>;
  if (!finance) return <EmptyState icon={TrendingUp} title="No report data" desc="Yearly analytics will appear here once you have fee invoices and salary payouts." />;

  // Insights
  const topBranch = [...branchPerf].sort((a, b) => b.revenue - a.revenue)[0];
  const topClass = [...classDist].sort((a, b) => b.students - a.students)[0];
  const topPending = [...studentFees].sort((a, b) => b.pending - a.pending)[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Yearly trends, branch comparison and key insights" action={
        <Button size="sm" variant="outline" onClick={() => {
          const rows = (finance?.branchPerformance || []).map((b: any) => [b.name, b.city, b.manager, b.students, b.teachers, b.revenue, b.pendingFees, b.salaryPaid, b.net, b.status]);
          exportToCSV(`branch-comparison-${new Date().toISOString().slice(0, 10)}`, ['Branch', 'City', 'Manager', 'Students', 'Teachers', 'Revenue (PKR)', 'Pending Fees (PKR)', 'Salary Paid (PKR)', 'Net Balance (PKR)', 'Status'], rows);
        }}><Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV</Button>
      } />

      {/* Yearly revenue vs salary */}
      <Card className="p-5 border border-border rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base">Yearly Revenue vs Salary</h3>
            <p className="text-xs text-muted-foreground">Last 5 years — grouped comparison</p>
          </div>
        </div>
        {yearly.length === 0 ? (
          <LoadingState label="No yearly data" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearly} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => (v / 1000) + 'k'} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                formatter={(v: any, name: any) => [formatPKR(v), name === 'revenue' ? 'Revenue' : 'Salary']}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => (v === 'revenue' ? 'Revenue' : 'Salary')} />
              <Bar dataKey="revenue" fill={NAVY} radius={[3, 3, 0, 0]} />
              <Bar dataKey="salary" fill={ROSE} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Insights cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border border-border rounded-lg shadow-sm">
          <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center mb-2"><Network className="h-5 w-5 text-primary" /></div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Top Branch by Revenue</div>
          <div className="text-lg font-bold mt-1">{topBranch?.name || '—'}</div>
          <div className="text-xs text-emerald-700 font-semibold mt-0.5">{topBranch ? formatPKR(topBranch.revenue) : formatPKR(0)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{topBranch ? `${topBranch.students} students · ${topBranch.teachers} teachers` : ''}</div>
        </Card>
        <Card className="p-5 border border-border rounded-lg shadow-sm">
          <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center mb-2"><BookOpen className="h-5 w-5 text-primary" /></div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Top Class by Students</div>
          <div className="text-lg font-bold mt-1">{topClass?.class || '—'}</div>
          <div className="text-xs text-primary font-semibold mt-0.5">{topClass ? `${topClass.students} students` : ''}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{topClass ? `${formatPKR(topClass.paid)} collected` : ''}</div>
        </Card>
        <Card className="p-5 border border-border rounded-lg shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-rose-500/10 grid place-items-center mb-3"><AlertCircle className="h-5 w-5 text-rose-600" /></div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Highest Pending Fees</div>
          <div className="text-lg font-bold mt-1">{topPending?.name || '—'}</div>
          <div className="text-xs text-rose-600 font-semibold mt-0.5">{topPending ? formatPKR(topPending.pending) : formatPKR(0)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{topPending ? `${topPending.class} · ${topPending.branch}` : ''}</div>
        </Card>
      </div>

      {/* Branch comparison table */}
      <Card className="p-5 border border-border rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base">Branch Comparison</h3>
            <p className="text-xs text-muted-foreground">Per-branch financial performance</p>
          </div>
        </div>
        {branchPerf.length === 0 ? (
          <EmptyState icon={Network} title="No branches" desc="Add branches to see comparison." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Branch</TableHead>
                <TableHead className="text-xs text-center">Students</TableHead>
                <TableHead className="text-xs text-center">Teachers</TableHead>
                <TableHead className="text-xs text-right">Revenue</TableHead>
                <TableHead className="text-xs text-right">Pending Fees</TableHead>
                <TableHead className="text-xs text-right">Salary Paid</TableHead>
                <TableHead className="text-xs text-right">Net Balance</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchPerf.map((br: any) => (
                <TableRow key={br.id}>
                  <TableCell className="text-sm font-medium">{br.name}</TableCell>
                  <TableCell className="text-xs text-center tabular-nums">{br.students}</TableCell>
                  <TableCell className="text-xs text-center tabular-nums">{br.teachers}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums text-emerald-700">{formatPKR(br.revenue)}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums text-rose-600">{formatPKR(br.pendingFees)}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{formatPKR(br.salaryPaid)}</TableCell>
                  <TableCell className={`text-xs text-right tabular-nums font-semibold ${br.net >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{formatPKR(br.net)}</TableCell>
                  <TableCell>
                    {br.status === 'Blocked' ? (
                      <Badge variant="outline" className="text-[10px] text-rose-600 bg-rose-500/10 border-rose-500/20">Blocked</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-primary bg-primary/10 border-primary/20">Active</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Class distribution table */}
      <Card className="p-5 border border-border rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base">Class Distribution</h3>
            <p className="text-xs text-muted-foreground">Per-class fee analytics</p>
          </div>
        </div>
        {classDist.length === 0 ? (
          <EmptyState icon={BookOpen} title="No class data" desc="Enroll students to see class distribution." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Class</TableHead>
                <TableHead className="text-xs text-center">Students</TableHead>
                <TableHead className="text-xs text-right">Collected</TableHead>
                <TableHead className="text-xs text-right">Pending</TableHead>
                <TableHead className="text-xs text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classDist.map((c: any) => (
                <TableRow key={c.class}>
                  <TableCell className="text-sm font-medium">{c.class}</TableCell>
                  <TableCell className="text-xs text-center tabular-nums">{c.students}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums text-emerald-700">{formatPKR(c.paid)}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums text-rose-600">{formatPKR(c.pending)}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums font-semibold">{formatPKR(c.paid + c.pending)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

// ============== Branch Management View (full-page, replaces popup modal) ==============
// Shown when an Institute Admin clicks a branch card. Mirrors the Branch Manager portal
// with Teachers | Students | Classes & Courses | Fee Management tabs and the full
// BranchManagerPortal content for the selected branch.
const BRANCH_TABS = [
  { id: 'teachers', label: 'Teachers', icon: Users },
  { id: 'branch-students', label: 'Students', icon: GraduationCap },
  { id: 'class-courses', label: 'Classes & Courses', icon: BookOpen },
  { id: 'fees', label: 'Fee Management', icon: DollarSign },
] as const;

function BranchManagementView({ branch, user, onBack, onRefresh }: {
  branch: any;
  user: any;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<(typeof BRANCH_TABS)[number]['id']>('teachers');
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [blocked, setBlocked] = useState<boolean>(branch.blocked === 1 || branch.blocked === true);

  // Build a modified user object that overrides branchId/branchName with the selected branch.
  // The BranchManagerPortal reads user.branchId to scope all its queries.
  const modifiedUser = useMemo(() => ({
    ...user,
    branchId: branch.id,
    branchName: branch.name,
  }), [user, branch]);

  const isBlocked = blocked;

  const toggleBlock = async () => {
    try {
      await api.blockBranch(branch.id, !blocked, !blocked ? 'Blocked by Institute Admin' : '');
      setBlocked(!blocked);
      toast({
        title: blocked ? 'Branch unblocked' : 'Branch blocked',
        description: blocked ? 'Access restored' : 'All teachers and students blocked (cascade)',
      });
      onRefresh();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteBranch(branch.id);
      toast({ title: 'Branch deleted', description: `${branch.name} and all its data have been removed.` });
      setShowDelete(false);
      onBack();
      onRefresh();
    } catch (e: any) {
      toast({ title: 'Failed to delete', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5">
      {/* Top bar: Back button + branch name + edit/block/delete */}
      <Card className="p-4 sm:p-5 border border-border rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-border hover:bg-accent transition text-sm font-medium shrink-0"
              title="Back to Branches"
            >
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to Branches</span>
            </button>
            <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 grid place-items-center text-primary">
              <Network className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">{branch.name}</h1>
                <Badge variant="outline" className={isBlocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]'}>
                  {isBlocked ? 'Blocked' : 'Active'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {branch.city || '—'}</span>
                <span>·</span>
                <span>Manager: {branch.manager || '—'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}>
              <Edit className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={toggleBlock}
              className={isBlocked ? 'text-rose-600 border-rose-500/30 hover:bg-rose-500/10' : 'text-primary border-[oklch(0.5_0.04_260)_/_0.3] hover:bg-accent0/10'}
            >
              {isBlocked ? <><Lock className="h-3.5 w-3.5 mr-1" /> Unblock</> : <><Unlock className="h-3.5 w-3.5 mr-1" /> Block</>}
            </Button>
            <Button size="sm" variant="outline" className="text-rose-600 border-rose-500/30 hover:bg-rose-500/10" onClick={() => setShowDelete(true)}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Sub-navigation tabs: Teachers | Students | Classes & Courses | Fee Management */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/60 overflow-x-auto scroll-fancy">
        {BRANCH_TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Content area: Branch Manager Portal for the selected branch (controlled by the tab) */}
      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <BranchManagerPortal activeModule={tab} user={modifiedUser} />
      </motion.div>

      {showEdit && (
        <EditBranchModal br={branch} instituteId={user?.instituteId} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onRefresh(); }} />
      )}
      {showDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50" onClick={() => setShowDelete(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-rose-100 grid place-items-center"><Trash2 className="h-6 w-6 text-rose-600" /></div>
                <div><h3 className="font-bold text-lg">Delete Branch?</h3><p className="text-sm text-muted-foreground">This action cannot be undone.</p></div>
              </div>
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 mb-4">
                This will permanently delete <strong>{branch.name}</strong> and ALL its data: teachers, students, classes, courses, attendance, results, and materials.
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white flex-1" onClick={handleDelete}>Delete Permanently</Button>
                <Button size="sm" variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// ============== Branch Card (opens full management page on click, not a popup) ==============
function BranchCard({ br, instituteId, onRefresh, onSelectBranch }: { br: any; instituteId: string; onRefresh: () => void; onSelectBranch: (br: any) => void }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [blocked, setBlocked] = useState<boolean>(br.blocked === 1 || br.blocked === true);

  const isBlocked = blocked;
  const statusLabel = isBlocked ? 'Blocked' : 'Active';
  const statusClass = isBlocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]';

  const toggleBlock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.blockBranch(br.id, !blocked, !blocked ? 'Blocked by Institute Admin' : '');
      setBlocked(!blocked);
      toast({ title: blocked ? 'Branch unblocked' : 'Branch blocked', description: blocked ? 'Access restored' : 'All teachers and students blocked (cascade)' });
      onRefresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };

  const handleDelete = async () => {
    try {
      await api.deleteBranch(br.id);
      toast({ title: 'Branch deleted', description: `${br.name} and all its data have been removed.` });
      setShowDelete(false);
      onRefresh();
    } catch (e: any) { toast({ title: 'Failed to delete', description: e.message, variant: 'destructive' }); }
  };

  return (
    <>
      <Card className={`p-5 hover:shadow-lg transition relative cursor-pointer border border-border rounded-lg shadow-sm group ${isBlocked ? 'ring-1 ring-rose-500/30' : ''}`} onClick={() => onSelectBranch(br)}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 grid place-items-center text-primary">
              <Network className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate">{br.name}</h3>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {br.city || '—'}</div>
              <Badge variant="outline" className={`text-[10px] font-medium mt-1.5 ${statusClass}`}>{statusLabel}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition shrink-0">
            <span className="text-[10px] font-medium">Manage</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
          <div className="text-xs">
            <div className="text-muted-foreground">Manager</div>
            <div className="font-medium truncate">{br.manager || '—'}</div>
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEdit(true)} title="Edit" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition"><Edit className="h-4 w-4" /></button>
            <button type="button" onClick={toggleBlock} title={isBlocked ? 'Unblock' : 'Block'} className={`h-8 w-8 grid place-items-center rounded-lg transition ${isBlocked ? 'text-rose-600 hover:bg-rose-500/10' : 'text-primary hover:bg-accent'}`}>{isBlocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</button>
            <button type="button" onClick={() => setShowDelete(true)} title="Delete branch" className="h-8 w-8 grid place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10 transition"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      </Card>

      {showEdit && <EditBranchModal br={br} instituteId={instituteId} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onRefresh(); }} />}
      {showDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50" onClick={() => setShowDelete(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-rose-100 grid place-items-center"><Trash2 className="h-6 w-6 text-rose-600" /></div>
                <div><h3 className="font-bold text-lg">Delete Branch?</h3><p className="text-sm text-muted-foreground">This action cannot be undone.</p></div>
              </div>
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 mb-4">
                This will permanently delete <strong>{br.name}</strong> and ALL its data: teachers, students, classes, courses, attendance, results, and materials.
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white flex-1" onClick={handleDelete}>Delete Permanently</Button>
                <Button size="sm" variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

// ============== Edit Branch Modal ==============
function EditBranchModal({ br, instituteId, onClose, onSaved }: { br: any; instituteId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: br.name, managerName: br.manager || '', managerEmail: br.managerEmail || '', managerPassword: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      // Find the branch manager user
      const users = await api.platformUsers({ branchId: br.id, role: 'branch-manager' });
      if (users.length > 0) {
        const body: any = {};
        if (form.managerName) body.name = form.managerName;
        if (form.managerEmail) body.email = form.managerEmail;
        if (form.managerPassword) body.password = form.managerPassword;
        await api.editUser(users[0].id, body);
      }
      toast({ title: 'Branch updated!' });
      onSaved();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md my-8">
        <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
          <h3 className="font-bold text-lg mb-4">Edit Branch</h3>
          <div className="space-y-3">
            <div><Label>Branch Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" disabled /></div>
            <div className="pt-2 border-t border-border/40"><div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Branch Manager</div></div>
            <div><Label>Manager Name</Label><Input value={form.managerName} onChange={e => setForm({...form, managerName: e.target.value})} className="mt-1" /></div>
            <div><Label>Manager Email</Label><Input value={form.managerEmail} onChange={e => setForm({...form, managerEmail: e.target.value})} className="mt-1" /></div>
            <div><Label>New Password (leave blank to keep current)</Label><Input type="text" value={form.managerPassword} onChange={e => setForm({...form, managerPassword: e.target.value})} placeholder="Set new password" className="mt-1" /></div>
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

// ============== Add Branch Modal ==============
function BranchModal({ show, setShow, instituteId, onRefresh, lastCreated, setLastCreated }: any) {
  const [form, setForm] = useState({ name: '', city: '', managerName: '', managerEmail: '', managerPassword: '' });
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!form.name || !form.managerEmail || !form.managerPassword) { toast({ title: 'Branch name, manager email and password are required', variant: 'destructive' }); return; }
    setCreating(true);
    try {
      const res = await api.createBranch({ ...form, instituteId });
      toast({ title: 'Branch created!', description: `${res.branch.name} — manager login ready` });
      setLastCreated(res); setForm({ name: '', city: '', managerName: '', managerEmail: '', managerPassword: '' }); onRefresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setCreating(false); }
  };

  if (!show && !lastCreated) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 overflow-y-auto" onClick={() => { setShow(false); setLastCreated(null); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg my-8">
        <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
          {lastCreated ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-accent0/15 grid place-items-center"><CheckCircle2 className="h-6 w-6 text-primary" /></div>
                <div><h3 className="font-bold text-lg">Branch created!</h3><p className="text-sm text-muted-foreground">{lastCreated.branch.name}</p></div>
              </div>
              <div className="rounded-xl bg-accent0/5 border border-[oklch(0.5_0.04_260)_/_0.2] p-4 space-y-2 text-sm">
                <div className="font-semibold text-primary dark:text-primary/70">Branch Manager login credentials</div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span className="font-mono">{lastCreated.managerLogin.email}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Password</span><span className="font-mono">{lastCreated.managerLogin.password}</span></div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-[oklch(0.5_0.04_260)_/_0.2]">The manager must change this password on first login. Share these credentials securely.</div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" onClick={() => { setShow(false); setLastCreated(null); }}>Done</Button>
                <Button size="sm" variant="outline" onClick={() => setLastCreated(null)}>Add Another</Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-bold text-lg mb-1">Add a new branch</h3>
              <p className="text-sm text-muted-foreground mb-5">You will set the Branch Manager's email and password. They must change it on first login.</p>
              <div className="space-y-3">
                <div><Label>Branch name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. North Campus" className="mt-1" /></div>
                <div><Label>City</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Dallas" className="mt-1" /></div>
                <div className="pt-2 border-t border-border/40"><div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Branch Manager — You set the credentials</div></div>
                <div><Label>Manager name</Label><Input value={form.managerName} onChange={e => setForm({...form, managerName: e.target.value})} placeholder="Lisa Chen" className="mt-1" /></div>
                <div><Label>Manager email *</Label><Input type="email" value={form.managerEmail} onChange={e => setForm({...form, managerEmail: e.target.value})} placeholder="manager@school.edu" className="mt-1" /></div>
                <div><Label>Assign password *</Label><Input type="text" value={form.managerPassword} onChange={e => setForm({...form, managerPassword: e.target.value})} placeholder="Set a password for the manager" className="mt-1" /></div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={creating} onClick={create}>{creating ? 'Creating…' : 'Create Branch'}</Button>
                <Button size="sm" variant="outline" onClick={() => setShow(false)}>Cancel</Button>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ============== Fee Management View (institute-wide) ==============
// Institute-wide fee collection dashboard. Uses real data from the institute
// finance endpoint (`finance.branchPerformance`) plus per-branch fee finance
// (paid/pending invoices) fetched in parallel for accurate figures.
function InstituteFeeManagement({ finance, branches, loading }: any) {
  const [branchFees, setBranchFees] = useState<Record<string, any>>({});
  const [feeLoading, setFeeLoading] = useState(false);

  const branchPerf = Array.isArray(finance?.branchPerformance) ? finance.branchPerformance : [];

  // Fetch each branch's real fee finance (paid invoices, pending fees) in parallel.
  // These give us real pending fee figures the institute endpoint doesn't track.
  const refreshBranchFees = async () => {
    if (!branches || branches.length === 0) return;
    setFeeLoading(true);
    try {
      const results: any[] = await Promise.all(
        branches.map((br: any) =>
          api.getBranchFinance(br.id)
            .then((d: any) => [br.id, d])
            .catch(() => [br.id, null])
        )
      );
      const map: Record<string, any> = {};
      for (const [id, d] of results) if (d) map[id as string] = d;
      setBranchFees(map);
    } finally {
      setFeeLoading(false);
    }
  };

  useEffect(() => { refreshBranchFees(); }, [branches]);

  // Build a unified per-branch fee row combining institute-level revenue with branch-level fee detail
  const rows = branchPerf.map((br: any) => {
    const bf = branchFees[br.id];
    const pendingFees = bf?.kpi?.pendingFees ?? br.pendingFees ?? 0;
    const totalCollected = bf?.kpi?.totalRevenue ?? br.revenue ?? 0;
    const paidInvoices = bf?.kpi?.paidInvoices ?? 0;
    const unpaidInvoices = bf?.kpi?.unpaidInvoices ?? 0;
    const totalInvoices = bf?.kpi?.totalInvoices ?? 0;
    const net = (br.net ?? 0) || (totalCollected - (bf?.kpi?.totalSalaryPaid ?? 0));
    return {
      id: br.id,
      name: br.name,
      city: br.city,
      students: br.students ?? 0,
      teachers: br.teachers ?? 0,
      collected: totalCollected,
      pending: pendingFees,
      net,
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      status: br.status,
    };
  });

  const totalCollected = rows.reduce((s: number, r: any) => s + Number(r.collected || 0), 0);
  const totalPending = rows.reduce((s: number, r: any) => s + Number(r.pending || 0), 0);
  const branchesWithCollections = rows.filter((r: any) => Number(r.collected) > 0).length;
  const avgPerBranch = rows.length > 0 ? Math.round(totalCollected / rows.length) : 0;

  if (loading) return <Card className="p-6"><LoadingState label="Loading fee data…" /></Card>;
  if (!finance && !feeLoading) return <EmptyState icon={CreditCard} title="No fee data" desc="Fee collection analytics will appear here once branches start generating invoices." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Management"
        subtitle="Institute-wide fee collection across all branches"
        action={
          <Button size="sm" variant="outline" onClick={() => {
            const rows2 = rows.map((r: any) => [r.name, r.city || '—', r.students, r.teachers, r.collected, r.pending, r.net, r.paidInvoices, r.unpaidInvoices, r.totalInvoices, r.status]);
            exportToCSV(`institute-fees-${new Date().toISOString().slice(0, 10)}`, ['Branch', 'City', 'Students', 'Teachers', 'Collected (PKR)', 'Pending (PKR)', 'Net (PKR)', 'Paid Invoices', 'Unpaid Invoices', 'Total Invoices', 'Status'], rows2);
          }}><Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV</Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <KPICard icon={DollarSign} label="Total Collected" value={formatPKR(totalCollected)} sub={`${branchesWithCollections} branches`} tone="positive" />
        <KPICard icon={AlertCircle} label="Total Pending" value={formatPKR(totalPending)} sub="Unpaid invoices" tone={totalPending > 0 ? 'negative' : 'default'} />
        <KPICard icon={Network} label="Branches with Collections" value={String(branchesWithCollections)} sub={`${rows.length} total branches`} />
        <KPICard icon={Scale} label="Avg Collection / Branch" value={formatPKR(avgPerBranch)} sub="Mean across branches" />
      </div>

      <Card className="border border-border rounded-lg shadow-sm p-3 sm:p-4">
        <div className="mb-4">
          <h3 className="font-bold text-base">Branch-wise Fee Collection</h3>
          <p className="text-xs text-muted-foreground">Real fee data per branch — collected, pending, and net balance</p>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={Network} title="No branches yet" desc="Add branches to see fee collection analytics." />
        ) : (
          <div className="max-h-96 overflow-y-auto scroll-fancy">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Branch</TableHead>
                  <TableHead className="text-xs text-center">Students</TableHead>
                  <TableHead className="text-xs text-right">Collected</TableHead>
                  <TableHead className="text-xs text-right">Pending</TableHead>
                  <TableHead className="text-xs text-center">Invoices (Paid / Total)</TableHead>
                  <TableHead className="text-xs text-right">Net</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium">{r.name}</TableCell>
                    <TableCell className="text-xs text-center tabular-nums">{r.students}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-emerald-700">{formatPKR(r.collected)}</TableCell>
                    <TableCell className={`text-xs text-right tabular-nums ${r.pending > 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>{formatPKR(r.pending)}</TableCell>
                    <TableCell className="text-xs text-center tabular-nums">{r.paidInvoices} / {r.totalInvoices}</TableCell>
                    <TableCell className={`text-xs text-right tabular-nums font-semibold ${r.net >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{formatPKR(r.net)}</TableCell>
                    <TableCell>
                      {r.status === 'Blocked' ? (
                        <Badge variant="outline" className="text-[10px] text-rose-600 bg-rose-500/10 border-rose-500/20">Blocked</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-primary bg-primary/10 border-primary/20">Active</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============== Academics View (cross-branch attendance + results) ==============
function InstituteAcademics({ user, branches }: any) {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.getAttendance().then(r => Array.isArray(r) ? r : []).catch(() => []),
      api.getResults().then(r => Array.isArray(r) ? r : []).catch(() => []),
    ]).then(([att, res]) => {
      if (!active) return;
      setAttendance(att);
      setResults(res);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.instituteId]);

  // Group attendance sessions by branchId
  const attendanceByBranch = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of attendance) {
      const bid = s.branchId || 'unknown';
      if (!map[bid]) map[bid] = [];
      map[bid].push(s);
    }
    return map;
  }, [attendance]);

  // Group results by branchId
  const resultsByBranch = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const r of results) {
      const bid = r.branchId || 'unknown';
      if (!map[bid]) map[bid] = [];
      map[bid].push(r);
    }
    return map;
  }, [results]);

  // Per-branch attendance summary rows
  const attendanceRows = (branches || []).map((br: any) => {
    const sessions = attendanceByBranch[br.id] || [];
    let present = 0, absent = 0, late = 0, total = 0;
    for (const s of sessions) {
      for (const rec of (Array.isArray(s.records) ? s.records : [])) {
        total++;
        if (rec.status === 'Present') present++;
        else if (rec.status === 'Absent') absent++;
        else if (rec.status === 'Late') late++;
      }
    }
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { id: br.id, name: br.name, sessions: sessions.length, present, absent, late, total, rate };
  });

  // Per-branch results summary rows
  const resultsRows = (branches || []).map((br: any) => {
    const exams = resultsByBranch[br.id] || [];
    let totalMarksSum = 0, marksObtainedSum = 0;
    const evaluatedStudents = new Set<string>();
    for (const r of exams) {
      for (const rec of (Array.isArray(r.records) ? r.records : [])) {
        if (rec.studentId) evaluatedStudents.add(rec.studentId);
        totalMarksSum += Number(r.totalMarks) || 0;
        marksObtainedSum += Number(rec.marks) || 0;
      }
    }
    const avgScore = totalMarksSum > 0 ? Math.round((marksObtainedSum / totalMarksSum) * 100) : 0;
    return { id: br.id, name: br.name, exams: exams.length, evaluated: evaluatedStudents.size, avgScore };
  });

  if (loading) return <Card className="p-6"><LoadingState label="Loading academics…" /></Card>;

  return (
    <div className="space-y-6">
      <PageHeader title="Academics" subtitle="Cross-branch attendance and results overview" />

      {/* Attendance Overview */}
      <Card className="border border-border rounded-lg shadow-sm p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-4">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <div>
            <h3 className="font-bold text-base">Attendance Overview</h3>
            <p className="text-xs text-muted-foreground">Sessions recorded per branch with present / absent / late counts</p>
          </div>
        </div>
        {!branches || branches.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No branches" desc="Add branches to see attendance analytics." />
        ) : attendanceRows.every((r: any) => r.sessions === 0) ? (
          <EmptyState icon={CalendarCheck} title="No attendance recorded yet" desc="Once teachers start marking attendance from their portal, sessions will appear here." />
        ) : (
          <div className="max-h-96 overflow-y-auto scroll-fancy">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Branch</TableHead>
                  <TableHead className="text-xs text-center">Sessions</TableHead>
                  <TableHead className="text-xs text-center">Present</TableHead>
                  <TableHead className="text-xs text-center">Absent</TableHead>
                  <TableHead className="text-xs text-center">Late</TableHead>
                  <TableHead className="text-xs text-center">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRows.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium">{r.name}</TableCell>
                    <TableCell className="text-xs text-center tabular-nums">{r.sessions}</TableCell>
                    <TableCell className="text-xs text-center tabular-nums text-emerald-700">{r.present}</TableCell>
                    <TableCell className="text-xs text-center tabular-nums text-rose-600">{r.absent}</TableCell>
                    <TableCell className="text-xs text-center tabular-nums text-amber-700">{r.late}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-[10px] font-mono ${r.rate >= 75 ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20' : r.rate >= 50 ? 'text-amber-700 bg-amber-500/10 border-amber-500/20' : r.rate > 0 ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-muted-foreground bg-muted border-border'}`}>
                        {r.sessions === 0 ? '—' : r.rate + '%'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Results Overview */}
      <Card className="border border-border rounded-lg shadow-sm p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-4 w-4 text-primary" />
          <div>
            <h3 className="font-bold text-base">Results Overview</h3>
            <p className="text-xs text-muted-foreground">Exams conducted and average scores per branch</p>
          </div>
        </div>
        {!branches || branches.length === 0 ? (
          <EmptyState icon={Award} title="No branches" desc="Add branches to see results analytics." />
        ) : resultsRows.every((r: any) => r.exams === 0) ? (
          <EmptyState icon={Award} title="No results posted yet" desc="When teachers post exam results from their portal, summaries will appear here." />
        ) : (
          <div className="max-h-96 overflow-y-auto scroll-fancy">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Branch</TableHead>
                  <TableHead className="text-xs text-center">Exams Conducted</TableHead>
                  <TableHead className="text-xs text-center">Students Evaluated</TableHead>
                  <TableHead className="text-xs text-center">Avg Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultsRows.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium">{r.name}</TableCell>
                    <TableCell className="text-xs text-center tabular-nums">{r.exams}</TableCell>
                    <TableCell className="text-xs text-center tabular-nums">{r.evaluated}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-[10px] font-mono ${r.exams === 0 ? 'text-muted-foreground bg-muted border-border' : r.avgScore >= 50 ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-600 bg-rose-500/10 border-rose-500/20'}`}>
                        {r.exams === 0 ? '—' : r.avgScore + '%'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============== Complaints View (institute-wide) ==============
function InstituteComplaints({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [parents, setParents] = useState<Record<string, any>>({});
  const [branches, setBranches] = useState<any[]>([]);
  const [responding, setResponding] = useState<any | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => {
    if (!user?.instituteId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      api.getComplaints({ instituteId: user.instituteId }).then(r => Array.isArray(r) ? r : []).catch(() => []),
      api.branches(user.instituteId).then(r => Array.isArray(r) ? r : []).catch(() => []),
    ]).then(([cmp, brs]) => {
      setComplaints(cmp);
      setBranches(brs);
      // Fetch parent users for this institute to map parentId -> name
      return api.platformUsers({ instituteId: user.instituteId, role: 'parent' })
        .then(r => {
          const map: Record<string, any> = {};
          for (const p of (Array.isArray(r) ? r : [])) map[p.id] = p;
          setParents(map);
        }).catch(() => {});
    }).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [user?.instituteId]);

  const stats = useMemo(() => {
    const open = complaints.filter((c: any) => String(c.status || 'Open').toLowerCase() !== 'resolved').length;
    const resolved = complaints.filter((c: any) => String(c.status || '').toLowerCase() === 'resolved').length;
    return { total: complaints.length, open, resolved };
  }, [complaints]);

  const parentName = (pid?: string) => pid ? (parents[pid]?.name || 'Parent') : 'Anonymous';
  const branchName = (bid?: string) => bid ? (branches.find((b: any) => b.id === bid)?.name || '—') : '—';

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

  if (loading) return <Card className="p-6"><LoadingState label="Loading complaints…" /></Card>;

  return (
    <div className="space-y-6">
      <PageHeader title="Complaints" subtitle={`Parent & student complaints across all branches · ${user?.instituteName || ''}`} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard icon={MessageCircleWarning} label="Total Complaints" value={String(stats.total)} sub="Across all branches" />
        <KPICard icon={AlertCircle} label="Open" value={String(stats.open)} sub="Awaiting response" tone={stats.open > 0 ? 'negative' : 'default'} />
        <KPICard icon={MailCheck} label="Resolved" value={String(stats.resolved)} sub="Closed" tone={stats.resolved > 0 ? 'positive' : 'default'} />
      </div>

      {complaints.length === 0 ? (
        <EmptyState icon={MessageCircleWarning} title="No complaints received" desc="When parents or students raise a concern via their portal, it will appear here for you to respond to." />
      ) : (
        <Card className="border border-border rounded-lg shadow-sm p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircleWarning className="h-4 w-4 text-primary" />
            <div>
              <h3 className="font-bold text-base">All Complaints</h3>
              <p className="text-xs text-muted-foreground">{complaints.length} total · institute-wide</p>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto scroll-fancy">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Parent</TableHead>
                  <TableHead className="text-xs">Subject</TableHead>
                  <TableHead className="text-xs">Branch</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((c: any) => {
                  const isResolved = String(c.status || '').toLowerCase() === 'resolved';
                  return (
                    <TableRow key={c.id} className="align-top">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</TableCell>
                      <TableCell className="text-sm">{parentName(c.parentId)}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{c.subject || '—'}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2 max-w-md">{c.message || ''}</div>
                        {c.response && (
                          <div className="mt-1 text-[11px] text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-1 inline-block">
                            <strong>Reply:</strong> {c.response}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{branchName(c.branchId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={isResolved ? 'text-[10px] text-emerald-700 bg-emerald-500/10 border-emerald-500/20' : 'text-[10px] text-rose-600 bg-rose-500/10 border-rose-500/20'}>
                          {isResolved ? 'Resolved' : 'Open'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="h-8 text-xs" disabled={isResolved}
                          onClick={() => { setResponding(c); setResponseText(c.response || ''); }}>
                          {isResolved ? 'Resolved' : <><MessageCircleWarning className="h-3.5 w-3.5 mr-1" /> Respond</>}
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

// ============== Events View (institute-wide) ==============
function InstituteEvents({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', location: '', type: 'Event' });
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => {
    if (!user?.instituteId) { setLoading(false); return; }
    setLoading(true);
    api.getEvents({ instituteId: user.instituteId })
      .then(r => setEvents(Array.isArray(r) ? r : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { refresh(); }, [user?.instituteId]);

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
        location: form.location.trim(),
        type: form.type,
        instituteId: user.instituteId,
        branchId: null, // Institute-level event, not bound to a branch
      });
      toast({ title: 'Event created', description: `"${form.title.trim()}" was added to your institute calendar.` });
      setForm({ title: '', description: '', startDate: '', location: '', type: 'Event' });
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

  if (loading) return <Card className="p-6"><LoadingState label="Loading events…" /></Card>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        subtitle={`Institute calendar & announcements · ${user?.instituteName || ''}`}
        action={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowCreate(v => !v)}><CalendarPlus className="h-4 w-4 mr-1.5" /> Create Event</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard icon={Trophy} label="Total Events" value={String(stats.total)} sub="In your institute calendar" />
        <KPICard icon={CalendarPlus} label="Upcoming Events" value={String(stats.upcoming)} sub="Scheduled today or later" tone={stats.upcoming > 0 ? 'positive' : 'default'} />
      </div>

      {events.length === 0 ? (
        <EmptyState icon={Trophy} title="No events yet" desc="Create your first institute event — exams, holidays, meetings, or any announcement parents and students should know about."
          action={<Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowCreate(true)}><CalendarPlus className="h-4 w-4 mr-1.5" /> Create Event</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
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
                {e.startDate && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
              <h3 className="font-bold text-lg mb-1">Create Institute Event</h3>
              <p className="text-sm text-muted-foreground mb-4">Add an event to your institute calendar. Visible across all branches.</p>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Annual Sports Day" className="mt-1" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Short description of the event…" className="mt-1 resize-none" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1" /></div>
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
                <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Main Auditorium" className="mt-1" /></div>
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

// ============== Announcements View ==============
function AnnouncementsView({ user }: { user: any }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', message: '', targetScope: 'all', targetType: 'branch-manager', selectedIds: [] as string[] });
  const [targets, setTargets] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = () => { api.getAnnouncements().then(setAnnouncements).catch(() => {}); };
  useEffect(() => { refresh(); setLoading(false); }, []);

  const loadTargets = async (type: string) => {
    if (type === 'all') { setTargets([]); return; }
    const role = type === 'branch' ? 'branch-manager' : type;
    const users = await api.platformUsers({ instituteId: user.instituteId, role });
    setTargets(Array.isArray(users) ? users : []);
  };

  const send = async () => {
    if (!form.title || !form.message) { toast({ title: 'Title and message required', variant: 'destructive' }); return; }
    setSending(true);
    try {
      await api.createAnnouncement({
        title: form.title, message: form.message,
        targetRole: form.targetType === 'branch' ? 'branch-manager' : form.targetType,
        targetScope: form.targetScope,
        targetIds: form.targetScope === 'specific' ? form.selectedIds : undefined,
      });
      toast({ title: 'Announcement sent!' });
      setForm({ title: '', message: '', targetScope: 'all', targetType: 'branch-manager', selectedIds: [] });
      setShowForm(false); refresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSending(false); }
  };

  const del = async (id: string) => {
    try {
      await api.deleteAnnouncement(id);
      toast({ title: 'Announcement deleted' });
      refresh();
    } catch (e: any) { toast({ title: 'Failed to delete', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold tracking-tight">Announcements</h1><p className="text-sm text-muted-foreground mt-1">Send messages to branches, teachers, or students</p></div>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowForm(v => !v)}><Megaphone className="h-4 w-4 mr-1.5" /> New Announcement</Button>
      </div>
      {showForm && (
        <Card className="p-5">
          <h3 className="font-bold text-base mb-4">New Announcement</h3>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Schedule change" className="mt-1" /></div>
            <div><Label>Message</Label><Textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={3} placeholder="Type your announcement…" className="mt-1 resize-none" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Recipients</Label>
                <Select value={form.targetType} onValueChange={v => { setForm({...form, targetType: v, targetScope: 'all', selectedIds: []}); loadTargets(v); }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch-manager">All Branch Managers</SelectItem>
                    <SelectItem value="teacher">All Teachers</SelectItem>
                    <SelectItem value="student">All Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Scope</Label>
                <Select value={form.targetScope} onValueChange={v => setForm({...form, targetScope: v, selectedIds: []})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {form.targetType === 'branch-manager' ? 'Branches' : form.targetType + 's'}</SelectItem>
                    <SelectItem value="specific">Specific {form.targetType === 'branch-manager' ? 'Branches' : form.targetType + 's'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.targetScope === 'specific' && targets.length > 0 && (
              <div className="max-h-48 overflow-y-auto scroll-fancy space-y-1.5 border border-border/60 rounded-lg p-3">
                {targets.map((t: any) => (
                  <label key={t.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-accent">
                    <input type="checkbox" checked={form.selectedIds.includes(t.id)} onChange={e => {
                      if (e.target.checked) setForm({...form, selectedIds: [...form.selectedIds, t.id]});
                      else setForm({...form, selectedIds: form.selectedIds.filter((id:string) => id !== t.id)});
                    }} className="custom-checkbox w-4 h-4 rounded" />
                    <span className="text-sm">{t.name}</span>
                  </label>
                ))}
              </div>
            )}
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={sending} onClick={send}>{sending ? 'Sending…' : <><Send className="h-4 w-4 mr-1.5" /> Send</>}</Button>
          </div>
        </Card>
      )}
      {loading ? <LoadingState label="Loading announcements…" /> : announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" desc="Send messages to all or specific branches, teachers, or students." />
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /><div className="font-medium text-sm">{a.title}</div></div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
                  {(a.senderId === user.id || user.role === 'super-admin') && (
                    <button onClick={() => del(a.id)} title="Delete" className="h-7 w-7 grid place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10 transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground ml-6">{a.message}</p>
              <div className="text-[11px] text-muted-foreground mt-2 ml-6">To: {a.targetScope === 'all' ? `All ${a.targetRole || 'users'}` : `Specific ${a.targetRole || 'users'}`}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
