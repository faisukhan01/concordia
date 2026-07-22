'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModuleHeader } from './students';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import {
  CalendarCheck, Fingerprint, ScanLine, Radio, Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp,
} from 'lucide-react';

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export function AttendanceModule() {
  const [series, setSeries] = useState<any[]>([]);

  useEffect(() => { api.attendanceSeries().then(setSeries).catch(()=>{}); }, []);

  const today = series[series.length - 1] || { present: 0, absent: 0, late: 0, rate: 0 };
  const rateData = series.slice(-14).map(s => ({ date: s.date.slice(5), rate: s.rate }));

  const cards = [
    { label: 'Present Today', value: today.present, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-700', sub: `${today.rate}% rate` },
    { label: 'Absent Today', value: today.absent, icon: XCircle, color: 'from-rose-500 to-red-600', sub: 'Auto SMS sent' },
    { label: 'Late Arrivals', value: today.late, icon: Clock, color: 'from-amber-500 to-yellow-600', sub: 'Logged to parents' },
    { label: 'Avg Rate (14d)', value: (rateData.reduce((a,s)=>a+s.rate,0)/Math.max(rateData.length,1)).toFixed(1) + '%', icon: TrendingUp, color: 'from-violet-500 to-purple-600', sub: 'Improving' },
  ];

  const methods = [
    { name: 'Thumb Impression', icon: Fingerprint, desc: 'Biometric entry at gates', students: 642, color: 'emerald' },
    { name: 'RFID Cards', icon: Radio, desc: 'Tap-in / tap-out tracking', students: 384, color: 'cyan' },
    { name: 'Barcode Scan', icon: ScanLine, desc: 'Student ID barcode', students: 222, color: 'amber' },
  ];

  const classData = ['Pre-K','Grade 1','Grade 3','Grade 5','Grade 7','Grade 9','Grade 11','Grade 12'].map((c,i) => ({
    class: c, present: 60 + ((i*17)%40), absent: 2 + ((i*7)%8), late: 1 + ((i*5)%6),
  }));

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Attendance Management"
        subtitle="Smartly track, seamlessly manage — Thumb, RFID & Barcode entry"
        actions={<>
          <Button variant="outline" size="sm">Mark Attendance</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Latecomers Report</Button>
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
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold font-display">{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <div className="text-[11px] text-emerald-600 mt-1">{c.sub}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base">Attendance Rate — last 14 days</h3>
              <p className="text-xs text-muted-foreground">Daily attendance percentage</p>
            </div>
            <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 gap-1"><TrendingUp className="h-3 w-3" /> Trending up</Badge>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={rateData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[80, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} fill="url(#gR)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-base mb-1">Entry Methods</h3>
          <p className="text-xs text-muted-foreground mb-4">Today's check-ins by method</p>
          <div className="space-y-3">
            {methods.map(m => (
              <div key={m.name} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition">
                <div className={`h-10 w-10 rounded-lg bg-${m.color}-500/15 grid place-items-center`}>
                  <m.icon className={`h-5 w-5 text-${m.color}-600`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground">{m.desc}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{m.students}</div>
                  <div className="text-[10px] text-muted-foreground">students</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-base mb-4">Class-wise Attendance Today</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={classData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis dataKey="class" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="present" stackId="a" fill="#10b981" radius={[0,0,0,0]} />
            <Bar dataKey="late" stackId="a" fill="#f59e0b" radius={[0,0,0,0]} />
            <Bar dataKey="absent" stackId="a" fill="#f43f5e" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <h3 className="font-bold text-sm">Latecomers — Today</h3>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto scroll-fancy">
          {['Aiden Carter','Sofia Reyes','Mason Patel','Zoe Nguyen','Caleb Kim','Layla Ahmed','Elijah Foster','Nora Tanaka'].map((n,i) => (
            <div key={n} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-amber-500/15 grid place-items-center"><Clock className="h-4 w-4 text-amber-600" /></div>
                <div>
                  <div className="font-medium text-sm">{n}</div>
                  <div className="text-[11px] text-muted-foreground">Grade {(i%5)+3} · arrived {8 + (i%3)}:{(15+i*7)%60 < 10 ? '0' : ''}{(15+i*7)%60} AM</div>
                </div>
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-500/30">{(8 + (i%3))}:{((15+i*7)%60).toString().padStart(2,'0')}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
