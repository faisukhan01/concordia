'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarCheck, GraduationCap, CreditCard, ClipboardList, CheckCircle2, XCircle, Clock, BookOpen, Award, Heart, MessageCircleWarning, Inbox, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Lazy-loaded v1.5.0 unique modules
const LiveTransportModule = lazy(() => import('@/components/dashboard/modules/live-transport'));
const CampusWalletModule = lazy(() => import('@/components/dashboard/modules/campus-wallet'));
const PtmSchedulingModule = lazy(() => import('@/components/dashboard/modules/ptm-scheduling'));
const HealthRecordsModule = lazy(() => import('@/components/dashboard/modules/health-records'));
const ComplaintPortalModule = lazy(() => import('@/components/dashboard/modules/complaint-portal'));

function ModuleFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

const fmtMoney = (n: number) => 'PKR ' + Number(n || 0).toLocaleString('en-PK');

export function ParentPortal({ activeModule, user }: { activeModule: string; user: any }) {
  const [ward, setWard] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [diary, setDiary] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);

  const refresh = () => {
    // Find ward user
    if (user?.wardId) {
      api.platformUsers().then(all => {
        const w = all.find(u => u.id === user.wardId);
        setWard(w || null);
        if (w) {
          api.getAttendance({ studentId: w.id }).then(setAttendance).catch(() => {});
          api.getResults({ studentId: w.id }).then(setResults).catch(() => {});
          api.getFees({ studentId: w.id }).then(setFees).catch(() => {});
          if (w.branchId) api.getDiary({ branchId: w.branchId }).then(setDiary).catch(() => {});
        }
      }).catch(() => {});
    }
    if (user?.id) api.getComplaints({ parentId: user.id }).then(setComplaints).catch(() => {});
  };
  useEffect(() => { refresh(); }, [user?.id, user?.wardId]);

  if (activeModule === 'ward-attendance') return <WardAttendance ward={ward} attendance={attendance} />;
  if (activeModule === 'ward-results') return <WardResults ward={ward} results={results} />;
  if (activeModule === 'ward-fees') return <WardFees ward={ward} fees={fees} user={user} />;
  if (activeModule === 'ward-diary') return <WardDiary diary={diary} />;
  if (activeModule === 'complaints') return <ParentComplaints user={user} complaints={complaints} onSaved={refresh} />;
  if (activeModule === 'complaint-portal') return <Suspense fallback={<ModuleFallback />}><ComplaintPortalModule user={user} /></Suspense>;
  if (activeModule === 'live-transport') return <Suspense fallback={<ModuleFallback />}><LiveTransportModule /></Suspense>;
  if (activeModule === 'campus-wallet') return <Suspense fallback={<ModuleFallback />}><CampusWalletModule /></Suspense>;
  if (activeModule === 'ptm-scheduling') return <Suspense fallback={<ModuleFallback />}><PtmSchedulingModule /></Suspense>;
  if (activeModule === 'health-records') return <Suspense fallback={<ModuleFallback />}><HealthRecordsModule /></Suspense>;
  return <ParentOverview user={user} ward={ward} attendance={attendance} results={results} fees={fees} />;
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

