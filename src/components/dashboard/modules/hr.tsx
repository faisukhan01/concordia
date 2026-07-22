'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModuleHeader } from './students';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, UserPlus, Search, Download, Briefcase, DollarSign, Calendar, Mail } from 'lucide-react';

const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US');

export function HrModule() {
  const [staff, setStaff] = useState<any[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => { api.staff().then(setStaff).catch(()=>{}); }, []);

  const filtered = staff.filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()) || s.department.toLowerCase().includes(q.toLowerCase()));

  const totalSalary = staff.reduce((a,s) => a + s.salary, 0);
  const onLeave = staff.filter(s => s.status === 'On Leave').length;
  const avgAttendance = staff.reduce((a,s) => a + s.attendance, 0) / Math.max(staff.length, 1);

  const cards = [
    { label: 'Total Staff', value: staff.length, icon: Users, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Departments', value: 8, icon: Briefcase, color: 'from-teal-500 to-cyan-600' },
    { label: 'On Leave', value: onLeave, icon: Calendar, color: 'from-amber-500 to-yellow-600' },
    { label: 'Monthly Payroll', value: fmtMoney(totalSalary), icon: DollarSign, color: 'from-violet-500 to-purple-600' },
  ];

  const deptData = ['Administration','Mathematics','Science','English','Social Studies','Sports','IT','Finance'].map((d,i) => ({
    dept: d, count: staff.filter(s => s.department === d).length,
  }));

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="HR Management"
        subtitle="Elevate HR excellence — departments, payroll, attendance & leave"
        actions={<>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" /> Salary Slips</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><UserPlus className="h-4 w-4 mr-1.5" /> New Employee</Button>
        </>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 relative overflow-hidden">
              <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-2xl`} />
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center mb-3`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold font-display">{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {deptData.map(d => (
          <Card key={d.dept} className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 grid place-items-center"><Users className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <div className="font-bold text-lg">{d.count}</div>
              <div className="text-[11px] text-muted-foreground">{d.dept}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search employees…" className="pl-9" />
        </div>
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="hidden md:table-cell">Designation</TableHead>
                <TableHead className="hidden lg:table-cell">Attendance</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8"><AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-xs font-bold">{s.name.split(' ').map((n:string)=>n[0]).slice(0,2).join('')}</AvatarFallback></Avatar>
                      <div>
                        <div className="font-medium text-sm">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground">{s.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{s.department}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{s.designation}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-14 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${s.attendance >= 90 ? 'bg-emerald-500' : s.attendance >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${s.attendance}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{s.attendance}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-sm">{fmtMoney(s.salary)}</TableCell>
                  <TableCell><Badge variant="outline" className={s.status === 'Active' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}>{s.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
