'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { ModuleHeader } from './students';
import {
  Wallet, Plus, ArrowDownLeft, ArrowUpRight, TrendingDown, Coffee,
  Printer, BookOpen, Bus, Settings, Shield, Activity, Pencil, Download,
} from 'lucide-react';

type TxnCategory = 'cafeteria' | 'printing' | 'bookshop' | 'transport' | 'stationery' | 'topup' | 'refund';

type Txn = {
  id: string;
  merchant: string;
  category: TxnCategory;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  date: string;
  time: string;
  reference: string;
};

const INITIAL_TXNS: Txn[] = [
  { id: 't1', merchant: 'Cafeteria — Lunch Combo', category: 'cafeteria', amount: -240, balanceBefore: 2690, balanceAfter: 2450, date: 'Today', time: '12:35 PM', reference: 'ESM-W-2410-T1' },
  { id: 't2', merchant: 'Print Job — 14 pages', category: 'printing', amount: -70, balanceBefore: 2760, balanceAfter: 2690, date: 'Today', time: '10:12 AM', reference: 'ESM-W-2410-T2' },
  { id: 't3', merchant: 'Bookshop — Physics Notebook', category: 'bookshop', amount: -350, balanceBefore: 3110, balanceAfter: 2760, date: 'Yesterday', time: '04:48 PM', reference: 'ESM-W-2409-T3' },
  { id: 't4', merchant: 'Wallet Top-up (Parent)', category: 'topup', amount: 2000, balanceBefore: 1110, balanceAfter: 3110, date: 'Yesterday', time: '09:15 AM', reference: 'ESM-W-2409-T4' },
  { id: 't5', merchant: 'Transport — Monthly Pass', category: 'transport', amount: -660, balanceBefore: 1770, balanceAfter: 1110, date: 'Oct 12', time: '08:00 AM', reference: 'ESM-W-2412-T5' },
  { id: 't6', merchant: 'Stationery — Geometry Box', category: 'stationery', amount: -180, balanceBefore: 1950, balanceAfter: 1770, date: 'Oct 11', time: '01:22 PM', reference: 'ESM-W-2411-T6' },
];

const CATEGORIES: { id: TxnCategory; label: string; amount: number; color: string; icon: typeof Coffee; tint: string }[] = [
  { id: 'cafeteria', label: 'Cafeteria', amount: 4280, color: '#f59e0b', icon: Coffee, tint: 'from-amber-500 to-yellow-600' },
  { id: 'bookshop', label: 'Bookshop', amount: 2100, color: '#f43f5e', icon: BookOpen, tint: 'from-rose-500 to-pink-600' },
  { id: 'printing', label: 'Printing', amount: 1450, color: '#10b981', icon: Printer, tint: 'from-emerald-500 to-teal-600' },
  { id: 'transport', label: 'Transport', amount: 1080, color: '#0B1F3A', icon: Bus, tint: 'from-primary to-primary/80' },
  { id: 'stationery', label: 'Stationery', amount: 720, color: '#8b5cf6', icon: Pencil, tint: 'from-violet-500 to-purple-600' },
];

const MONTHLY_TREND = [
  { month: 'May', amount: 7200 },
  { month: 'Jun', amount: 8100 },
  { month: 'Jul', amount: 6800 },
  { month: 'Aug', amount: 9400 },
  { month: 'Sep', amount: 9700 },
  { month: 'Oct', amount: 8910 },
];

const fmtPKR = (n: number) =>
  'PKR ' + Math.abs(n).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const AUTO_RELOAD_THRESHOLD = 500;
const PAYMENT_METHODS = [
  { id: 'jazzcash', label: 'JazzCash', hint: 'Mobile account' },
  { id: 'easypaisa', label: 'Easypaisa', hint: 'Mobile account' },
  { id: 'card', label: 'Debit / Credit Card', hint: 'Visa · Mastercard' },
] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number]['id'];

// Donut segment math — circle of given radius has circumference 2πr; we map
// each segment's percentage to a stroke-dasharray slice.
function buildSegments(total: number, radius = 60) {
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return CATEGORIES.map((c) => {
    const pct = total > 0 ? c.amount / total : 0;
    const dash = pct * circumference;
    const seg = {
      id: c.id,
      color: c.color,
      dash,
      gap: circumference - dash,
      offset: -offset,
      pct: Math.round(pct * 100),
      label: c.label,
      amount: c.amount,
    };
    offset += dash;
    return seg;
  });
}

