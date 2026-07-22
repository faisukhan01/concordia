'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2, Users, Network, Plus, Crown, MapPin, CheckCircle2,
  Server, Building, Lock, Unlock, Edit, Megaphone, Send, MessageSquare,
  ChevronDown, ChevronRight, UserCog, Mail, Settings, ShieldCheck, Palette, Loader2,
  Trash2, X,
  DollarSign, AlertCircle, Wallet, Scale, FileText, TrendingUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/lib/store';

// ---- Format helpers ----
const formatPKR = (n: any) => 'PKR ' + Number(n || 0).toLocaleString('en-PK');
const formatCompact = (n: number) => {
  const v = Number(n || 0);
  if (Math.abs(v) >= 1_000_000) return 'PKR ' + (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return 'PKR ' + (v / 1_000).toFixed(0) + 'k';
  return 'PKR ' + v;
};

// ---- CSV export helper ----
function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: any) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ---- Month names constant ----
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---------- Main router ----------
export function SuperAdminPortal({ activeModule, user }: { activeModule: string; user: any }) {
  // Top-level data shared across the dashboard and institutes pages
  const [overview, setOverview] = useState<any>(null);
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [institutesLoading, setInstitutesLoading] = useState(true);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Loading state defaults to `true` (initial load). On later refreshes we keep the
  // previously-fetched data visible until the new data arrives, which is better UX than
  // flashing a spinner on every refresh. We therefore only ever flip loading → false here.
  const refreshOverview = () => {
    api.platformOverview()
      .then(setOverview)
      .catch(() => {})
      .finally(() => setOverviewLoading(false));
  };
  const refreshInstitutes = () => {
    api.institutes()
      .then(setInstitutes)
      .catch(() => {})
      .finally(() => setInstitutesLoading(false));
  };
  const refreshFinance = () => {
    api.getPlatformFinance()
      .then(setFinance)
      .catch(() => {})
      .finally(() => setFinanceLoading(false));
  };

  useEffect(() => {
    refreshOverview();
    refreshInstitutes();
    refreshFinance();
  }, []);

  const refreshAll = () => { refreshOverview(); refreshInstitutes(); refreshFinance(); };

  if (activeModule === 'institutes') {
    return (
      <InstitutesManager
        institutes={institutes}
        loading={institutesLoading}
        onRefresh={refreshAll}
        showAdd={showAdd}
        setShowAdd={setShowAdd}
      />
    );
  }
  if (activeModule === 'platform-analytics') {
    return <PlatformAnalytics finance={finance} financeLoading={financeLoading} institutes={institutes} onRefresh={refreshFinance} />;
  }
  if (activeModule === 'announcements') {
    return <AnnouncementsView user={user} institutes={institutes} institutesLoading={institutesLoading} />;
  }
  if (activeModule === 'config') {
    return <PlatformConfig overview={overview} loading={overviewLoading} />;
  }
  if (activeModule === 'branding') {
    return <BrandingPage />;
  }
  // Default: dashboard overview
  return (
    <PlatformOverview
      overview={overview}
      overviewLoading={overviewLoading}
      onAddInstitute={() => setShowAdd(true)}
      onRefreshAll={refreshAll}
      user={user}
      showAdd={showAdd}
      setShowAdd={setShowAdd}
    />
  );
}

