'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api, type Stats } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, CalendarCheck, DollarSign, GraduationCap, TrendingUp, TrendingDown,
  ArrowUpRight, Bell, BookOpen, Bus, Trophy, AlertCircle, PhoneCall,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';

const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US');

export function DashboardOverview({ stats }: { stats: Stats | null }) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    api.attendanceSeries().then(setAttendance).catch(() => {});
    api.feeMonthly().then(setFees).catch(() => {});
    api.resultsSubjects().then(setResults).catch(() => {});
  }, []);

  const kpis = [
    { label: 'Total Students', value: stats?.totalStudents?.toLocaleString() || '—', icon: Users, trend: stats?.enrollmentTrend, color: 'from-blue-600 to-blue-800', accent: 'text-blue-700' },
    { label: 'Attendance Today', value: stats ? stats.attendanceToday + '%' : '—', icon: CalendarCheck, trend: '+1.2%', color: 'from-blue-500 to-blue-700', accent: 'text-blue-700' },
    { label: 'Fee Collected (mo)', value: stats ? fmtMoney(stats.feeCollected) : '—', icon: DollarSign, trend: stats?.revenueTrend, color: 'from-blue-500 to-blue-700', accent: 'text-blue-700' },
    { label: 'Average GPA', value: stats?.avgGPA?.toFixed(2) || '—', icon: GraduationCap, trend: '+0.08', color: 'from-blue-600 to-blue-800', accent: 'text-blue-700' },
  ];

  const quickStats = [
    { label: 'Active Inquiries', value: stats?.activeInquiries, icon: PhoneCall },
    { label: 'Open Complaints', value: stats?.openComplaints, icon: AlertCircle },
    { label: 'Books Issued', value: stats?.booksIssued, icon: BookOpen },
    { label: 'Transport Routes', value: stats?.routes, icon: Bus },
    { label: 'Upcoming Events', value: stats?.eventsUpcoming, icon: Trophy },
    { label: 'Total Staff', value: stats?.totalStaff, icon: Users },
  ];

  const pieData = [
    { name: 'Present', value: 1142, color: '#1a365d' },
    { name: 'Absent', value: 58, color: '#f43f5e' },
    { name: 'Late', value: 48, color: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 p-6 sm:p-8 text-white"
      >
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-300 animate-pulse" /> Live · Spring Semester 2025
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Good morning, Administrator</h1>
            <p className="text-blue-50/80 text-sm mt-1.5 max-w-lg">
              Here's what's happening across your campus today. {stats?.totalStudents.toLocaleString()} students, {stats?.totalStaff} staff, and {stats?.attendanceToday}% attendance.
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-white text-blue-800 hover:bg-blue-50" size="sm">
              <Bell className="h-4 w-4 mr-1.5" /> Send Alert
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" size="sm">
              View Reports
            </Button>
          </div>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition relative overflow-hidden">
              <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${k.color} opacity-10 blur-2xl`} />
              <div className="flex items-start justify-between">
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${k.color} grid place-items-center shadow-md`}>
                  <k.icon className="h-5 w-5 text-white" />
                </div>
                <Badge variant="outline" className={`gap-1 ${k.accent} border-current/20`}>
                  <TrendingUp className="h-3 w-3" /> {k.trend}
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-extrabold font-display">{k.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Attendance area chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base">Attendance — last 30 days</h3>
              <p className="text-xs text-muted-foreground">Daily present, absent & late counts</p>
            </div>
            <Badge variant="outline" className="gap-1 text-blue-700 border-blue-500/30">
              <TrendingUp className="h-3 w-3" /> {stats?.attendanceToday}% today
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={attendance} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a365d" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#1a365d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={5} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Area type="monotone" dataKey="present" stroke="#1a365d" strokeWidth={2} fill="url(#gP)" />
              <Area type="monotone" dataKey="absent" stroke="#f43f5e" strokeWidth={2} fill="url(#gA)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Today's attendance pie */}
        <Card className="p-5">
          <h3 className="font-bold text-base mb-1">Today's Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-4">Present vs absent vs late</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map(p => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} /> {p.name}</span>
                <span className="font-semibold">{p.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Fee + Results */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base">Fee Collection — 12 months</h3>
              <p className="text-xs text-muted-foreground">Collected vs pending vs overdue</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={fees} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => '$' + (v/1000) + 'k'} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: any) => fmtMoney(v)} />
              <Bar dataKey="collected" stackId="a" fill="#1a365d" radius={[0,0,0,0]} />
              <Bar dataKey="pending" stackId="a" fill="#3b82f6" radius={[0,0,0,0]} />
              <Bar dataKey="overdue" stackId="a" fill="#f43f5e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base">Subject Performance</h3>
              <p className="text-xs text-muted-foreground">Average score by subject</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={results} layout="vertical" margin={{ top: 5, right: 12, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} horizontal={false} />
              <XAxis type="number" domain={[0,100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="subject" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={90} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="avgScore" fill="#1a365d" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickStats.map((q, i) => (
          <motion.div key={q.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-4 hover:shadow-md transition">
              <q.icon className="h-5 w-5 text-blue-700 mb-2" />
              <div className="text-xl font-extrabold font-display">{q.value}</div>
              <div className="text-[11px] text-muted-foreground">{q.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