export default function CampusWalletModule() {
  const [balance, setBalance] = useState(2450);
  const [txns, setTxns] = useState<Txn[]>(INITIAL_TXNS);
  const [walletLoading, setWalletLoading] = useState(true);
  const [autoReload, setAutoReload] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('1000');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('jazzcash');
  const [detailTxn, setDetailTxn] = useState<Txn | null>(null);
  const [hoveredSeg, setHoveredSeg] = useState<string | null>(null);

  // Fetch wallet balance + transactions in parallel on mount. Falls back to
  // INITIAL_TXNS + the default 2450 balance on error so the UI never breaks.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setWalletLoading(true);
      try {
        const [balRes, txnRes] = await Promise.all([
          api.getWalletBalance(),
          api.getWalletTransactions(undefined, 20),
        ]);
        if (cancelled) return;
        if (typeof balRes.balance === 'number') setBalance(balRes.balance);
        if (balRes.autoReload) setAutoReload(balRes.autoReload);
        if (txnRes.transactions && txnRes.transactions.length > 0) {
          const mapped: Txn[] = txnRes.transactions.map((t) => ({
            id: t.id,
            merchant: t.merchant,
            category: t.type,
            amount: t.amount,
            balanceBefore: t.balanceBefore,
            balanceAfter: t.balanceAfter,
            date: t.date,
            time: t.time,
            reference: t.referenceNo,
          }));
          setTxns(mapped);
        }
      } catch {
        // keep INITIAL_TXNS + default balance fallback
      } finally {
        if (!cancelled) setWalletLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const monthlySpend = useMemo(
    () => CATEGORIES.reduce((a, c) => a + c.amount, 0),
    [],
  );

  const segments = useMemo(() => buildSegments(monthlySpend), [monthlySpend]);
  const trendMax = Math.max(...MONTHLY_TREND.map((m) => m.amount));

  const confirmTopUp = () => {
    const amt = parseFloat(topUpAmount);
    if (!amt || amt <= 0) {
      toast({ title: 'Invalid amount', description: 'Enter a positive amount to top up.', variant: 'destructive' });
      return;
    }
    const before = balance;
    const after = before + amt;
    const newTxn: Txn = {
      id: `t-${Date.now()}`,
      merchant: `Wallet Top-up (${PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label})`,
      category: 'topup',
      amount: amt,
      balanceBefore: before,
      balanceAfter: after,
      date: 'Just now',
      time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
      reference: `ESM-W-TOP-${Date.now().toString().slice(-6)}`,
    };
    setBalance(after);
    setTxns((prev) => [newTxn, ...prev]);
    setTopUpOpen(false);
    toast({
      title: 'Top up successful',
      description: `${fmtPKR(amt)} added via ${PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label}.`,
    });
  };

  const downloadReceipt = (t: Txn) => {
    toast({ title: 'Generating PDF…', description: `Receipt ${t.reference}` });
    setTimeout(() => {
      toast({ title: 'Receipt downloaded', description: `${t.reference}.pdf saved to Downloads.` });
    }, 900);
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Campus Wallet"
        subtitle="Cashless campus payments — cafeteria, printing, bookshop, transport — all from one prepaid wallet"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-3 py-1.5">
              <Switch checked={autoReload} onCheckedChange={setAutoReload} />
              <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Auto-Reload</span>
            </div>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setTopUpOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Top Up
            </Button>
          </div>
        }
      />

      {autoReload && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-3 border-amber-500/30 bg-amber-500/5">
            <div className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Auto-reloads when balance &lt; {fmtPKR(AUTO_RELOAD_THRESHOLD)}. Default source: JazzCash.
            </div>
          </Card>
        </motion.div>
      )}

      {/* Wallet hero + spending donut */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Wallet hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-0 overflow-hidden">
            <div className="relative p-6 bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 text-white overflow-hidden">
              <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/15 blur-3xl" />
              <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-amber-900/30 blur-3xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" /> Campus Wallet
                  </div>
                  <div className="mt-2 text-4xl font-extrabold tracking-tight tabular-nums">
                    {fmtPKR(balance)}
                  </div>
                  <div className="mt-1 text-xs text-white/80">Available balance · Updated just now</div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/15 grid place-items-center backdrop-blur">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="relative mt-5 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-white/10 p-2.5">
                  <div className="text-white/70 text-[10px] uppercase">Spent this month</div>
                  <div className="font-bold mt-0.5">{fmtPKR(monthlySpend)}</div>
                </div>
                <div className="rounded-lg bg-white/10 p-2.5">
                  <div className="text-white/70 text-[10px] uppercase">Auto-reload at</div>
                  <div className="font-bold mt-0.5">{fmtPKR(AUTO_RELOAD_THRESHOLD)}</div>
                </div>
                <div className="rounded-lg bg-white/10 p-2.5">
                  <div className="text-white/70 text-[10px] uppercase">Card status</div>
                  <div className="font-bold mt-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" /> Active
                  </div>
                </div>
              </div>
              <div className="relative mt-5 flex gap-2">
                <Button size="sm" className="bg-white text-amber-700 hover:bg-amber-50 flex-1" onClick={() => setTopUpOpen(true)}>
                  <Plus className="h-4 w-4 mr-1.5" /> Top Up
                </Button>
                <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 flex-1">
                  <Activity className="h-4 w-4 mr-1.5" /> Transaction History
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Spending categories — real SVG donut */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <Card className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm">Spending Breakdown</h3>
                <p className="text-xs text-muted-foreground">October 2025</p>
              </div>
              <Badge variant="outline" className="text-amber-700 border-amber-500/30 bg-amber-500/10">
                <TrendingDown className="h-3 w-3 mr-1" /> -8% vs Sep
              </Badge>
            </div>
            <div className="flex items-center gap-5">
              <div className="relative h-32 w-32 shrink-0">
                <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                  {segments.map((s) => (
                    <circle
                      key={s.id}
                      cx="70"
                      cy="70"
                      r="60"
                      fill="none"
                      stroke={s.color}
                      strokeWidth="14"
                      strokeDasharray={`${s.dash} ${s.gap}`}
                      strokeDashoffset={s.offset}
                      onMouseEnter={() => setHoveredSeg(s.id)}
                      onMouseLeave={() => setHoveredSeg(null)}
                      className="cursor-pointer transition-opacity"
                      style={{ opacity: hoveredSeg && hoveredSeg !== s.id ? 0.3 : 1 }}
                    />
                  ))}
                </svg>
                <div className="absolute inset-3 rounded-full bg-card grid place-items-center text-center pointer-events-none">
                  {hoveredSeg ? (() => {
                    const seg = segments.find((s) => s.id === hoveredSeg);
                    if (!seg) return null;
                    return (
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{seg.label}</div>
                        <div className="text-base font-bold tabular-nums">{fmtPKR(seg.amount)}</div>
                        <div className="text-[10px] text-muted-foreground">{seg.pct}%</div>
                      </div>
                    );
                  })() : (
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
                      <div className="text-base font-bold tabular-nums">{fmtPKR(monthlySpend)}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const seg = segments.find((s) => s.id === c.id)!;
                  const active = hoveredSeg === c.id;
                  return (
                    <div
                      key={c.id}
                      onMouseEnter={() => setHoveredSeg(c.id)}
                      onMouseLeave={() => setHoveredSeg(null)}
                      className={`flex items-center gap-2 text-xs rounded-md px-1.5 py-1 transition ${active ? 'bg-muted/60' : ''}`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 truncate">{c.label}</span>
                      <span className="font-medium tabular-nums">{fmtPKR(c.amount)}</span>
                      <span className="text-muted-foreground tabular-nums w-9 text-right">{seg.pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly trend mini bar chart */}
            <div className="mt-5 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">6-month spend trend</div>
                <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-500/30 bg-emerald-500/10">
                  Avg {fmtPKR(Math.round(MONTHLY_TREND.reduce((a, m) => a + m.amount, 0) / MONTHLY_TREND.length))}
                </Badge>
              </div>
              <div className="flex items-end gap-2 h-20">
                {MONTHLY_TREND.map((m, i) => {
                  const h = Math.max(8, Math.round((m.amount / trendMax) * 64));
                  const isLast = i === MONTHLY_TREND.length - 1;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: h }}
                        transition={{ delay: i * 0.05, type: 'spring', stiffness: 120 }}
                        className={`w-full rounded-t-md ${isLast ? 'bg-amber-500' : 'bg-amber-500/40'}`}
                        style={{ height: h }}
                      />
                      <span className="text-[9px] text-muted-foreground">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent transactions */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">Recent Transactions</h3>
          <Button size="sm" variant="ghost" className="text-xs">View all</Button>
        </div>
        <div className="space-y-1.5">
          {walletLoading ? (
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </>
          ) : (
          txns.map((t) => {
            const isTopup = t.amount > 0;
            const cat = CATEGORIES.find((c) => c.id === t.category);
            const Icon = cat?.icon ?? Coffee;
            return (
              <motion.button
                key={t.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setDetailTxn(t)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition text-left"
              >
                <div className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 bg-gradient-to-br ${cat?.tint ?? 'from-emerald-500 to-teal-600'}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{t.merchant}</div>
                  <div className="text-[11px] text-muted-foreground">{t.date} · {t.time}</div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold text-sm tabular-nums ${isTopup ? 'text-emerald-600' : 'text-foreground'}`}>
                    {isTopup ? '+' : '−'}{fmtPKR(t.amount)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Bal {fmtPKR(t.balanceAfter)}</div>
                </div>
                <div className="shrink-0">
                  {isTopup ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">Top Up</Badge>
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </motion.button>
            );
          })
          )}
        </div>
      </Card>

      {/* Parent controls */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 grid place-items-center">
            <Shield className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <div className="font-semibold text-sm">Parent Controls</div>
            <div className="text-xs text-muted-foreground">
              Set spending limits, auto-reload threshold, and merchant restrictions.
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => toast({ title: 'Coming soon', description: 'Parent controls panel is being redesigned.' })}>
          <Settings className="h-4 w-4 mr-1.5" /> Manage
        </Button>
      </Card>

      {/* Top Up Dialog */}
      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Top Up Campus Wallet</DialogTitle>
            <DialogDescription>Choose an amount and payment method. Funds arrive instantly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Amount (PKR)</label>
              <Input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                min={1}
                className="tabular-nums"
              />
              <div className="flex gap-1.5 pt-1">
                {[500, 1000, 2000, 5000].map((q) => (
                  <button
                    key={q}
                    onClick={() => setTopUpAmount(String(q))}
                    className="text-xs px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 transition"
                  >
                    +{q.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Payment method</label>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.id}
                    htmlFor={`pm-${m.id}`}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition ${
                      paymentMethod === m.id ? 'border-amber-500/40 bg-amber-500/5' : 'border-border hover:bg-muted/40'
                    }`}
                  >
                    <RadioGroupItem value={m.id} id={`pm-${m.id}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{m.label}</div>
                      <div className="text-[11px] text-muted-foreground">{m.hint}</div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopUpOpen(false)}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={confirmTopUp}>
              <ArrowDownLeft className="h-4 w-4 mr-1.5" /> Confirm Top Up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction detail Sheet */}
      <Sheet open={!!detailTxn} onOpenChange={(o) => !o && setDetailTxn(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Transaction Details</SheetTitle>
            <SheetDescription>Reference {detailTxn?.reference}</SheetDescription>
          </SheetHeader>
          {detailTxn && (
            <div className="px-4 pb-4 space-y-4 overflow-y-auto">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl grid place-items-center shrink-0 bg-gradient-to-br ${CATEGORIES.find((c) => c.id === detailTxn.category)?.tint ?? 'from-emerald-500 to-teal-600'}`}>
                  {(() => {
                    const Icon = CATEGORIES.find((c) => c.id === detailTxn.category)?.icon ?? Coffee;
                    return <Icon className="h-6 w-6 text-white" />;
                  })()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{detailTxn.merchant}</div>
                  <div className="text-[11px] text-muted-foreground">{detailTxn.date} · {detailTxn.time}</div>
                </div>
              </div>
              <div className="rounded-xl border border-border p-4 space-y-2.5 text-sm">
                <Row label="Amount" value={`${detailTxn.amount > 0 ? '+' : '−'}${fmtPKR(detailTxn.amount)}`} highlight={detailTxn.amount > 0 ? 'emerald' : undefined} />
                <Row label="Balance before" value={fmtPKR(detailTxn.balanceBefore)} />
                <Row label="Balance after" value={fmtPKR(detailTxn.balanceAfter)} />
                <Row label="Category" value={CATEGORIES.find((c) => c.id === detailTxn.category)?.label ?? 'Other'} />
                <Row label="Reference" value={detailTxn.reference} mono />
                <Row label="Status" value={detailTxn.amount > 0 ? 'Credited' : 'Settled'} />
              </div>
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={() => downloadReceipt(detailTxn)}>
                <Download className="h-4 w-4 mr-1.5" /> Download Receipt
              </Button>
            </div>
          )}
          <SheetFooter>
            <Button variant="outline" onClick={() => setDetailTxn(null)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: 'emerald' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`font-medium ${mono ? 'font-mono text-xs' : ''} ${highlight === 'emerald' ? 'text-emerald-600' : ''}`}>{value}</span>
    </div>
  );
}