function ParentOverview({ user, ward, attendance, results, fees }: any) {
  const feePaid = fees.filter(f => f.status === 'Paid').reduce((a:number, f:any) => a + f.amount, 0);
  const cards = [
    { label: "Ward's Attendance", value: attendance?.rate != null ? attendance.rate + '%' : '—', icon: CalendarCheck },
    { label: 'Avg Score', value: results?.avgPercentage != null ? results.avgPercentage + '%' : '—', icon: GraduationCap },
    { label: 'Fees Paid', value: fmtMoney(feePaid), icon: CreditCard },
    { label: 'Results', value: results?.total ?? 0, icon: Award },
  ];
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-[oklch(0.5_0.04_260)_/_0.15] blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15"><Heart className="h-3 w-3 text-white/80" /> Parent · {user?.instituteName}</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Hello, {user?.name?.split(' ')[0]}</h1>
          <p className="text-white/80 text-sm mt-1.5">Tracking progress for your ward, <strong>{ward?.name || user?.ward || '—'}</strong>{ward ? ` · ${ward.class} ${ward.section}` : ''}.</p>
        </div>
      </motion.div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 border border-border rounded-lg shadow-sm hover:shadow-md transition">
              <div className="h-11 w-11 rounded-xl bg-primary/10 grid place-items-center mb-3"><c.icon className="h-5 w-5 text-primary" /></div>
              <div className="text-2xl sm:text-3xl font-extrabold tabular-nums">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>
      {!ward ? (
        <EmptyState icon={Heart} title="Ward not linked yet" desc="Your account isn't linked to a student yet. Please contact your school's Branch Manager." />
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-bold text-base mb-3">Ward's Recent Attendance</h3>
            {!attendance || attendance.total === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">No attendance records yet.</div>
            ) : (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" /><div className="text-xl font-bold">{attendance.present}</div><div className="text-xs text-muted-foreground">Present</div></div>
                <div><XCircle className="h-6 w-6 text-rose-600 mx-auto mb-1" /><div className="text-xl font-bold">{attendance.absent}</div><div className="text-xs text-muted-foreground">Absent</div></div>
                <div><Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" /><div className="text-xl font-bold">{attendance.late}</div><div className="text-xs text-muted-foreground">Late</div></div>
              </div>
            )}
          </Card>
          <Card className="p-5">
            <h3 className="font-bold text-base mb-3">Ward's Recent Results</h3>
            {!results || results.total === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">No results posted yet.</div>
            ) : (
              <div className="space-y-2">
                {results.entries.slice(0, 5).map((r:any) => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                    <div><div className="font-medium text-sm">{r.subject}</div><div className="text-[11px] text-muted-foreground">{r.exam}</div></div>
                    <Badge variant="outline" className="font-bold">{r.marks}/{r.totalMarks} · {r.grade}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function WardAttendance({ ward, attendance }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Ward's Attendance" subtitle={ward ? `${ward.name} · ${ward.class} ${ward.section}` : 'Tracking your ward'} />
      {!attendance || attendance.total === 0 ? (
        <EmptyState icon={CalendarCheck} title="No attendance records yet" desc="Your ward's teachers haven't marked any attendance yet." />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3">
            <Card className="p-4 text-center"><CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.present}</div><div className="text-xs text-muted-foreground">Present</div></Card>
            <Card className="p-4 text-center"><XCircle className="h-6 w-6 text-rose-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.absent}</div><div className="text-xs text-muted-foreground">Absent</div></Card>
            <Card className="p-4 text-center"><Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.late}</div><div className="text-xs text-muted-foreground">Late</div></Card>
            <Card className="p-4 text-center bg-emerald-500/10"><CalendarCheck className="h-6 w-6 text-emerald-600 mx-auto mb-1" /><div className="text-2xl font-bold text-emerald-600">{attendance.rate}%</div><div className="text-xs text-muted-foreground">Rate</div></Card>
          </div>
          <Card className="p-4">
            {attendance.entries.map((e:any) => (
              <div key={e.id} className="flex items-center justify-between p-2 border-b border-border/40 last:border-0">
                <div className="text-sm">{e.date}</div>
                <Badge variant="outline" className={e.status === 'Present' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : e.status === 'Absent' ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}>{e.status}</Badge>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

function WardResults({ ward, results }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Ward's Results" subtitle={ward ? `${ward.name} · ${ward.class} ${ward.section}` : 'Your ward'} />
      {!results || results.total === 0 ? (
        <EmptyState icon={GraduationCap} title="No results posted yet" desc="Your ward's teachers haven't posted any results yet." />
      ) : (
        <Card className="p-5">
          <div className="space-y-3">
            {results.entries.map((r:any) => (
              <div key={r.id} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/15 grid place-items-center shrink-0"><BookOpen className="h-4 w-4 text-emerald-600" /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1"><span className="font-medium text-sm">{r.subject}</span><span className="font-bold text-sm">{r.marks}/{r.totalMarks}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${r.percentage}%` }} /></div>
                  <div className="text-[11px] text-muted-foreground mt-1">{r.exam} · {r.date}</div>
                </div>
                <Badge variant="outline" className="font-bold">{r.grade}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function WardFees({ ward, fees, user }: any) {
  const totalPaid = fees.filter(f => f.status === 'Paid').reduce((a:number, f:any) => a + f.amount, 0);
  const [amount, setAmount] = useState(1200);
  const [paying, setPaying] = useState(false);

  const pay = async () => {
    setPaying(true);
    try {
      await api.payFee({ studentId: ward?.id, instituteId: user.instituteId, branchId: user.branchId || ward?.branchId, amount, type: 'Tuition', method: 'Online' });
      toast({ title: 'Payment successful!', description: `${fmtMoney(amount)} paid` });
    } catch (e: any) { toast({ title: 'Payment failed', description: e.message, variant: 'destructive' }); }
    finally { setPaying(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Pay Fees" subtitle={ward ? `For ${ward.name}` : 'Fee management'} />
      <Card className="p-5 border border-border rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div><div className="text-xs text-muted-foreground">Total Paid</div><div className="text-3xl font-extrabold mt-1">{fmtMoney(totalPaid)}</div><div className="text-xs text-muted-foreground mt-1">{fees.length} transactions</div></div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center"><CreditCard className="h-6 w-6 text-primary" /></div>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-bold text-base mb-3">Make a Payment</h3>
        <div className="flex gap-2">
          <Input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)} className="flex-1" />
          <Button className="bg-primary hover:bg-primary/90 text-white" disabled={paying} onClick={pay}>{paying ? 'Processing…' : 'Pay Now'}</Button>
        </div>
      </Card>
      {fees.length === 0 ? (
        <EmptyState icon={CreditCard} title="No transactions yet" desc="Fee payments will appear here once recorded." />
      ) : (
        <Card className="p-4">
          {fees.map((f:any) => (
            <div key={f.id} className="flex items-center justify-between p-3 border-b border-border/40 last:border-0">
              <div><div className="font-mono text-sm">{f.id}</div><div className="text-[11px] text-muted-foreground">{f.date} · {f.type}</div></div>
              <div className="text-right"><div className="font-bold text-sm">{fmtMoney(f.amount)}</div><Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20">{f.status}</Badge></div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function WardDiary({ diary }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Ward's Diary" subtitle="Homework & assignments from teachers" />
      {diary.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No diary entries yet" desc="Your ward's teachers haven't posted any homework yet." />
      ) : (
        <div className="space-y-3">
          {diary.map((d:any) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><div className="font-medium text-sm">{d.title}</div><div className="text-[11px] text-muted-foreground">{d.subject} · {d.date}</div></div>
                <Badge variant="outline" className={d.due ? 'text-amber-600 bg-amber-500/10 border-amber-500/20' : 'text-muted-foreground'}>{d.due || 'No deadline'}</Badge>
              </div>
              {d.desc && <p className="text-sm text-muted-foreground">{d.desc}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ParentComplaints({ user, complaints, onSaved }: any) {
  const [form, setForm] = useState({ subject: '', type: 'General', priority: 'Medium' });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const submit = async () => {
    if (!form.subject) { toast({ title: 'Subject required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await api.createComplaint({ parentId: user.id, studentId: user.wardId, instituteId: user.instituteId, branchId: user.branchId, ...form });
      toast({ title: 'Complaint submitted!', description: 'The school will respond shortly.' });
      setForm({ subject: '', type: 'General', priority: 'Medium' });
      setShowForm(false);
      onSaved();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Complaints" subtitle="Raise concerns & track resolution"
        actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowForm(v => !v)}><MessageCircleWarning className="h-4 w-4 mr-1.5" /> New Complaint</Button>} />
      {showForm && (
        <Card className="p-5">
          <div className="space-y-3">
            <div><Label className="text-xs">Subject *</Label><Input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Describe your concern" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Type</Label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full mt-1 h-9 rounded-md border border-border bg-card px-2 text-sm">
                  <option>General</option><option>Fee Dispute</option><option>Transport Issue</option><option>Academic Concern</option><option>Facilities</option>
                </select>
              </div>
              <div><Label className="text-xs">Priority</Label>
                <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full mt-1 h-9 rounded-md border border-border bg-card px-2 text-sm">
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </div>
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={saving} onClick={submit}>{saving ? 'Submitting…' : 'Submit Complaint'}</Button>
          </div>
        </Card>
      )}
      {complaints.length === 0 ? (
        <EmptyState icon={MessageCircleWarning} title="No complaints yet" desc="Raise a concern and the school will respond. Your complaints will appear here." />
      ) : (
        <div className="space-y-3">
          {complaints.map((c:any) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium text-sm">{c.subject}</div>
                <Badge variant="outline" className={c.status === 'Resolved' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : c.status === 'Open' ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}>{c.status}</Badge>
              </div>
              <div className="text-[11px] text-muted-foreground">{c.type} · {c.priority} priority · {c.date}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