// ---------- Shared UI bits ----------
function ModuleHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action }: any) {
  return (
    <Card className="p-10 text-center">
      <div className="inline-flex h-14 w-14 rounded-2xl bg-muted/60 items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

function LoadingState({ label = 'Loading…', className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2.5 py-10 text-muted-foreground ${className}`}>
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function StatPill({ label, value, color = 'text-foreground' }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="rounded-lg bg-muted/40 border border-border/60 px-3 py-2 text-center">
      <div className={`text-lg font-extrabold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

// ---------- Dashboard overview (default landing for super admin) ----------
function PlatformOverview({
  overview, overviewLoading, onAddInstitute, onRefreshAll, user, showAdd, setShowAdd,
}: any) {
  const setActiveModule = useApp(s => s.setActiveModule);
  const cards = [
    { label: 'Institutions', value: overview?.institutes ?? 0, icon: Building2, color: 'from-primary to-primary/80', sub: `${overview?.activeInstitutes ?? 0} active` },
    { label: 'Branches', value: overview?.branches ?? 0, icon: Network, color: 'from-primary to-primary/80', sub: 'across all institutions' },
    { label: 'Total Students', value: overview?.totalStudents ?? 0, icon: Users, color: 'from-primary/80 to-primary', sub: 'platform-wide' },
    { label: 'Total Staff', value: overview?.totalStaff ?? 0, icon: UserCog, color: 'from-primary/80 to-primary', sub: 'teachers & managers' },
  ];

  const quickActions = [
    { icon: TrendingUp, title: 'View Analytics', subtitle: 'Revenue, salary, institute performance & transactions', target: 'platform-analytics' as const },
    { icon: Building2, title: 'Manage Institutes', subtitle: 'Provision, edit, block or remove institutions', target: 'institutes' as const },
    { icon: MessageSquare, title: 'Send Announcement', subtitle: 'Broadcast messages to institutes & branches', target: 'announcements' as const },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 sm:p-8 text-white"
      >
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-[oklch(0.5_0.04_260)_/_0.15] blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15">
              <Crown className="h-3 w-3 text-primary/70" /> Super Admin · Platform Owner
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Welcome back, {user?.name?.split(' ')[0] || 'Owner'}
            </h1>
            <p className="text-white/80 text-sm mt-1.5 max-w-lg">
              {overviewLoading ? 'Loading platform stats…' : (overview?.institutes ? `${overview.institutes} institutions onboarded.` : 'Provision your first institute to get started.')}
            </p>
          </div>
          <Button className="bg-white text-primary hover:bg-accent" size="sm" onClick={onAddInstitute}>
            <Plus className="h-4 w-4 mr-1.5" /> Provision Institute
          </Button>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {overviewLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-3">
              <div className="h-11 w-11 rounded-xl bg-muted/60 animate-pulse" />
              <div className="mt-4 h-7 w-16 rounded bg-muted/60 animate-pulse" />
              <div className="mt-1.5 h-3 w-24 rounded bg-muted/40 animate-pulse" />
            </Card>
          ))
        ) : (
          cards.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-2.5 sm:p-3 hover:shadow-md transition border border-border rounded-lg shadow-sm">
                <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-4">
                  <div className="text-xl sm:text-2xl font-bold tabular-nums">
                    {typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{c.sub}</div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="mb-3">
          <h2 className="font-bold text-base">Quick Actions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Jump straight to common platform workflows</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((a) => (
            <div
              key={a.target}
              onClick={() => setActiveModule(a.target)}
              className="group border border-border rounded-lg shadow-sm hover:shadow-md transition cursor-pointer p-3 sm:p-4 flex items-center gap-4"
            >
              <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 grid place-items-center">
                <a.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-base">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{a.subtitle}</div>
              </div>
              <ChevronRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <ProvisionInstituteModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); onRefreshAll(); }}
        />
      )}
    </div>
  );
}

// ---------- Platform Analytics (dedicated financial analytics page) ----------
function PlatformAnalytics({ finance, financeLoading, institutes, onRefresh }: any) {
  const finKpis = finance?.kpi;
  const finLoading = financeLoading || !finance;

  // ---- Revenue form state ----
  const currentMonthName = MONTHS[new Date().getMonth()];
  const [revInstituteId, setRevInstituteId] = useState<string>('');
  const [revMonth, setRevMonth] = useState<string>(currentMonthName);
  const [revYear, setRevYear] = useState<string>(String(new Date().getFullYear()));
  const [revAmount, setRevAmount] = useState<string>('');
  const [revSubmitting, setRevSubmitting] = useState(false);
  const [revDeletingId, setRevDeletingId] = useState<string | null>(null);

  const selectedInstitute = institutes?.find((i: any) => i.id === revInstituteId);
  const noInstitutes = !institutes || institutes.length === 0;

  const handleAddRevenue = async () => {
    if (!revInstituteId || !revMonth || !revYear || !revAmount) {
      toast({ title: 'Missing fields', description: 'Please select institute, month, year and enter an amount.', variant: 'destructive' });
      return;
    }
    const amountNum = Number(revAmount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast({ title: 'Invalid amount', description: 'Amount must be a positive number.', variant: 'destructive' });
      return;
    }
    setRevSubmitting(true);
    try {
      const res: any = await api.addRevenue({
        sourceType: 'institute',
        sourceId: revInstituteId,
        sourceName: selectedInstitute?.name || '',
        amount: amountNum,
        month: revMonth,
        year: Number(revYear),
        notes: '',
      });
      toast({
        title: res?.updated ? 'Revenue updated' : 'Revenue added',
        description: `${selectedInstitute?.name || 'Institute'} · ${formatPKR(amountNum)} for ${revMonth} ${revYear}`,
      });
      setRevAmount('');
      onRefresh?.();
    } catch (e: any) {
      toast({ title: 'Failed to add revenue', description: e?.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setRevSubmitting(false);
    }
  };

  const handleDeleteRevenue = async (id: string) => {
    setRevDeletingId(id);
    try {
      await api.deleteRevenue(id);
      toast({ title: 'Revenue entry deleted' });
      onRefresh?.();
    } catch (e: any) {
      toast({ title: 'Failed to delete', description: e?.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setRevDeletingId(null);
    }
  };

  const revenueEntries: any[] = Array.isArray(finance?.revenueEntries) ? finance.revenueEntries : [];

  const handleExportInstitutePerformance = () => {
    if (!finance?.institutePerformance) return;
    const rows: (string | number)[][] = finance.institutePerformance.map((inst: any) => [
      inst.name || '',
      inst.city || '',
      inst.admin || '',
      Number(inst.branches || 0),
      Number(inst.students || 0),
      Number(inst.revenue || 0),
      Number(inst.pendingFees || 0),
      Number(inst.salaryPaid || 0),
      Number(inst.net || 0),
      inst.status || '',
    ]);
    exportToCSV('institute-performance', ['Institute', 'City', 'Admin', 'Branches', 'Students', 'Revenue', 'Pending Fees', 'Salary Paid', 'Net', 'Status'], rows);
    toast({ title: 'CSV exported', description: 'Institute performance downloaded as institute-performance.csv' });
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Analytics"
        subtitle="Revenue, salary and institute performance insights"
        actions={
          <Button
            size="sm"
            variant="outline"
            className="border-border"
            onClick={handleExportInstitutePerformance}
            disabled={finLoading || !finance?.institutePerformance?.length}
          >
            <FileText className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        }
      />

      {/* Revenue Management — manual entry form */}
      <Card className="border border-border rounded-lg shadow-sm p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Revenue Management
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Enter monthly revenue received from each institute</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Institute</Label>
            <Select value={revInstituteId} onValueChange={setRevInstituteId} disabled={noInstitutes}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={noInstitutes ? 'Add institutes first' : 'Select institute'} />
              </SelectTrigger>
              <SelectContent>
                {institutes?.map((inst: any) => (
                  <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Month</Label>
            <Select value={revMonth} onValueChange={setRevMonth}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select month" /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Year</Label>
            <Input
              type="number"
              className="mt-1"
              value={revYear}
              onChange={(e) => setRevYear(e.target.value)}
              placeholder={String(new Date().getFullYear())}
              min={2000}
              max={2100}
            />
          </div>
          <div>
            <Label className="text-xs">Amount (PKR)</Label>
            <Input
              type="number"
              className="mt-1"
              value={revAmount}
              onChange={(e) => setRevAmount(e.target.value)}
              placeholder="e.g. 50000"
              min={0}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={handleAddRevenue}
            disabled={revSubmitting || noInstitutes}
          >
            {revSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving…</>
            ) : (
              <><Plus className="h-4 w-4 mr-1.5" /> Add Revenue</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Re-entering an existing institute + month + year will update the amount.
          </p>
        </div>
      </Card>

      {/* Revenue Entries table */}
      <Card className="border border-border rounded-lg shadow-sm p-3 sm:p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Revenue Entries
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              All manually-entered revenue across institutes{revenueEntries.length > 0 ? ` · ${revenueEntries.length} entr${revenueEntries.length === 1 ? 'y' : 'ies'}` : ''}
            </p>
          </div>
        </div>
        {revenueEntries.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No revenue entries yet. Add your first entry above.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Institute</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueEntries.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.sourceName || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{r.month}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{r.year}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-emerald-600 whitespace-nowrap">{formatPKR(r.amount)}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">{r.notes || '—'}</TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        aria-label="Delete revenue entry"
                        className="h-8 w-8 grid place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleDeleteRevenue(r.id)}
                        disabled={revDeletingId === r.id}
                      >
                        {revDeletingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Financial KPI cards (platform-wide finance) */}
      {finLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5 border border-border rounded-lg shadow-sm">
              <div className="h-11 w-11 rounded-xl bg-muted/60 animate-pulse" />
              <div className="mt-4 h-6 w-20 rounded bg-muted/60 animate-pulse" />
              <div className="mt-1.5 h-3 w-24 rounded bg-muted/40 animate-pulse" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          {/* Total Revenue */}
          <Card className="p-2.5 sm:p-3 hover:shadow-md transition border border-border rounded-lg shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4">
              <div className="text-base sm:text-lg font-extrabold tabular-nums truncate">{formatPKR(finKpis.totalRevenue)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total Revenue</div>
            </div>
          </Card>
          {/* Pending Fees */}
          <Card className="p-2.5 sm:p-3 hover:shadow-md transition border border-border rounded-lg shadow-sm">
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 grid place-items-center">
              <AlertCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div className="mt-4">
              <div className="text-base sm:text-lg font-extrabold tabular-nums truncate text-rose-600">{formatPKR(finKpis.pendingFees)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Pending Fees</div>
            </div>
          </Card>
          {/* Salary Paid */}
          <Card className="p-2.5 sm:p-3 hover:shadow-md transition border border-border rounded-lg shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4">
              <div className="text-base sm:text-lg font-extrabold tabular-nums truncate">{formatPKR(finKpis.totalSalaryPaid)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Salary Paid</div>
            </div>
          </Card>
          {/* Net Balance */}
          <Card className="p-2.5 sm:p-3 hover:shadow-md transition border border-border rounded-lg shadow-sm">
            <div className={`h-9 w-9 rounded-lg grid place-items-center ${finKpis.netBalance >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              <Scale className={`h-5 w-5 ${finKpis.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
            </div>
            <div className="mt-4">
              <div className={`text-base sm:text-lg font-extrabold tabular-nums truncate ${finKpis.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatPKR(finKpis.netBalance)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Net Balance</div>
            </div>
          </Card>
          {/* Total Invoices */}
          <Card className="p-2.5 sm:p-3 hover:shadow-md transition border border-border rounded-lg shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4">
              <div className="text-base sm:text-lg font-extrabold tabular-nums">{Number(finKpis.totalInvoices || 0).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total Invoices</div>
              <div className="text-[11px] text-muted-foreground mt-1">{finKpis.paidInvoices} paid · {finKpis.unpaidInvoices} unpaid</div>
            </div>
          </Card>
          {/* Active Institutes */}
          <Card className="p-2.5 sm:p-3 hover:shadow-md transition border border-border rounded-lg shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4">
              <div className="text-base sm:text-lg font-extrabold tabular-nums">{Number(finKpis.activeInstitutes || 0).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Active Institutes</div>
            </div>
          </Card>
        </div>
      )}

      {/* Charts row — monthly revenue vs salary + yearly trend */}
      {finLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="p-5 border border-border rounded-lg shadow-sm">
              <div className="h-5 w-56 rounded bg-muted/60 animate-pulse" />
              <div className="h-3 w-72 mt-1.5 rounded bg-muted/40 animate-pulse" />
              <div className="mt-6 h-64 rounded bg-muted/40 animate-pulse" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5 border border-border rounded-lg shadow-sm">
            <div>
              <h3 className="font-bold text-base">Platform Revenue vs Salary (Last 12 Months)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly fee collection vs salary payouts across all institutes</p>
            </div>
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finance.monthlyRevenue} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={72} />
                  <Tooltip formatter={(v: any) => formatPKR(Number(v))} contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#1a365d" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="salary" name="Salary" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5 border border-border rounded-lg shadow-sm">
            <div>
              <h3 className="font-bold text-base">Yearly Revenue Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">5-year comparison</p>
            </div>
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={finance.yearlyRevenue} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a365d" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1a365d" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gradSal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={72} />
                  <Tooltip formatter={(v: any) => formatPKR(Number(v))} contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#1a365d" strokeWidth={2} fill="url(#gradRev)" />
                  <Area type="monotone" dataKey="salary" name="Salary" stroke="#e11d48" strokeWidth={2} fill="url(#gradSal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Institute Performance table */}
      {finLoading ? (
        <Card className="p-5 border border-border rounded-lg shadow-sm">
          <div className="h-5 w-44 rounded bg-muted/60 animate-pulse" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 rounded bg-muted/40 animate-pulse" />
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-5 border border-border rounded-lg shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Institute Performance
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Revenue comparison across all institutes (sorted by revenue, desc)</p>
            </div>
            <Button size="sm" variant="outline" className="border-border shrink-0" onClick={handleExportInstitutePerformance}>
              <FileText className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Institute</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead className="text-right">Branches</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Pending Fees</TableHead>
                  <TableHead className="text-right">Salary Paid</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finance.institutePerformance.map((inst: any) => (
                  <TableRow key={inst.id}>
                    <TableCell className="font-medium">{inst.name}</TableCell>
                    <TableCell className="text-muted-foreground">{inst.city || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{inst.admin}</TableCell>
                    <TableCell className="text-right tabular-nums">{inst.branches}</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(inst.students || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatPKR(inst.revenue)}</TableCell>
                    <TableCell className="text-right tabular-nums text-rose-600">{formatPKR(inst.pendingFees)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPKR(inst.salaryPaid)}</TableCell>
                    <TableCell className={`text-right tabular-nums font-medium ${inst.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatPKR(inst.net)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-medium ${
                        inst.status === 'Blocked' ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' :
                        inst.status === 'Trial' ? 'text-amber-700 bg-amber-500/10 border-amber-500/20' :
                        'text-primary bg-primary/10 border-primary/20'
                      }`}>{inst.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Recent Platform Transactions table */}
      {finLoading ? (
        <Card className="p-5 border border-border rounded-lg shadow-sm">
          <div className="h-5 w-48 rounded bg-muted/60 animate-pulse" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 rounded bg-muted/40 animate-pulse" />
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-5 border border-border rounded-lg shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-base">Recent Platform Transactions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Latest fee payments and salary payouts across the platform</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finance.recentTransactions.slice(0, 10).map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{tx.date ? new Date(tx.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] font-medium ${
                      tx.type === 'Fee Payment' ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20' :
                      'text-rose-600 bg-rose-500/10 border-rose-500/20'
                    }`}>{tx.type}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{tx.party}</TableCell>
                  <TableCell className="text-muted-foreground">{tx.method || '—'}</TableCell>
                  <TableCell className={`text-right tabular-nums font-medium whitespace-nowrap ${
                    tx.type === 'Fee Payment' ? 'text-emerald-700' : 'text-rose-600'
                  }`}>{formatPKR(tx.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ---------- Institutes manager (dedicated page) ----------
function InstitutesManager({ institutes, loading, onRefresh, showAdd, setShowAdd }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Institutes"
        subtitle="Provision institutions — click any card to expand and view branches"
        actions={
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Provision Institute
          </Button>
        }
      />
      {loading ? (
        <Card className="p-5"><LoadingState label="Loading institutes…" /></Card>
      ) : institutes.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No institutions yet"
          desc="Provision your first institute. You'll set the admin's email and password."
          action={
            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Provision Institute
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutes.map((inst: any) => (
            <InstituteCard key={inst.id} inst={inst} onRefresh={onRefresh} />
          ))}
        </div>
      )}
      {showAdd && (
        <ProvisionInstituteModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ---------- Institute card (opens modal popup on click) ----------
function InstituteCard({ inst, onRefresh }: { inst: any; onRefresh: () => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [blocked, setBlocked] = useState<boolean>(inst.blocked === 1 || inst.blocked === true);

  const isBlocked = blocked || inst.status === 'Blocked';
  const statusLabel = isBlocked ? 'Blocked' : (inst.status === 'Trial' ? 'Trial' : 'Active');
  const statusClass = isBlocked
    ? 'text-rose-600 bg-rose-500/10 border-rose-500/20'
    : inst.status === 'Trial'
      ? 'text-sky-700 bg-sky-500/10 border-sky-500/20'
      : 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]';

  const toggleBlock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.blockInstitute(inst.id, !blocked, !blocked ? 'Blocked by Super Admin' : '');
      setBlocked(!blocked);
      toast({
        title: blocked ? 'Institute unblocked' : 'Institute blocked',
        description: blocked ? 'Access restored to all branches & users' : 'All branches and users are now blocked (cascade)',
      });
      onRefresh();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteInstitute(inst.id);
      toast({ title: 'Institute deleted', description: `${inst.name} and all its data have been removed.` });
      setShowDelete(false);
      onRefresh();
    } catch (e: any) {
      toast({ title: 'Failed to delete', description: e.message, variant: 'destructive' });
    }
  };

  const initials = (inst.short || inst.name || '').slice(0, 2).toUpperCase();

  return (
    <>
      <Card
        className={`p-5 hover:shadow-md transition relative cursor-pointer border border-border rounded-lg shadow-sm ${isBlocked ? 'ring-1 ring-rose-500/30' : ''}`}
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 grid place-items-center text-primary font-extrabold">
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate">{inst.name}</h3>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {inst.city ? `${inst.city}, ` : ''}{inst.country || '—'}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className="text-[10px] font-normal border-border/60">{inst.plan || 'Starter'}</Badge>
                <Badge variant="outline" className={`text-[10px] font-medium ${statusClass}`}>{statusLabel}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
          <div className="text-xs min-w-0">
            <div className="text-muted-foreground">Admin</div>
            <div className="font-medium truncate">{inst.adminName || '—'}</div>
          </div>
          {/* Action buttons — stop propagation so they don't open the details modal */}
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              title="Edit"
              className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggleBlock}
              title={isBlocked ? 'Unblock' : 'Block (cascades to branches & users)'}
              className={`h-8 w-8 grid place-items-center rounded-lg transition ${
                isBlocked ? 'text-rose-600 hover:bg-rose-500/10' : 'text-primary hover:bg-accent0/10'
              }`}
            >
              {isBlocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              title="Delete institute"
              className="h-8 w-8 grid place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Details modal — opens when clicking the card */}
      {showDetails && (
        <InstituteDetailsModal inst={inst} onClose={() => setShowDetails(false)} onEdit={() => { setShowDetails(false); setShowEdit(true); }} />
      )}

      {/* Edit modal */}
      {showEdit && (
        <EditInstituteModal inst={inst} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onRefresh(); }} />
      )}

      {/* Delete confirmation */}
      {showDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50" onClick={() => setShowDelete(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-rose-100 grid place-items-center"><Trash2 className="h-6 w-6 text-rose-600" /></div>
                <div><h3 className="font-bold text-lg">Delete Institute?</h3><p className="text-sm text-muted-foreground">This action cannot be undone.</p></div>
              </div>
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 mb-4">
                This will permanently delete <strong>{inst.name}</strong> and ALL its data: branches, teachers, students, classes, courses, attendance, results, and materials.
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

// ---------- Institute Details Modal (popup) ----------
function InstituteDetailsModal({ inst, onClose, onEdit }: { inst: any; onClose: () => void; onEdit: () => void }) {
  const [branches, setBranches] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.branches(inst.id).catch(() => []),
      api.scopedStats(inst.id).catch(() => null),
    ]).then(([b, s]) => {
      setBranches(Array.isArray(b) ? b : []);
      setStats(s);
      setLoading(false);
    });
  }, [inst.id]);

  const isBlocked = inst.blocked === 1 || inst.blocked === true;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-2xl my-8">
        <Card className="p-0 max-h-[90vh] overflow-y-auto scroll-fancy">
          {/* Header */}
          <div className="p-6 border-b border-border/40 bg-gradient-to-br from-accent to-muted">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 grid place-items-center shadow-md text-white font-extrabold text-lg">
                  {(inst.short || inst.name || '').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold">{inst.name}</h2>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {inst.city ? `${inst.city}, ` : ''}{inst.country || '—'}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">{inst.plan || 'Starter'}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${isBlocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]'}`}>{isBlocked ? 'Blocked' : (inst.status === 'Trial' ? 'Trial' : 'Active')}</Badge>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Stats */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Overview</div>
              <div className="grid grid-cols-3 gap-3">
                <StatPill label="Branches" value={loading ? '…' : (stats?.branches ?? inst.branches ?? 0)} color="text-primary" />
                <StatPill label="Students" value={loading ? '…' : (stats?.students ?? inst.students ?? 0)} color="text-primary" />
                <StatPill label="Staff" value={loading ? '…' : (stats?.staff ?? inst.staff ?? 0)} color="text-primary" />
              </div>
            </div>

            {/* Admin info */}
            <div className="rounded-xl bg-muted/40 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Institute Admin</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{inst.adminName || '—'}</div>
                  <div className="text-xs text-muted-foreground">{inst.adminEmail || '—'}</div>
                </div>
                <Button size="sm" variant="outline" onClick={onEdit}><Edit className="h-3.5 w-3.5 mr-1" /> Edit</Button>
              </div>
            </div>

            {/* Branches list */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center justify-between">
                <span>Branches ({branches.length})</span>
              </div>
              {loading ? (
                <LoadingState label="Loading branches…" className="py-4" />
              ) : branches.length === 0 ? (
                <div className="text-xs text-muted-foreground py-3 text-center bg-muted/30 rounded-lg">No branches yet.</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto scroll-fancy">
                  {branches.map((br: any) => <BranchRow key={br.id} br={br} />)}
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function BranchRow({ br }: { br: any }) {
  const isBlocked = br.blocked === 1 || br.blocked === true;
  return (
    <div className="rounded-lg border border-border/60 bg-background p-3 hover:bg-accent/40 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{br.name}</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {br.city || '—'}
            {br.manager && (<><span className="mx-1">·</span><UserCog className="h-3 w-3" /> {br.manager}</>)}
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] shrink-0 ${isBlocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]'}`}
        >
          {isBlocked ? 'Blocked' : 'Active'}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-border/40 text-center">
        <div>
          <div className="font-bold text-sm">{br.students ?? 0}</div>
          <div className="text-[10px] text-muted-foreground">Students</div>
        </div>
        <div>
          <div className="font-bold text-sm">{br.teachers ?? 0}</div>
          <div className="text-[10px] text-muted-foreground">Teachers</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Edit Institute modal (scrollable) ----------
function EditInstituteModal({ inst, onClose, onSaved }: any) {
  const [form, setForm] = useState({
    name: inst.name || '',
    plan: inst.plan || 'Starter',
    adminName: inst.adminName || '',
    adminEmail: inst.adminEmail || '',
    adminPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name || !form.adminEmail) {
      toast({ title: 'Institute name and admin email are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // Only include adminPassword if the user typed a new one
      const body: any = {
        name: form.name,
        plan: form.plan,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
      };
      if (form.adminPassword.trim()) body.adminPassword = form.adminPassword.trim();
      await api.editInstitute(inst.id, body);
      toast({
        title: 'Institute updated',
        description: form.adminPassword ? 'Admin password updated — they will need to use the new one.' : 'Changes saved.',
      });
      onSaved();
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] grid place-items-start sm:place-items-center p-4 bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md my-8"
      >
        <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">Edit Institute</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Update institute info and admin credentials</p>
            </div>
            <Edit className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-3">
            <div>
              <Label>Institute Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Plan</Label>
              <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2 border-t border-border/40">
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Institute Admin</div>
            </div>
            <div>
              <Label>Admin Name</Label>
              <Input value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Admin Email</Label>
              <Input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>New Password (optional)</Label>
              <Input
                type="text"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                placeholder="Leave blank to keep current"
                className="mt-1 font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">If set, the admin must use this password to log in.</p>
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ---------- Provision Institute modal (scrollable, shows actual password) ----------
function ProvisionInstituteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: '', city: '', country: 'USA', plan: 'Premium',
    adminName: '', adminEmail: '', adminPassword: '',
  });
  const [creating, setCreating] = useState(false);
  const [lastCreated, setLastCreated] = useState<any>(null);

  const create = async () => {
    if (!form.name || !form.adminEmail || !form.adminPassword) {
      toast({ title: 'Institute name, admin email and password are required', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const res = await api.createInstitute(form);
      toast({ title: 'Institute provisioned!', description: `${res.institute.name} — admin login created` });
      setLastCreated(res);
      setForm({ name: '', city: '', country: 'USA', plan: 'Premium', adminName: '', adminEmail: '', adminPassword: '' });
      onSaved();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] grid place-items-start sm:place-items-center p-4 bg-black/50 overflow-y-auto"
      onClick={() => { if (!creating) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg my-8"
      >
        <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
          {lastCreated ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-accent0/15 grid place-items-center">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Institute provisioned!</h3>
                  <p className="text-sm text-muted-foreground">{lastCreated.institute.name} is ready</p>
                </div>
              </div>
              <div className="rounded-xl bg-accent0/5 border border-[oklch(0.5_0.04_260)_/_0.2] p-4 space-y-2 text-sm">
                <div className="font-semibold text-primary dark:text-primary/70">Institute Admin login credentials</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-mono text-xs sm:text-sm break-all text-right">{lastCreated.adminLogin?.email}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Password</span>
                  <span className="font-mono text-xs sm:text-sm break-all text-right text-primary dark:text-primary/70">
                    {lastCreated.adminLogin?.password}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-[oklch(0.5_0.04_260)_/_0.2]">
                  Share these credentials securely. The admin can change their password after logging in.
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" onClick={onClose}>Done</Button>
                <Button size="sm" variant="outline" onClick={() => setLastCreated(null)}>Add Another</Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg">Provision a new institute</h3>
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                You will set the Institute Admin's email and password. They can change it after first login.
              </p>
              <div className="space-y-3">
                <div>
                  <Label>Institute name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dallas Modern School" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>City</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Dallas" className="mt-1" />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Plan</Label>
                  <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Starter">Starter — 1 branch, basic modules</SelectItem>
                      <SelectItem value="Premium">Premium — multi-branch, all modules</SelectItem>
                      <SelectItem value="Enterprise">Enterprise — unlimited, white-label</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-2 border-t border-border/40">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Institute Admin — You set the credentials
                  </div>
                </div>
                <div>
                  <Label>Admin name</Label>
                  <Input value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} placeholder="Dr. Jane Doe" className="mt-1" />
                </div>
                <div>
                  <Label>Admin email *</Label>
                  <Input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@school.edu" className="mt-1" />
                </div>
                <div>
                  <Label>Assign password *</Label>
                  <Input
                    type="text"
                    value={form.adminPassword}
                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                    placeholder="Set a password for the admin"
                    className="mt-1 font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">This is the actual password the admin will use to log in.</p>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={creating} onClick={create}>
                  {creating ? 'Provisioning…' : 'Provision Institute'}
                </Button>
                <Button size="sm" variant="outline" disabled={creating} onClick={onClose}>Cancel</Button>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ---------- Announcements view (super admin only sees their own) ----------
function AnnouncementsView({ user, institutes, institutesLoading }: { user: any; institutes: any[]; institutesLoading: boolean }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', message: '', targetScope: 'all', selectedInstitutes: [] as string[] });
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const refresh = () => {
    api.getAnnouncements()
      .then((a) => setAnnouncements(Array.isArray(a) ? a : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { refresh(); }, []);

  const send = async () => {
    if (!form.title || !form.message) {
      toast({ title: 'Title and message required', variant: 'destructive' });
      return;
    }
    if (form.targetScope === 'specific' && form.selectedInstitutes.length === 0) {
      toast({ title: 'Select at least one institute', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      await api.createAnnouncement({
        title: form.title,
        message: form.message,
        targetRole: 'institute-admin',
        targetScope: form.targetScope,
        targetIds: form.targetScope === 'specific' ? form.selectedInstitutes : undefined,
      });
      toast({
        title: 'Announcement sent!',
        description: form.targetScope === 'all' ? 'Sent to all institutes' : `Sent to ${form.selectedInstitutes.length} institute(s)`,
      });
      setForm({ title: '', message: '', targetScope: 'all', selectedInstitutes: [] });
      setShowForm(false);
      refresh();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Announcements"
        subtitle="Send messages to Institute Admins — only your announcements are shown here"
        actions={
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowForm((v) => !v)}>
            <Megaphone className="h-4 w-4 mr-1.5" /> New Announcement
          </Button>
        }
      />

      {showForm && (
        <Card className="p-5">
          <h3 className="font-bold text-base mb-4">New Announcement</h3>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Platform maintenance scheduled" className="mt-1" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Type your announcement…" className="mt-1 resize-none" />
            </div>
            <div>
              <Label>Recipients</Label>
              <Select value={form.targetScope} onValueChange={(v) => setForm({ ...form, targetScope: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institute Admins</SelectItem>
                  <SelectItem value="specific">Specific Institutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.targetScope === 'specific' && (
              <div>
                <Label>Select Institutes</Label>
                {institutesLoading ? (
                  <LoadingState label="Loading institutes…" className="py-4 border border-border/60 rounded-lg" />
                ) : (
                  <div className="mt-2 max-h-48 overflow-y-auto scroll-fancy space-y-1.5 border border-border/60 rounded-lg p-3">
                    {institutes.map((inst) => (
                      <label key={inst.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-accent">
                        <input
                          type="checkbox"
                          checked={form.selectedInstitutes.includes(inst.id)}
                          onChange={(e) => {
                            if (e.target.checked) setForm({ ...form, selectedInstitutes: [...form.selectedInstitutes, inst.id] });
                            else setForm({ ...form, selectedInstitutes: form.selectedInstitutes.filter((id) => id !== inst.id) });
                          }}
                          className="custom-checkbox w-4 h-4 rounded"
                        />
                        <span className="text-sm">{inst.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={sending} onClick={send}>
              {sending ? 'Sending…' : (<><Send className="h-4 w-4 mr-1.5" /> Send Announcement</>)}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="p-5"><LoadingState label="Loading announcements…" /></Card>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          desc="Send messages to all or specific Institute Admins."
          action={
            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowForm(true)}>
              <Megaphone className="h-4 w-4 mr-1.5" /> New Announcement
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Megaphone className="h-4 w-4 text-primary shrink-0" />
                  <div className="font-medium text-sm truncate">{a.title}</div>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6 whitespace-pre-wrap">{a.message}</p>
              <div className="text-[11px] text-muted-foreground mt-2 ml-6">
                To: {a.targetScope === 'all' ? 'All Institute Admins' : 'Specific Institutes'}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Platform Config (display-only) ----------
function PlatformConfig({ overview, loading }: { overview: any; loading: boolean }) {
  const settings = [
    { icon: Building2, label: 'Platform Name', value: 'Concordia College', desc: 'Shown across the platform UI' },
    { icon: ShieldCheck, label: 'Default Plan for New Institutes', value: 'Premium', desc: 'Pre-selected when provisioning' },
    { icon: Mail, label: 'Support Email', value: 'faisalkhan00297@gmail.com', desc: 'For all support requests' },
    { icon: Building, label: 'Max Institutes Allowed', value: loading ? '…' : (overview?.institutes ? `${overview.institutes} active` : 'Unlimited'), desc: 'Current platform cap' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader title="Platform Configuration" subtitle="Display-only platform settings — edit backend config to change values" />
      <div className="grid sm:grid-cols-2 gap-4">
        {settings.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-2.5 sm:p-3 hover:shadow-md transition border border-border rounded-lg shadow-sm">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                  <div className="font-bold text-base break-all mt-0.5">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      <Card className="p-5 border-dashed">
        <div className="flex items-start gap-3">
          <Settings className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-sm">Display-only mode</div>
            <p className="text-xs text-muted-foreground mt-1">
              These settings are read from the backend configuration. To change platform name, default plan, support email, or institute caps,
              update the backend config file. This page reflects the live values for visibility.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---------- Branding page (display-only) ----------
function BrandingPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Branding" subtitle="Platform visual identity" />
      <Card className="p-0 overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 p-8 sm:p-10 text-white">
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-[oklch(0.5_0.04_260)_/_0.15] blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15">
              <ShieldCheck className="h-3 w-3 text-primary/70" /> Platform Identity
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Concordia College</h2>
            <p className="text-blue-50/90 text-base sm:text-lg mt-1">College Management Portal</p>
            <p className="text-blue-50/70 text-sm mt-3 max-w-md">
              Modern school management for institutions worldwide — by Cyber Advance Solutions.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm">Color Theme</h3>
          </div>
          <div className="space-y-2.5">
            <ColorRow name="Primary (Navy)" hex="#1e3a5f" className="bg-blue-800" />
            <ColorRow name="Accent (Blue)" hex="#1d4ed8" className="bg-primary" />
            <ColorRow name="Highlight (Sky)" hex="#0284c7" className="bg-sky-600" />
            <ColorRow name="Neutral (Slate)" hex="#475569" className="bg-slate-600" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm">Brand Information</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Platform Name</span><span className="font-medium">Concordia College</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Tagline</span><span className="font-medium text-right">College Management Portal</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Provider</span><span className="font-medium text-right">Cyber Advance Solutions</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Theme Mode</span><span className="font-medium">Light / Dark</span></div>
          </div>
        </Card>
      </div>

      <Card className="p-5 border-dashed">
        <div className="flex items-start gap-3">
          <Settings className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-sm">Display-only</div>
            <p className="text-xs text-muted-foreground mt-1">
              Branding assets (logo, tagline, color palette) are defined in the platform theme configuration. Update the theme tokens to change the look.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ColorRow({ name, hex, className }: { name: string; hex: string; className: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-7 w-7 rounded-md ${className} ring-1 ring-black/10`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-[11px] text-muted-foreground font-mono">{hex}</div>
      </div>
    </div>
  );
}
