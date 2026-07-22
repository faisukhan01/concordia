'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModuleHeader } from './students';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  DollarSign, TrendingUp, AlertTriangle, CreditCard, Wallet, Receipt, Download, Send,
} from 'lucide-react';

const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US');

export function FeesModule() {
  const [fees, setFees] = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);

  useEffect(() => {
    api.feeMonthly().then(setFees).catch(()=>{});
    api.feeDefaulters().then(setDefaulters).catch(()=>{});
  }, []);

  const totalCollected = fees.reduce((a,f) => a + f.collected, 0);
  const totalPending = fees.reduce((a,f) => a + f.pending, 0);
  const totalOverdue = fees.reduce((a,f) => a + f.overdue, 0);

  const cards = [
    { label: 'Collected (YTD)', value: fmtMoney(totalCollected), icon: Wallet, color: 'from-emerald-500 to-emerald-700', trend: '+12.1%' },
    { label: 'Pending', value: fmtMoney(totalPending), icon: Receipt, color: 'from-amber-500 to-yellow-600', trend: '-3.4%' },
    { label: 'Overdue', value: fmtMoney(totalOverdue), icon: AlertTriangle, color: 'from-rose-500 to-red-600', trend: '+1.2%' },
    { label: 'Online Payments', value: '34%', icon: CreditCard, color: 'from-violet-500 to-purple-600', trend: '+8.0%' },
  ];

  const pieData = [
    { name: 'Collected', value: totalCollected, color: '#10b981' },
    { name: 'Pending', value: totalPending, color: '#f59e0b' },
    { name: 'Overdue', value: totalOverdue, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Fee Management"
        subtitle="Streamline finances, elevate excellence — vouchers, online payment & defaulter tracking"
        actions={<>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" /> Export</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><Receipt className="h-4 w-4 mr-1.5" /> Generate Voucher</Button>
        </>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 relative overflow-hidden">
              <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-2xl`} />
              <div className="flex items-start justify-between">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center`}>
                  <c.icon className="h-5 w-5 text-white" />
                </div>
                <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-500/20"><TrendingUp className="h-3 w-3" /> {c.trend}</Badge>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-extrabold font-display">{c.value}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold text-base mb-1">Fee Collection — 12 months</h3>
          <p className="text-xs text-muted-foreground mb-4">Monthly collected vs pending vs overdue</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={fees} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => '$' + (v/1000) + 'k'} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: any) => fmtMoney(v)} />
              <Bar dataKey="collected" stackId="a" fill="#10b981" />
              <Bar dataKey="pending" stackId="a" fill="#f59e0b" />
              <Bar dataKey="overdue" stackId="a" fill="#f43f5e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-base mb-1">Fee Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Year-to-date breakdown</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                {pieData.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v:any)=>fmtMoney(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {pieData.map(p => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} /> {p.name}</span>
                <span className="font-semibold">{fmtMoney(p.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-rose-500" /> Defaulters List</h3>
            <p className="text-xs text-muted-foreground">{defaulters.length} students with pending or overdue fees</p>
          </div>
          <Button size="sm" variant="outline" className="text-amber-600 border-amber-500/30"><Send className="h-4 w-4 mr-1.5" /> Send Reminders</Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto scroll-fancy">
          {defaulters.map(d => (
            <div key={d.id} className="p-3 rounded-xl border border-border/60 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{d.name}</div>
                  <div className="text-[11px] text-muted-foreground">{d.id} · {d.class} {d.section}</div>
                </div>
                <Badge variant="outline" className={d.feeStatus === 'Overdue' ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}>{d.feeStatus}</Badge>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                <span className="text-xs text-muted-foreground">Outstanding</span>
                <span className="font-bold text-sm text-rose-600">{fmtMoney(d.feeAmount - d.feePaid)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
